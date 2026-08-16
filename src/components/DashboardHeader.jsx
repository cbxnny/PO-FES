import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../utils/auth';
import { getUserDisplayName, getUserFirstName, normalizeRole } from '../utils/roleUtils';

const getDashboardTitle = (user, fallbackTitle) => {
  const role = normalizeRole(user?.role);

  if (role === 'student') return 'Student Dashboard';
  if (role === 'client') return 'Client Dashboard';
  if (role === 'tutor') return 'Tutor Dashboard';
  if (role === 'coordinator') return 'Coordinator Dashboard';
  if (role === 'liaison') return 'Industry Liaison Dashboard';

  return fallbackTitle || 'Dashboard';
};

const DashboardHeader = ({ title }) => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login', { replace: true });
  };

  return (
    <header className="qut-header">
      <div className="qut-header-left">
        <span className="qut-brand">
          <img src="/pictures/qut.png" alt="QUT logo" className="qut-logo-img" />
        </span>

        <div className="qut-header-divider" />

        <div>
          <div className="qut-page-title">
            {getDashboardTitle(user, title)}
          </div>

          <div className="qut-page-subtitle">
            Welcome, {getUserFirstName(user)}
          </div>
        </div>
      </div>

      <div className="qut-header-right">
        <span className="qut-current-user">{getUserDisplayName(user)}</span>

        <button
          type="button"
          className="qut-btn qut-btn-light"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;