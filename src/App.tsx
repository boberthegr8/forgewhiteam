import { useState, useEffect } from 'react';
import { AppProvider, useAppStore } from './lib/store';
import { ToastProvider } from './lib/toast';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { DeliveryBoard } from './pages/DeliveryBoard';
import { CalendarPage } from './pages/CalendarPage';
import { QuotesPage } from './pages/QuotesPage';
import { ContactsPage } from './pages/ContactsPage';
import { PipelinePage } from './pages/PipelinePage';
import { UsersPage } from './pages/UsersPage';
import { StoresPage } from './pages/StoresPage';
import { TodosPage } from './pages/TodosPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PunchClockPage } from './pages/PunchClockPage';
import { PayrollPage } from './pages/PayrollPage';
import { WorkforcePage } from './pages/WorkforcePage';
import { LoginPage } from './pages/LoginPage';
import { AuditPage } from './pages/AuditPage';
import { MapPage } from './pages/MapPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { MobileDriverPage } from './pages/MobileDriverPage';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { FocusDashboard } from './pages/FocusDashboard';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { GoogleOAuthProvider } from '@react-oauth/google';

const PAGE_ROLES: Record<string, string[]> = {
  opportunities: ['admin', 'owner', 'manager', 'store_manager', 'sales'],
  dash:        ['admin', 'owner', 'manager', 'store_manager', 'sales', 'counter'],
  contacts:    ['admin', 'owner', 'manager', 'store_manager', 'sales', 'counter'],
  quotes:      ['admin', 'owner', 'manager', 'store_manager', 'sales'],           // counter excluded
  pipeline:    ['admin', 'owner', 'manager', 'store_manager', 'foreman', 'sales'],
  todos:       ['admin', 'owner', 'manager', 'store_manager', 'foreman', 'driver', 'yard', 'sales', 'counter'],
  delivery:    ['admin', 'owner', 'manager', 'store_manager', 'foreman', 'driver', 'yard', 'sales', 'counter', 'store'],
  calendar:    ['admin', 'owner', 'manager', 'store_manager', 'foreman', 'sales', 'counter'],
  workforce:   ['admin', 'owner', 'manager', 'store_manager'],
  users:       ['admin', 'owner', 'manager'],
  stores:      ['admin', 'owner', 'manager'],
  analytics:   ['admin', 'owner', 'manager', 'store_manager', 'sales'],
  payroll:     ['admin', 'owner', 'manager', 'store_manager'],
  punch:       ['admin', 'owner', 'manager', 'store_manager', 'foreman', 'driver', 'yard', 'counter'],
  map:         ['admin', 'owner', 'manager', 'store_manager', 'foreman'],
  audit:       ['admin', 'owner', 'manager'],
  permissions: ['admin'],
  mobile:      ['admin', 'owner', 'manager', 'store_manager', 'foreman', 'driver', 'yard', 'sales', 'counter', 'store'],
  owner_dash:  ['admin', 'owner'],
};

const PAGE_TITLES: Record<string, string> = {
  opportunities: 'Opportunities', dash: 'Dashboard', delivery: 'Delivery Board', calendar: 'Calendar',
  contacts: 'Contacts', quotes: 'Quotes', pipeline: 'Pipeline',
  todos: 'To-do List', users: 'Users', stores: 'Stores', analytics: 'Analytics',
  payroll: 'Payroll', punch: 'Punch Clock', workforce: 'Workforce',
  map: 'Driver Map', audit: 'Audit Log', permissions: 'Permissions', mobile: 'Mobile View', owner_dash: 'Owner Dashboard',
};

function AppContent() {
  const [currentPage, setPage] = useState('dash');
  const { currentUser, isLoggedIn, focusMode } = useAppStore();

  useEffect(() => {
    if (currentUser?.role) {
      const allowed = PAGE_ROLES[currentPage];
      if (allowed && !allowed.includes(currentUser.role)) {
        if (['driver', 'store', 'yard'].includes(currentUser.role)) setPage('delivery');
        else if (currentUser.role === 'foreman') setPage('pipeline');
        else if (currentUser.role === 'counter') setPage('delivery');
        else if (currentUser.role === 'owner') setPage('owner_dash');
        else setPage('dash');
      }
    }
  }, [currentUser, currentPage]);

  if (!isLoggedIn) return <LoginPage />;

  const renderPage = () => {
    switch (currentPage) {
      case 'opportunities': return <OpportunitiesPage />;
      case 'dash':      return <Dashboard />;
      case 'delivery':  return <DeliveryBoard />;
      case 'calendar':  return <CalendarPage />;
      case 'contacts':  return <ContactsPage />;
      case 'quotes':    return <QuotesPage />;
      case 'pipeline':  return <PipelinePage />;
      case 'workforce': return <WorkforcePage />;
      case 'users':     return <UsersPage />;
      case 'stores':    return <StoresPage />;
      case 'todos':     return <TodosPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'payroll':   return <PayrollPage />;
      case 'punch':       return <PunchClockPage />;
      case 'map':         return <MapPage />;
      case 'audit':       return <AuditPage />;
      case 'permissions': return <PermissionsPage />;
      case 'mobile':      return <MobileDriverPage />;
      case 'owner_dash':  return <OwnerDashboard />;
      default:            return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f] w-full overflow-hidden text-sm">
      {!focusMode && <Sidebar currentPage={currentPage} setPage={setPage} />}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={focusMode ? 'Focus Mode' : (PAGE_TITLES[currentPage] || 'Dashboard')} />
        <div className="flex-1 relative overflow-hidden">
          {focusMode ? <FocusDashboard /> : renderPage()}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AppProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AppProvider>
    </GoogleOAuthProvider>
  );
}
