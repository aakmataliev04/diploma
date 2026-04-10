import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import './App.css';
import { useAuth } from './app/useAuth';
import { appNavigation, defaultRouteByRole } from './app/navigation';
import Layout from './components/layout/Layout';
import Bouquets from './containers/Bouquets/Bouquets';
import Inventory from './containers/Inventory/Inventory';
import Login from './containers/Login/Login';
import ModulePlaceholder from './containers/ModulePlaceholder/ModulePlaceholder';
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
      <Route path="pos" element={<ModulePlaceholder title="POS-терминал" description="Главный экран продаж для администратора." />} />
      <Route path="clients" element={<ModulePlaceholder title="Клиентская база" description="Полный доступ к базе клиентов и поводам." />} />
      <Route path="bouquets" element={<Bouquets />} />
      <Route path="inventory" element={<Inventory />} />
      <Route path="analytics" element={<ModulePlaceholder title="Аналитика" description="Дашборд метрик и финансовой сводки." />} />
    </Route>
  </Route>
);

const FloristRoutes = () => (
  <Route element={<ProtectedRoute allowedRole="FLORIST" />}>
    <Route path="/florist" element={<Layout role="FLORIST" navigation={appNavigation.FLORIST} />}>
      <Route index element={<Navigate to="pos" replace />} />
      <Route path="pos" element={<ModulePlaceholder title="POS-терминал" description="Рабочее место флориста для оформления заказов." />} />
      <Route path="client-search" element={<ModulePlaceholder title="Поиск клиентов" description="Только быстрый поиск клиента без доступа к полной базе." />} />
      <Route path="bouquets" element={<Bouquets />} />
      <Route path="inventory" element={<Inventory />} />
    </Route>
  </Route>
);

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<SessionRedirect />} />
      <Route path="/login" element={<LoginRoute />} />
      {AdminRoutes()}
      {FloristRoutes()}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
