import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import CollectorMap from './CollectorMap';

const MapPage = () => {
  const { user } = useAuth();

  // Only collectors can access map
  if (user?.role === 'collector') {
    return <CollectorMap />;
  }

  // Redirect others to their appropriate page
  return <Navigate to="/dashboard" replace />;
};

export default MapPage;
