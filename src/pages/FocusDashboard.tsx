import { ReactNode } from 'react';
import { useAppStore } from '../lib/store';
import { Truck, CheckSquare, FileText, AlertCircle, Clock } from 'lucide-react';

export function FocusDashboard() {
  const { deliveries, todos, quotes, currentUser, users, punches } = useAppStore();

  const today = new Date().toISOString().slice(0, 10);
  const todayDeliveries = deliveries.filter(d => d.date === today);
  const delivered = todayDeliveries.filter(d => d.status === 'delivered');
  const enRoute = todayDeliveries.filter(d => d.status === 'onroute');
  const scheduled = todayDeliveries.filter(d => d.status === 'scheduled');
  const issues = todayDeliveries.filter(d => d.status === 'issue');

  const openTodos = todos.filter(t => !t.done);
  const openQuotes = quotes.filter(q => q.status !== 'accepted' && q.status !== 'rejected');
  const weekRevenue = quotes
    .filter(q => q.status === 'accepted')
    .reduce((s, q) => s + (Number(q.amount) || 0), 0);

  // Who's clocked in right now?
  const clockedIn = users.filter(u => {
    const userPunches = punches.filter((p: any) => p.userId === u.id).sort((a: any, b: any) => b.ts - a.ts);
    return userPunches[0]?.type === 'in';
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-white">{greeting()}, {currentUser.first} 👋</h1>
        <p className="text-[#6b7280] text-[16px] mt-1">{new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Big stat cards */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <BigCard
          icon={<Truck className="w-8 h-8" />}
          label="Today's Deliveries"
          main={todayDeliveries.length}
          detail={`${delivered.length} done · ${enRoute.length} en route · ${scheduled.length} scheduled`}
          color="#3b82f6"
          alert={issues.length > 0 ? `${issues.length} issue${issues.length > 1 ? 's' : ''} flagged` : undefined}
        />
        <BigCard
          icon={<FileText className="w-8 h-8" />}
          label="Open Quotes"
          main={openQuotes.length}
          detail={`$${weekRevenue.toLocaleString()} accepted total`}
          color="#f59e0b"
        />
        <BigCard
          icon={<CheckSquare className="w-8 h-8" />}
          label="Open Tasks"
          main={openTodos.length}
          detail={openTodos.length === 0 ? 'All caught up!' : `${openTodos.slice(0, 2).map(t => t.title).join(', ')}${openTodos.length > 2 ? '…' : ''}`}
          color="#10b981"
        />
      </div>

      {/* Delivery status */}
      {todayDeliveries.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[12px] p-5 mb-5">
          <h2 className="text-[16px] font-bold text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" /> Today's Runs
          </h2>
          <div className="space-y-2">
            {todayDeliveries.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-3 bg-[#111] rounded-[8px]">
                <StatusDot status={d.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-white truncate">{d.customer}</div>
                  <div className="text-[12px] text-[#9ca3af] truncate">{d.address}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[12px] text-[#9ca3af]">{d.driver || 'Unassigned'}</div>
                  <div className="text-[11px]" style={{ color: statusColor(d.status) }}>{d.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues alert */}
      {issues.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-[12px] p-4 mb-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-[14px] font-bold text-red-400">Delivery Issues Flagged</div>
            {issues.map(d => (
              <div key={d.id} className="text-[13px] text-[#9ca3af] mt-1">{d.customer} — {d.address}</div>
            ))}
          </div>
        </div>
      )}

      {/* Clocked-in staff */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[12px] p-5">
        <h2 className="text-[16px] font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-400" /> Staff On Shift ({clockedIn.length})
        </h2>
        {clockedIn.length === 0 ? (
          <p className="text-[#6b7280] text-[13px]">Nobody clocked in yet today.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {clockedIn.map(u => (
              <div key={u.id} className="flex items-center gap-2 bg-[#111] rounded-[8px] px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-[13px] font-semibold text-white">{u.first} {u.last}</span>
                <span className="text-[11px] text-[#6b7280] capitalize">{u.role.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BigCard({ icon, label, main, detail, color, alert }: {
  icon: ReactNode; label: string; main: number; detail: string; color: string; alert?: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[12px] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: color + '22', color }}>
          {icon}
        </div>
        <span className="text-[13px] text-[#6b7280] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-[48px] font-bold text-white leading-none mb-1">{main}</div>
      <div className="text-[12px] text-[#9ca3af]">{detail}</div>
      {alert && (
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-red-400 font-semibold">
          <AlertCircle className="w-3.5 h-3.5" /> {alert}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColor(status) }} />
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'delivered': return '#10b981';
    case 'onroute':   return '#3b82f6';
    case 'scheduled': return '#9ca3af';
    case 'issue':     return '#ef4444';
    default:          return '#6b7280';
  }
}
