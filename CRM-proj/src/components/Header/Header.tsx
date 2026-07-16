import { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { axiosApi } from '../../axiosApi';
import { useAuth } from '../../app/useAuth';
import type { NavigationIcon, NavigationItem, ReminderDueCountResponse, UserRole } from '../../types';
import NotificationsCenter from '../NotificationsCenter/NotificationsCenter';
import {
  AnalyticsIcon,
  BouquetsIcon,
  BrandIcon,
  ClientsIcon,
  InventoryIcon,
  LogoutIcon,
  MenuIcon,
  NotificationsIcon,
  OrdersIcon,
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
  orders: OrdersIcon,
  clients: ClientsIcon,
  bouquets: BouquetsIcon,
  inventory: InventoryIcon,
  analytics: AnalyticsIcon,
};

const DUE_COUNT_POLL_MS = 45000;

const Header = ({ navigation, role }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dueCount, setDueCount] = useState(0);

  const fetchDueCount = useCallback(async () => {
    try {
      const { data } = await axiosApi.get<ReminderDueCountResponse>('/reminders/due-count');
      setDueCount(typeof data.count === 'number' ? data.count : 0);
    } catch {
      // badge — best-effort; не спамим toast при каждом poll
    }
  }, []);

  useEffect(() => {
    const closeMenuTimeout = window.setTimeout(() => {
      setIsMobileMenuOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(closeMenuTimeout);
    };
  }, [location.pathname]);

  useEffect(() => {
    void fetchDueCount();

    const intervalId = window.setInterval(() => {
      void fetchDueCount();
    }, DUE_COUNT_POLL_MS);

    const handleFocus = () => {
      void fetchDueCount();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchDueCount]);

  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
  };

  return (
    <>
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
              <button
                type="button"
                className={`header-icon-btn${isNotificationsOpen ? ' is-active' : ''}`}
                aria-label="Уведомления"
                aria-expanded={isNotificationsOpen}
                onClick={toggleNotifications}
              >
                <NotificationsIcon className="header-action-icon" />
                {dueCount > 0 ? <span className="header-notify-dot" /> : null}
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

      <NotificationsCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onChanged={() => {
          void fetchDueCount();
        }}
      />
    </>
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
