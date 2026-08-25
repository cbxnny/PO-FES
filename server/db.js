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

      CREATE TABLE IF NOT EXISTS individual_feedback (
        id SERIAL PRIMARY KEY,
        feedback_id INTEGER REFERENCES feedback(feedback_id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id),
        score NUMERIC(3,1),
        comment TEXT
      );

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
    `);

    console.log('Database connected and tables ready');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
};

initDb();
module.exports = pool;