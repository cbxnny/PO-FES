/**
 * BackButton.jsx
 *
 * A reusable back-navigation button used at the top of detail / form pages.
 *
 * Props:
 *   to    {string}  (optional) Explicit path to navigate to. When omitted,
 *                   the button navigates to the current user's dashboard.
 *   label {string}  Button text. Defaults to 'Back'.
 *
 * Usage:
 *   <BackButton />                          // → user's dashboard
 *   <BackButton to="/feedback-timeline/1" /> // → specific page
 *   <BackButton label="Return to Dashboard" />
 */

import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { roleToDashboardPath } from '../utils/roleUtils';

const BackButton = ({ to, label = 'Back' }) => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleClick = () => {
    navigate(to || roleToDashboardPath(user?.role));
  };

  return (
    <button type="button" className="qut-back-btn" onClick={handleClick}>
      <span aria-hidden="true" className="qut-back-icon">◂</span>
      {label}
    </button>
  );
};

export default BackButton;
