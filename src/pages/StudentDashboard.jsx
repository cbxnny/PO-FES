import React from "react";

const StudentDashboard = () => {
    return (
        <div className="student-db-container">
            {/* Top Logo and Header */}
            <div className="student-db-header">
                <div className="student-db-qut">
                    <img src="../pictures/qut.png" alt="QUT Logo" width="75" height="75" />
                </div>
                <div className="student-db-title-section">
                    <h1 className="student-db-title">Dashboard</h1>
                    <p className="student-db-subtitle">Hey, Alex</p>
                </div>
            </div>

            {/* Feedback Cards */}
            <div className="student-db-cards-grid">
                {/* Team Feedback Card */}
                <div className="student-db-card">
                    <div className="student-db-card-label">My Feedback — Team</div>

                    <div className="student-db-score-row">
                        <span className="student-db-score">4.2</span>
                        <span className="student-db-score-text">team score</span>
                    </div>

                    <div className="student-db-stars">
                        <span style={{ color: "#fbbf24" }}>★</span>
                        <span style={{ color: "#fbbf24" }}>★</span>
                        <span style={{ color: "#fbbf24" }}>★</span>
                        <span style={{ color: "#fbbf24" }}>★</span>
                        <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>★</span>
                    </div>

                    <div className="student-db-badge-row">
                        <span className="student-db-badge">Good</span>
                    </div>

                    <div className="student-db-comment-box">
                        Great communication and timely delivery of milestones.
                    </div>
                </div>

                {/* Individual Feedback Card */}
                <div className="student-db-card">
                    <div className="student-db-card-label">My Feedback — Individual</div>

                    <div className="student-db-score-row">
                        <span className="student-db-score">3.8</span>
                        <span className="student-db-score-text">individual score</span>
                    </div>

                    <div className="student-db-stars">
                        <span style={{ color: "#fbbf24" }}>★</span>
                        <span style={{ color: "#fbbf24" }}>★</span>
                        <span style={{ color: "#fbbf24" }}>★</span>
                        <span style={{ color: "#fbbf24" }}>★</span>
                        <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>★</span>
                    </div>

                    <div className="student-db-badge-row">
                        <span className="student-db-badge">Good</span>
                    </div>

                    <div className="student-db-comment-box">
                        Could improve on documentation clarity.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;