import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import {
  LayoutDashboard, Users, FileText, Trello, CheckSquare, Truck,
  BarChart2, Clock, DollarSign, Building2, LogOut, ChevronDown,
  MapPin, ClipboardList, ShieldCheck, Smartphone, Layers, Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { section: 'Main' },
  { id: 'dash',      label: 'Dashboard',  icon: LayoutDashboard, roles: ['admin','owner','manager','store_manager','sales','counter'] },
  { id: 'contacts',  label: 'Contacts',   icon: Users,           roles: ['admin','owner','manager','store_manager','sales','counter'] },
  { id: 'quotes',    label: 'Quotes',     icon: FileText,        roles: ['admin','owner','manager','store_manager','sales'] },
  { id: 'pipeline',  label: 'Pipeline',   icon: Trello,          roles: ['admin','owner','manager','store_manager','foreman','sales'] },
  { id: 'opportunities', label: 'Opportunities', icon: Zap, roles: ['admin','owner','manager','store_manager','sales'] },
  { section: 'Ops' },
  { id: 'todos',     label: 'To-do List', icon: CheckSquare, badge: true, roles: ['admin','owner','manager','store_manager','foreman','driver','yard','sales','counter'] },
  { id: 'delivery',  label: 'Delivery',   icon: Truck,           roles: ['admin','owner','manager','store_manager','foreman','driver','yard','sales','counter','store'] },
  { id: 'workforce', label: 'Workforce',  icon: Users,           roles: ['admin','owner','manager','store_manager'] },
  { section: 'Admin' },
  { id: 'users',     label: 'Users',      icon: Users,           roles: ['admin','owner','manager'] },
  { id: 'stores',    label: 'Stores',     icon: Building2,       roles: ['admin','owner','manager'] },
  { id: 'analytics', label: 'Analytics',  icon: BarChart2,       roles: ['admin','owner','manager','store_manager','sales'] },
  { id: 'payroll',   label: 'Payroll',    icon: DollarSign,      roles: ['admin','owner','manager','store_manager'] },
  { id: 'punch',     label: 'Punch Clock',icon: Clock,           roles: ['admin','owner','manager','store_manager','foreman','driver','yard','counter'] },
  { section: 'Tools' },
  { id: 'map',         label: 'Driver Map',    icon: MapPin,         roles: ['admin','owner','manager','store_manager','foreman'] },
  { id: 'audit',       label: 'Audit Log',     icon: ClipboardList,  roles: ['admin','owner','manager'] },
  { id: 'permissions', label: 'Permissions',   icon: ShieldCheck,    roles: ['admin'] },
  { id: 'mobile',      label: 'Mobile View',   icon: Smartphone,     roles: ['admin','owner','manager','store_manager','foreman','driver','yard','sales','counter','store'] },
  { id: 'owner_dash',  label: 'Owner Dashboard', icon: Layers,       roles: ['admin','owner'] },
];

export function Sidebar({ currentPage, setPage }: { currentPage: string; setPage: (p: string) => void }) {
  const { users, currentUser, setCurrentUserId, todos, stores, currentStoreId, logout, authEmail } = useAppStore();
  const { addToast } = useToast();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getBadge = (id: string) =>
    id === 'todos' ? todos.filter(t => !t.done && (t.ownerId || 1) === currentUser.id).length : 0;

  const currentStore = stores.find(s => s.id === currentStoreId);
  const accent = currentStore?.accentColor || '#f97316';
  const logoText = currentStore?.logoText || 'Forge AM';

  const handleLogout = () => {
    logout();
    addToast('Signed out successfully.', 'info');
  };

  return (
    <div className="w-[220px] bg-[#111111] border-r border-[#1e1e1e] flex flex-col shrink-0 h-screen select-none">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: accent, boxShadow: `0 0 16px ${accent}66` }}>
            <Truck className="text-white w-5 h-5" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-white leading-tight">{logoText}</div>
            <div className="text-[10px] text-[#6b7280] tracking-widest">V2.1414</div>
          </div>
        </div>

        {/* Store badge */}
        {currentStore && (
          <div className="mt-3 flex items-center gap-2 bg-[#1a1a1a] border border-[#2e2e2e] rounded-[6px] px-2.5 py-1.5">
            <Building2 className="w-3 h-3 shrink-0" style={{ color: accent }} />
            <span className="text-[10px] text-[#9ca3af] truncate">{currentStore.name}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item, idx) => {
          if (!item.section && item.roles && !item.roles.includes(currentUser.role)) return null;

          if (item.section) {
            // Check if any children are visible
            let hasVisible = false;
            for (let i = idx + 1; i < NAV_ITEMS.length; i++) {
              if ((NAV_ITEMS[i] as any).section) break;
              if ((NAV_ITEMS[i] as any).roles?.includes(currentUser.role)) { hasVisible = true; break; }
            }
            if (!hasVisible) return null;
            return (
              <div key={idx} className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-widest text-[#4b4b4b] font-bold">
                {item.section}
              </div>
            );
          }

          const Icon = item.icon!;
          const isActive = currentPage === item.id;
          const badge = item.badge ? getBadge(item.id!) : 0;

          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id!)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-[13px] transition-all text-left relative
                ${isActive ? 'font-semibold' : 'text-[#9ca3af] hover:bg-[#1a1a1a] hover:text-white'}`}
              style={isActive ? { backgroundColor: accent + '26', color: accent } : {}}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full" style={{ backgroundColor: accent }} />
              )}
              <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              <span className="flex-1 truncate">{item.label}</span>
              {badge > 0 && (
                <span className="text-[10px] text-white px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: accent }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User footer */}
      <div className="border-t border-[#1e1e1e] p-3 relative">
        <button
          onClick={() => setUserMenuOpen(v => !v)}
          className="w-full flex items-center gap-2.5 p-2 rounded-[7px] hover:bg-[#1a1a1a] transition"
        >
          <div className="w-8 h-8 rounded-[7px] flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: accent + '33', color: accent }}>
            {currentUser.first[0]}{currentUser.last[0]}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[12px] font-semibold text-white truncate">{currentUser.first} {currentUser.last}</div>
            <div className="text-[10px] text-[#6b7280] truncate">{authEmail || currentUser.email || currentUser.role}</div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-[#6b7280] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {userMenuOpen && (
          <div className="absolute bottom-[70px] left-2 right-2 bg-[#1a1a1a] border border-[#2e2e2e] rounded-[8px] shadow-xl z-50 overflow-hidden">
            {/* Switch User — admin only */}
            {currentUser.role === 'admin' && (
              <>
                <div className="p-2 border-b border-[#2e2e2e] text-[10px] font-bold text-[#6b7280] uppercase px-3">
                  Switch User
                </div>
                {users.slice(0, 8).map(u => (
                  <button
                    key={u.id}
                    onClick={() => { setCurrentUserId(u.id); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#222222] transition text-left"
                  >
                    <div className="w-6 h-6 rounded-[5px] bg-[#252525] flex items-center justify-center text-[9px] font-bold text-[#9ca3af]">
                      {u.first[0]}{u.last[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white">{u.first} {u.last}</div>
                      <div className="text-[10px] text-[#6b7280] capitalize">{u.role.replace('_', ' ')}</div>
                    </div>
                    {currentUser.id === u.id && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />}
                  </button>
                ))}
                <div className="border-t border-[#2e2e2e]" />
              </>
            )}
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-xs font-semibold text-[#ef4444] hover:bg-[#3b1a1a] transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
