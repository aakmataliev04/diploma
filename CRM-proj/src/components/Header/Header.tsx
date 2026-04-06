import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/useAuth';
import type { NavigationIcon, NavigationItem, UserRole } from '../../types';
import {
  AnalyticsIcon,
  BouquetsIcon,
  BrandIcon,
  ClientsIcon,
  InventoryIcon,
  LogoutIcon,
  MenuIcon,
  NotificationsIcon,
  PosIcon,
} from './HeaderIcons';
import './Header.css';

interface HeaderProps {
  navigation: NavigationItem[];
  role: UserRole;
}

const roleLabel: Record<UserRole, string> = {
  ADMIN: 'Администратор',
  FLORIST: 'Флорист',
};

const navIcons: Record<NavigationIcon, typeof PosIcon> = {
  pos: PosIcon,
  clients: ClientsIcon,
  bouquets: BouquetsIcon,
  inventory: InventoryIcon,
  analytics: AnalyticsIcon,
};

const Header = ({ navigation, role }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="header">
      <div className="header-container">
      <div className="header-main">
        <div className="header-brand">
          <div className="header-logo">
            <BrandIcon className="header-logo-icon" />
          </div>
          <div className="header-brand-text">
            <p className="header-title">Flora CRM</p>
            <p className="header-subtitle">{roleLabel[role]}</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="header-icon-btn header-menu-btn"
            aria-label="Открыть меню"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((prevState) => !prevState)}
          >
            <MenuIcon className="header-action-icon" />
          </button>
          <button type="button" className="header-icon-btn" aria-label="Уведомления">
            <NotificationsIcon className="header-action-icon" />
            <span className="header-notify-dot" />
          </button>
          <button type="button" className="header-icon-btn" aria-label="Выйти" onClick={handleLogout}>
            <LogoutIcon className="header-action-icon" />
          </button>
        </div>
      </div>

      <div className={`header-tabs ${isMobileMenuOpen ? 'header-tabs-open' : ''}`}>
        <nav className="header-nav">
          {navigation.map((item) => (
            <HeaderNavLink key={item.to} item={item} />
          ))}
        </nav>
      </div>
      </div>
    </header>
  );
};

interface HeaderNavLinkProps {
  item: NavigationItem;
}

const HeaderNavLink = ({ item }: HeaderNavLinkProps) => {
  const Icon = navIcons[item.icon];

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) => (isActive ? 'header-link header-link-active' : 'header-link')}
    >
      <Icon className="header-link-icon" />
      <span className="header-link-label">{item.label}</span>
    </NavLink>
  );
};

export default Header;
