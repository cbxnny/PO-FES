import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { roleToDashboardPath } from '../utils/roleUtils';

const PublicRoute = ({ children }) => {
  const user = getCurrentUser();

  if (user) {
    return <Navigate to={roleToDashboardPath(user.role)} replace />;
  }

  return children;
};

export default PublicRoute;