const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        auth_id UUID UNIQUE,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone_no TEXT,
        role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

      CREATE TABLE IF NOT EXISTS units (
        unit_id SERIAL PRIMARY KEY,
        unit_code TEXT UNIQUE NOT NULL,
        unit_name TEXT NOT NULL,
        semester_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        project_id SERIAL PRIMARY KEY,
        unit_id INTEGER NOT NULL REFERENCES units(unit_id),
        project_name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS teams (
        team_id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(project_id),
        user_id INTEGER,
        team_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE teams ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES users(id);
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS tutor_id INTEGER REFERENCES users(id);
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT FALSE;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS escalation_note TEXT;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS escalated_by INTEGER REFERENCES users(id);
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP;

      CREATE TABLE IF NOT EXISTS team_members (
        team_id INTEGER REFERENCES teams(team_id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (team_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS feedback (
        feedback_id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(team_id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        source TEXT CHECK (source IN ('client', 'tutor', 'tutor-to-client')) NOT NULL,
        submitted_by INTEGER REFERENCES users(id),
        team_score NUMERIC(3,1),
        team_comment TEXT,
        comment_for_tutors TEXT,
        comment_for_client TEXT,
        submitted_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP;
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS removed_by INTEGER REFERENCES users(id);

      CREATE TABLE IF NOT EXISTS individual_feedback (
        id SERIAL PRIMARY KEY,
        feedback_id INTEGER REFERENCES feedback(feedback_id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id),
        score NUMERIC(3,1),
        comment TEXT
      );

      -- Per-issue escalation tracking: a team can have several open
      -- escalations at once, each aimed at a specific target and
      -- independently resolvable. Replaces the old single
      -- teams.escalation_level flag as the source of truth (that column
      -- is still kept in sync for quick list-view filtering).
      CREATE TABLE IF NOT EXISTS escalations (
        escalation_id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(team_id) ON DELETE CASCADE,
        feedback_id INTEGER REFERENCES feedback(feedback_id) ON DELETE SET NULL,
        target TEXT CHECK (target IN ('coordinator', 'liaison', 'both')) NOT NULL,
        note TEXT,
        status TEXT CHECK (status IN ('open', 'resolved')) NOT NULL DEFAULT 'open',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        resolved_by INTEGER REFERENCES users(id),
        resolved_at TIMESTAMP
      );

      -- A student flagging a piece of client feedback for their tutor's
      -- attention (e.g. a low score they want to discuss).
      CREATE TABLE IF NOT EXISTS student_feedback_alerts (
        alert_id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(team_id) ON DELETE CASCADE,
        feedback_id INTEGER REFERENCES feedback(feedback_id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id),
        reason TEXT NOT NULL,
        status TEXT CHECK (status IN ('open', 'resolved')) NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW(),
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TIMESTAMP
      );

      -- Read-receipt tracking: which staff members have seen a given
      -- piece of feedback. One row per (feedback, user) pair, upserted
      -- on every view.
      CREATE TABLE IF NOT EXISTS feedback_views (
        feedback_id INTEGER REFERENCES feedback(feedback_id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (feedback_id, user_id)
      );

      -- These three tables are exposed through Supabase's public Data API
      -- (gated by the anon key, which ships inside the deployed frontend
      -- bundle and is visible to anyone). This app's own authorization
      -- logic lives entirely in the Express backend, which connects via
      -- DATABASE_URL using the postgres role — a role with BYPASSRLS, so
      -- enabling RLS here has zero effect on this app's own queries. With
      -- no policies defined, RLS enabled simply means: nobody can read or
      -- write these tables through the public anon-key API, which is the
      -- correct state since this app never intends to use that path.
      ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE student_feedback_alerts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE feedback_views ENABLE ROW LEVEL SECURITY;

      CREATE TABLE IF NOT EXISTS meetings (
        meetingid BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        team_id INTEGER REFERENCES teams(team_id) ON DELETE CASCADE,
        client_id INTEGER REFERENCES users(id),
        meeting_date DATE,
        meeting_time TIME,
        attendance VARCHAR,
        product_progression_rating VARCHAR,
        process_teamwork_rating VARCHAR
      );

      CREATE INDEX IF NOT EXISTS idx_meetings_team_id ON meetings(team_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_team_id ON feedback(team_id);
      CREATE INDEX IF NOT EXISTS idx_individual_feedback_feedback_id ON individual_feedback(feedback_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
      CREATE INDEX IF NOT EXISTS idx_escalations_team_id ON escalations(team_id);
      CREATE INDEX IF NOT EXISTS idx_escalations_feedback_id ON escalations(feedback_id);
      CREATE INDEX IF NOT EXISTS idx_student_feedback_alerts_team_id ON student_feedback_alerts(team_id);
      CREATE INDEX IF NOT EXISTS idx_student_feedback_alerts_feedback_id ON student_feedback_alerts(feedback_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_views_feedback_id ON feedback_views(feedback_id);
    `);

    console.log('Database connected and tables ready');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
};

initDb();
module.exports = pool;