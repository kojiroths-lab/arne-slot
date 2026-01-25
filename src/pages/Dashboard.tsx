import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import SalonDashboard from './SalonDashboard';
import CollectorDashboard from './CollectorDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'salon':
      return <SalonDashboard />;
    case 'collector':
      return <CollectorDashboard />;
    case 'farmer':
      // Farmers should use Cart page instead
      return <Navigate to="/cart" replace />;
    default:
      return <Navigate to="/store" replace />;
  }
};

export default Dashboard;
