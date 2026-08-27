const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  // Necessary to avoid "self signed certificate" errors when using Gmail's SMTP server 
  tls: {
    rejectUnauthorized: false
  }
});

// Dummy recipient for now
const NOTIFICATION_RECIPIENT = 'pofescapstone@gmail.com';

/**
 * Sends an escalation notification email.
 * @param {Object} params
 * @param {string} params.teamName
 * @param {string} params.projectName
 * @param {number} params.escalationLevel - 1 (to coordinator) or 2 (to liaison)
 * @param {string} params.escalatedByName
 * @param {string} [params.note]
 */

const sendEscalationEmail = async ({ teamName, projectName, escalationLevel, escalatedByName, note }) => {
  const roleLabel = escalationLevel === 1 ? 'Unit Coordinator' : 'Industry Liaison';
  const subject = `[PO-FES] Team "${teamName}" escalated to ${roleLabel}`;

  const text = `
A team has been escalated and requires your attention.

Team: ${teamName}
Project: ${projectName}
Escalated by: ${escalatedByName}
Escalation level: ${escalationLevel === 1 ? 'Tutor → Unit Coordinator' : 'Unit Coordinator → Industry Liaison'}
${note ? `Note: ${note}` : ''}

Please log in to PO-FES to review this team.
  `.trim();

  try {
    await transporter.sendMail({
      from: `"PO-FES Notifications" <${process.env.EMAIL_USER}>`,
      to: NOTIFICATION_RECIPIENT,
      subject,
      text
    });
    console.log(`Escalation email sent for team "${teamName}" (level ${escalationLevel})`);
  } catch (err) {
    // Don't let an email failure break the escalation itself —
    // just log it so the escalation still succeeds in the database.
    console.error('ESCALATION EMAIL ERROR:', err);
  }
};

module.exports = { sendEscalationEmail };