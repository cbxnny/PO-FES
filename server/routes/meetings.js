const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');
const { normalizeRole } = require('../utils/roleUtils');

const MEETING_BASE_QUERY = `
  SELECT m.meetingid, m.created_at, m.team_id, m.client_id,
         m.meeting_date, m.meeting_time, m.attendance,
         m.product_progression_rating, m.process_teamwork_rating,
         t.team_name, t.tutor_id,
         client.firstname || ' ' || client.lastname AS client_name
  FROM meetings m
  JOIN teams t ON m.team_id = t.team_id
  LEFT JOIN users client ON m.client_id = client.id
`;

const mapMeetingRow = (row) => ({
  id: row.meetingid,
  createdAt: row.created_at,
  teamId: row.team_id,
  teamName: row.team_name,
  clientId: row.client_id,
  clientName: row.client_name,
  meetingDate: row.meeting_date,
  meetingTime: row.meeting_time,
  attendance: row.attendance,
  productProgressionRating: row.product_progression_rating,
  processTeamworkRating: row.process_teamwork_rating
});

// GET /api/meetings
// Returns meetings visible to the current user, scoped by role:
//   client      -> meetings they logged (client_id = user)
//   tutor       -> meetings for teams they tutor
//   student     -> meetings for teams they belong to
//   coordinator/liaison -> all meetings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.user;
    const normalizedRole = normalizeRole(role);
    let query = MEETING_BASE_QUERY;
    let params = [];

    if (normalizedRole === 'client') {
      query += ' WHERE m.client_id = $1';
      params = [id];
    } else if (normalizedRole === 'tutor') {
      query += ' WHERE t.tutor_id = $1';
      params = [id];
    } else if (normalizedRole === 'student') {
      query += ' WHERE m.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1)';
      params = [id];
    }

    query += ' ORDER BY m.meeting_date DESC NULLS LAST, m.meeting_time DESC NULLS LAST';

    const result = await pool.query(query, params);
    res.json(result.rows.map(mapMeetingRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching meetings.' });
  }
});

// GET /api/meetings/team/:teamId
// Returns all meetings logged for a single team, most recent first.
router.get('/team/:teamId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `${MEETING_BASE_QUERY} WHERE m.team_id = $1
       ORDER BY m.meeting_date DESC NULLS LAST, m.meeting_time DESC NULLS LAST`,
      [req.params.teamId]
    );
    res.json(result.rows.map(mapMeetingRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching meetings for team.' });
  }
});

// GET /api/meetings/:meetingId
// Returns a single meeting by id.
router.get('/:meetingId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `${MEETING_BASE_QUERY} WHERE m.meetingid = $1`,
      [req.params.meetingId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found.' });
    }
    res.json(mapMeetingRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching meeting.' });
  }
});

// POST /api/meetings
// Body: { teamId, meetingDate, meetingTime, attendance,
//         productProgressionRating, processTeamworkRating }
// clientId is always taken from the authenticated user, never the body.
router.post('/', authenticateToken, async (req, res) => {
  const {
    teamId,
    meetingDate,
    meetingTime,
    attendance,
    productProgressionRating,
    processTeamworkRating
  } = req.body;

  if (!teamId) {
    return res.status(400).json({ error: 'teamId is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO meetings
         (team_id, client_id, meeting_date, meeting_time, attendance,
          product_progression_rating, process_teamwork_rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING meetingid`,
      [
        teamId,
        req.user.id,
        meetingDate || null,
        meetingTime || null,
        attendance || null,
        productProgressionRating || null,
        processTeamworkRating || null
      ]
    );

    const created = await pool.query(
      `${MEETING_BASE_QUERY} WHERE m.meetingid = $1`,
      [result.rows[0].meetingid]
    );
    res.status(201).json(mapMeetingRow(created.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating meeting.' });
  }
});

module.exports = router;
