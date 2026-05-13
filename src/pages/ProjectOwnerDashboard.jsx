import React from 'react';

const ProjectOwnerDashboard = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'left' }}>
      <img src="../pictures/qut.png" alt="" width="75" height="75" />
      <h1>PO-FES Dashboard</h1>
      <p>Welcome to the Project Owner Feedback and Evaluation System.</p>

      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        backgroundColor: 'var(--bg)'
      }}>
        <h2>Your Capstone Projects</h2>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          <li style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <strong>Project A:</strong> Feedback due in 3 days
            <button style={{ marginLeft: '1rem', padding: '0.5rem 1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit Feedback</button>
          </li>
          <li style={{ padding: '1rem' }}>
            <strong>Project B:</strong> Up to date
            <button style={{ marginLeft: '1rem', padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>View Details</button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ProjectOwnerDashboard;
