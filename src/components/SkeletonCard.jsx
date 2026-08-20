import React from 'react';
import '../styles/dashboard.css';

// Mimics a qut-compact-card (team card with title, two lines, a badge, two buttons)
export const SkeletonTeamCard = () => (
  <section className="qut-skeleton-card">
    <div>
      <span className="qut-skeleton qut-skeleton-line qut-skeleton-title" />
      <span className="qut-skeleton qut-skeleton-line" />
      <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
      <span className="qut-skeleton qut-skeleton-line qut-skeleton-badge" />
    </div>
    <div className="qut-skeleton-buttons">
      <span className="qut-skeleton qut-skeleton-btn" />
      <span className="qut-skeleton qut-skeleton-btn" />
    </div>
  </section>
);

// Mimics a qut-feedback-card (topline + summary text, no buttons)
export const SkeletonFeedbackCard = () => (
  <section className="qut-skeleton-card">
    <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
    <span className="qut-skeleton qut-skeleton-line qut-skeleton-title" />
    <span className="qut-skeleton qut-skeleton-line" />
    <span className="qut-skeleton qut-skeleton-line qut-skeleton-short" />
  </section>
);

// Repeats a skeleton card N times inside a grid — matches qut-compact-grid / qut-list-grid
export const SkeletonGrid = ({ count = 2, variant = 'team', gridClass = 'qut-compact-grid' }) => {
  const SkeletonComponent = variant === 'feedback' ? SkeletonFeedbackCard : SkeletonTeamCard;
  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
};