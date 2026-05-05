import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { ClipboardList, Filter, Clock, User, Download } from 'lucide-react';
import { format } from 'date-fns';

const ACTION_COLORS: Record<string, string> = {
  delivery: '#22c55e',
  quote:    '#60a5fa',
  contact:  '#f97316',
  user:     '#818cf8',
  login:    '#fbbf24',
  todo:     '#a78bfa',
  default:  '#6b7280',
};

function getCategory(txt: string): string {
  const t = txt.toLowerCase();
  if (t.includes('deliver')) return 'delivery';
  if (t.includes('quote')) return 'quote';
  if (t.includes('contact')) return 'contact';
  if (t.includes('user') || t.includes('account')) return 'user';
  if (t.includes('login') || t.includes('sign')) return 'login';
  if (t.includes('task') || t.includes('todo')) return 'todo';
  return 'default';
}

export function AuditPage() {
  const { activity, users } = useAppStore();
  const [filterUser, setFilterUser] = useState<number | 'all'>('all');
  const [filterCat, setFilterCat] = useState('all');

  const filtered = [...activity]
    .filter(a => filterUser === 'all' || a.userId === filterUser)
    .filter(a => filterCat === 'all' || getCategory(a.txt) === filterCat)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 300);

  const userName = (userId: number) => {
    const u = users.find(u => u.id === userId);
    return u ? `${u.first} ${u.last}` : 'System';
  };

  const exportCSV = () => {
    const rows = [['Timestamp', 'User', 'Action']];
    filtered.forEach(a => {
      rows.push([
        a.ts ? format(new Date(a.ts), 'yyyy-MM-dd HH:mm:ss') : '',
        a.userId ? userName(a.userId) : 'System',
        a.txt,
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit-log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const categories = ['all', 'delivery', 'quote', 'contact', 'user', 'login', 'todo'];

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-[#818cf8]/15 flex items-center justify-center">
            <ClipboardList className="w-4.5 h-4.5 text-[#818cf8]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Audit Log</h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">{activity.length} total events recorded</p>
          </div>
        </div>
        <button onClick={exportCSV} className="win-btn win-btn-default flex items-center gap-2 text-xs">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#6b7280]" />
          <select className="win-input py-1 text-xs w-[150px]" value={filterUser}
            onChange={e => setFilterUser(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value="all">All Users</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.first} {u.last}</option>)}
          </select>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-[4px] transition ${filterCat === cat ? 'bg-[#818cf8]/20 text-[#818cf8]' : 'text-[#6b7280] hover:bg-[#1e1e1e]'}`}>
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-1">
        {filtered.length === 0 && (
          <div className="text-center text-[#6b7280] py-16 text-sm">No activity recorded yet. Actions like creating deliveries, quotes, and contacts will appear here.</div>
        )}
        {filtered.map((a, i) => {
          const cat = getCategory(a.txt);
          const color = ACTION_COLORS[cat] || ACTION_COLORS.default;
          return (
            <div key={i} className="flex items-start gap-3 bg-[#1a1a1a] border border-[#2e2e2e] rounded-[8px] px-4 py-3 hover:border-[#3a3a3a] transition">
              <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-snug">{a.txt}</p>
                <div className="flex items-center gap-3 mt-1">
                  {a.userId && (
                    <span className="text-[10px] flex items-center gap-1" style={{ color }}>
                      <User className="w-2.5 h-2.5" /> {userName(a.userId)}
                    </span>
                  )}
                  <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {a.ts ? format(new Date(a.ts), 'MMM d, yyyy · h:mm a') : '—'}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ background: color + '20', color }}>
                    {cat}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
