import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { useAuth } from './app/useAuth';
import { appNavigation, defaultRouteByRole } from './app/navigation';
import Layout from './components/layout/Layout';
import Analytics from './containers/Analytics/Analytics';
import Bouquets from './containers/Bouquets/Bouquets';
import Clients from './containers/Clients/Clients';
import Inventory from './containers/Inventory/Inventory';
import Login from './containers/Login/Login';
import Pos from './containers/Pos/Pos';
import type { UserRole } from './types';

const ProtectedRoute = ({ allowedRole }: { allowedRole: UserRole }) => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.user.role !== allowedRole) {
    return <Navigate to={defaultRouteByRole[session.user.role]} replace />;
  }

  return <Outlet />;
};

const LoginRoute = () => {
  const { session } = useAuth();

  if (session) {
    return <Navigate to={defaultRouteByRole[session.user.role]} replace />;
  }

  return <Login />;
};

const SessionRedirect = () => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={defaultRouteByRole[session.user.role]} replace />;
};

const AdminRoutes = () => (
  <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
      <Route path="/admin" element={<Layout role="ADMIN" navigation={appNavigation.ADMIN} />}>
      <Route index element={<Navigate to="pos" replace />} />
      <Route path="pos" element={<Pos />} />
      <Route path="clients" element={<Clients />} />
      <Route path="bouquets" element={<Bouquets />} />
      <Route path="inventory" element={<Inventory />} />
      <Route path="analytics" element={<Analytics />} />
    </Route>
  </Route>
);

const FloristRoutes = () => (
  <Route element={<ProtectedRoute allowedRole="FLORIST" />}>
      <Route path="/florist" element={<Layout role="FLORIST" navigation={appNavigation.FLORIST} />}>
      <Route index element={<Navigate to="pos" replace />} />
      <Route path="pos" element={<Pos />} />
      <Route path="clients" element={<Clients />} />
      <Route path="bouquets" element={<Bouquets />} />
      <Route path="inventory" element={<Inventory />} />
    </Route>
  </Route>
);

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<SessionRedirect />} />
        <Route path="/login" element={<LoginRoute />} />
        {AdminRoutes()}
        {FloristRoutes()}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3200}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </>
  );
};

export default App;
