import { ReactNode, useState, useRef, useEffect } from 'react';
import { Search, User, FileText, Building2, Calendar, Bell, Zap } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';

export function Topbar({ title, actions }: { title: string; actions?: ReactNode }) {
  const [q, setQ] = useState('');
  const [showRes, setShowRes] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const { contacts, quotes, userRole, users, viewFilter, setViewFilter, currentUser, stores, currentStoreId, switchStore, deliveries, notifications, clearNotifications, focusMode, toggleFocusMode } = useAppStore();
  const { addToast } = useToast();
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = (notifications || []).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowRes(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const scopedContacts = userRole === 'admin' ? contacts : contacts.filter(c => (c.ownerId || 1) === currentUser.id);
  const scopedQuotes   = userRole === 'admin' ? quotes   : quotes.filter(qu => (qu.ownerId || 1) === currentUser.id);

  const resContacts = q ? scopedContacts.filter(c =>
    (c.first + ' ' + c.last).toLowerCase().includes(q.toLowerCase()) ||
    c.company?.toLowerCase().includes(q.toLowerCase())
  ) : [];
  const resQuotes = q ? scopedQuotes.filter(qu =>
    qu.client?.toLowerCase().includes(q.toLowerCase()) ||
    qu.desc?.toLowerCase().includes(q.toLowerCase())
  ) : [];

  const handleStoreSwitch = (storeId: string) => {
    if (storeId === currentStoreId) return;
    switchStore(storeId);
    addToast(`Switched to ${stores.find(s => s.id === storeId)?.name}`, 'info');
  };

  const exportCalendar = () => {
    const lines: string[] = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Forge AM//EN', 'CALSCALE:GREGORIAN',
    ];
    deliveries.forEach(d => {
      const dt = d.date?.replace(/-/g, '') || '';
      lines.push('BEGIN:VEVENT');
      lines.push('UID:forge-' + d.id + '@jkhardware');
      lines.push('DTSTART;VALUE=DATE:' + dt);
      lines.push('DTEND;VALUE=DATE:' + dt);
      lines.push('SUMMARY:' + (d.customer || 'Delivery'));
      lines.push('DESCRIPTION:Driver: ' + (d.driver || 'TBD') + '\\nStatus: ' + (d.status || '') + '\\n' + (d.comments || ''));
      lines.push('LOCATION:' + (d.address || ''));
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'forge-deliveries.ics'; a.click();
    URL.revokeObjectURL(url);
    addToast('Calendar file downloaded — open it to import into Google/Apple/Outlook Calendar.', 'success');
  };

  return (
    <div className="h-[56px] bg-[#111111] border-b border-[#1e1e1e] flex items-center px-5 gap-4 shrink-0 relative z-40">
      {/* Page title */}
      <div className="text-[18px] font-bold text-white flex-1 tracking-tight">{title}</div>

      {/* Store switcher (admin + manager) */}
      {(userRole === 'admin' || userRole === 'manager') && stores.length > 1 && (
        <div className="flex items-center gap-2 mr-2">
          <Building2 className="w-3.5 h-3.5 text-[#6b7280]" />
          <select
            className="win-input py-1 text-xs px-2 w-[160px] bg-[#1a1a1a]"
            value={currentStoreId}
            onChange={e => handleStoreSwitch(e.target.value)}
          >
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* View filter (admin / owner / manager — to filter by sales rep) */}
      {['admin', 'owner', 'manager', 'store_manager'].includes(userRole) && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-wider">View:</span>
          <select
            className="win-input py-1 text-xs px-2 w-[140px] bg-[#1a1a1a]"
            value={viewFilter}
            onChange={e => setViewFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">All Users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.first} {u.last} ({u.role})</option>
            ))}
          </select>
        </div>
      )}

      {/* Global search */}
      <div className="relative w-56" ref={searchRef}>
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b7280] pointer-events-none" />
        <input
          type="text"
          className="win-input w-full pl-8 py-1.5 text-xs bg-[#1a1a1a]"
          placeholder="Search contacts, quotes…"
          value={q}
          onChange={e => { setQ(e.target.value); setShowRes(true); }}
          onFocus={() => { if (q) setShowRes(true); }}
        />
        {showRes && q && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#2e2e2e] shadow-xl rounded-[8px] max-h-80 overflow-y-auto z-50">
            {resContacts.length === 0 && resQuotes.length === 0 && (
              <div className="p-3 text-xs text-[#6b7280] text-center">No results for "{q}"</div>
            )}
            {resContacts.length > 0 && (
              <div>
                <div className="bg-[#111111] px-3 py-1.5 text-[10px] uppercase font-bold text-[#6b7280] tracking-wider">Contacts</div>
                {resContacts.slice(0, 4).map(c => (
                  <div key={c.id} className="p-2.5 border-b border-[#1e1e1e] hover:bg-[#222222] cursor-pointer flex gap-2 items-center text-xs">
                    <User className="w-3 h-3 text-[#f97316]" />
                    <span className="font-semibold text-white">{c.first} {c.last}</span>
                    <span className="text-[#9ca3af] truncate">{c.company}</span>
                  </div>
                ))}
              </div>
            )}
            {resQuotes.length > 0 && (
              <div>
                <div className="bg-[#111111] px-3 py-1.5 text-[10px] uppercase font-bold text-[#6b7280] tracking-wider">Quotes</div>
                {resQuotes.slice(0, 4).map(qu => (
                  <div key={qu.id} className="p-2.5 border-b border-[#1e1e1e] hover:bg-[#222222] cursor-pointer flex gap-2 items-center text-xs">
                    <FileText className="w-3 h-3 text-[#f97316]" />
                    <span className="font-semibold text-white">{qu.client}</span>
                    <span className="text-[#f97316] font-semibold">${Number(qu.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Focus Mode toggle (manager role) */}
      {userRole === 'manager' && (
        <button
          onClick={toggleFocusMode}
          title={focusMode ? 'Exit Focus Mode' : 'Focus Mode'}
          className={`p-2 rounded-[6px] transition flex items-center gap-1.5 text-xs font-semibold ${
            focusMode ? 'bg-[#f97316]/20 text-[#f97316]' : 'text-[#6b7280] hover:bg-[#1a1a1a] hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          {focusMode && <span>Focus</span>}
        </button>
      )}

      {/* Notification bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setShowNotifs(v => !v)}
          className="p-2 rounded-[6px] text-[#6b7280] hover:bg-[#1a1a1a] hover:text-white transition relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#f97316] rounded-full" />
          )}
        </button>
        {showNotifs && (
          <div className="absolute top-full right-0 mt-1 w-72 bg-[#1a1a1a] border border-[#2e2e2e] rounded-[8px] shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#2e2e2e]">
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={clearNotifications} className="text-[10px] text-[#f97316] hover:underline">Clear all</button>
              )}
            </div>
            {(notifications || []).length === 0 ? (
              <div className="p-4 text-xs text-[#6b7280] text-center">No notifications</div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {(notifications || []).slice(0, 20).map((n: any) => (
                  <div key={n.id} className="flex items-start gap-2 px-3 py-2.5 border-b border-[#222] hover:bg-[#222]">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      n.type === 'delivery' ? 'bg-blue-400' :
                      n.type === 'todo' ? 'bg-green-400' :
                      n.type === 'quote' ? 'bg-yellow-400' : 'bg-[#f97316]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white leading-snug">{n.msg}</div>
                      <div className="text-[10px] text-[#6b7280] mt-0.5">{new Date(n.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calendar export */}
      {(userRole === 'admin' || userRole === 'manager') && (
        <button onClick={exportCalendar} title="Export deliveries to calendar"
          className="p-2 rounded-[6px] text-[#6b7280] hover:bg-[#1a1a1a] hover:text-[#f97316] transition">
          <Calendar className="w-4 h-4" />
        </button>
      )}

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
