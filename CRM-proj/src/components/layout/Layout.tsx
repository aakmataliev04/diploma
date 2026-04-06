import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import type { NavigationItem, UserRole } from '../../types';
import './Layout.css';

interface LayoutProps {
  navigation: NavigationItem[];
  role: UserRole;
}

const Layout = ({ navigation, role }: LayoutProps) => {
  return (
    <div className="app">
      <Header navigation={navigation} role={role} />
      <main className="app-container">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
