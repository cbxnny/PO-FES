console.log('MAILER.JS LOADED — Brevo HTTP API v6');

const { BrevoClient } = require('@getbrevo/brevo');

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY
});

// Dummy recipient for now
const NOTIFICATION_RECIPIENT = 'pofescapstone@gmail.com';

/**
 * Sends an escalation notification email
 * @param {Object} params
 * @param {string} params.teamName
 * @param {string} params.projectName
 * @param {number} params.escalationLevel - 1 (to coordinator) or 2 (to liaison)
 * @param {string} params.escalatedByName
 * @param {string} [params.note]
 */
const sendEscalationEmail = async ({
  teamName,
  projectName,
  escalationLevel,
  escalatedByName,
  note
}) => {
  const roleLabel =
    escalationLevel === 1
      ? 'Unit Coordinator'
      : 'Industry Liaison';

  const subject =
    `[PO-FES] Team "${teamName}" escalated to ${roleLabel}`;

  const text = `
A team has been escalated and requires your attention.

Team: ${teamName}
Project: ${projectName}
Escalated by: ${escalatedByName}
Escalation level: ${
    escalationLevel === 1
      ? 'Tutor → Unit Coordinator'
      : 'Unit Coordinator → Industry Liaison'
  }
${note ? `Note: ${note}` : ''}

Please log in to PO-FES to review this team.
  `.trim();

  try {
    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: 'PO-FES Notifications',
        email: 'pofescapstone@gmail.com'
      },
      to: [
        {
          email: NOTIFICATION_RECIPIENT
        }
      ],
      subject,
      textContent: text
    });

    console.log(
      `Escalation email sent for team "${teamName}" (level ${escalationLevel})`,
      response
    );
  } catch (err) {
    console.error(
      'ESCALATION EMAIL ERROR:',
      err?.body || err?.response?.body || err?.message || err
    );
  }
};

module.exports = {
  sendEscalationEmail
};
