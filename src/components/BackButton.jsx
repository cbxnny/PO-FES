import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { roleToDashboardPath } from '../utils/roleUtils';

const BackButton = ({ to, label = 'Previous' }) => {
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
