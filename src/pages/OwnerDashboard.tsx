import { useMemo, ReactNode } from 'react';
import { useAppStore } from '../lib/store';
import { Building2, Truck, FileText, CheckSquare, DollarSign } from 'lucide-react';

export function OwnerDashboard() {
  const { stores, deliveries, quotes, contacts, users, todos, punches, activity } = useAppStore();

  const storeStats = useMemo(() => {
    return stores.map(store => {
      const storeUsers = users.filter(u => u.storeId === store.id || store.id === 'jk-hardware-001');
      const storeDeliveries = deliveries.filter(d => {
        // For the main store, show all; for others, filter by storeId
        if (store.id === 'jk-hardware-001') return true;
        const driver = storeUsers.find(u => u.first + ' ' + u.last === d.driver);
        return driver || d.storeId === store.id;
      });
      const storeQuotes = quotes.filter(q => {
        if (store.id === 'jk-hardware-001') return true;
        return storeUsers.some(u => u.id === q.ownerId);
      });

      const today = new Date().toISOString().slice(0, 10);
      const todayDeliveries = storeDeliveries.filter(d => d.date === today);
      const delivered = todayDeliveries.filter(d => d.status === 'delivered').length;
      const pending = todayDeliveries.filter(d => d.status === 'scheduled' || d.status === 'onroute').length;
      const issues = todayDeliveries.filter(d => d.status === 'issue').length;

      const openQuotes = storeQuotes.filter(q => q.status !== 'accepted' && q.status !== 'rejected');
      const quoteRevenue = storeQuotes
        .filter(q => q.status === 'accepted')
        .reduce((sum, q) => sum + (Number(q.amount) || 0), 0);
      const pendingRevenue = openQuotes.reduce((sum, q) => sum + (Number(q.amount) || 0), 0);

      const activeTodos = todos.filter(t => !t.done && storeUsers.some(u => u.id === (t.ownerId || 1)));
      const storeManagers = users.filter(u => u.storeId === store.id && u.role === 'store_manager');

      return {
        store,
        todayDeliveries: todayDeliveries.length,
        delivered,
        pending,
        issues,
        openQuotes: openQuotes.length,
        quoteRevenue,
        pendingRevenue,
        activeTodos: activeTodos.length,
        storeManagers,
        totalContacts: contacts.length,
      };
    });
  }, [stores, deliveries, quotes, contacts, users, todos]);

  const totals = useMemo(() => ({
    deliveries: storeStats.reduce((s, st) => s + st.todayDeliveries, 0),
    delivered: storeStats.reduce((s, st) => s + st.delivered, 0),
    issues: storeStats.reduce((s, st) => s + st.issues, 0),
    revenue: storeStats.reduce((s, st) => s + st.quoteRevenue, 0),
    pending: storeStats.reduce((s, st) => s + st.pendingRevenue, 0),
    openQuotes: storeStats.reduce((s, st) => s + st.openQuotes, 0),
  }), [storeStats]);

  const recentActivity = activity.slice(0, 12);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          icon={<Truck className="w-5 h-5" />}
          label="Today's Deliveries"
          value={totals.deliveries}
          sub={`${totals.delivered} delivered · ${totals.issues} issues`}
          color="#3b82f6"
        />
        <SummaryCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Accepted Revenue"
          value={`$${totals.revenue.toLocaleString()}`}
          sub={`$${totals.pending.toLocaleString()} pending`}
          color="#10b981"
        />
        <SummaryCard
          icon={<FileText className="w-5 h-5" />}
          label="Open Quotes"
          value={totals.openQuotes}
          sub="Across all stores"
          color="#f59e0b"
        />
        <SummaryCard
          icon={<Building2 className="w-5 h-5" />}
          label="Stores"
          value={stores.length}
          sub={`${users.length} total users`}
          color="#f97316"
        />
      </div>

      {/* Per-store breakdown */}
      <div>
        <h2 className="text-[13px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Store Breakdown</h2>
        <div className="grid grid-cols-1 gap-3">
          {storeStats.map(({ store, todayDeliveries, delivered, pending, issues, openQuotes, quoteRevenue, pendingRevenue, activeTodos, storeManagers }) => (
            <div key={store.id} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[10px] p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[7px] bg-[#f97316]/20 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[#f97316]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-white">{store.name}</div>
                    <div className="text-[11px] text-[#6b7280]">{store.address || 'No address'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[#6b7280]">
                    {storeManagers.length > 0
                      ? storeManagers.map(m => `${m.first} ${m.last}`).join(', ')
                      : 'No manager assigned'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3">
                <StatPill label="Today" value={todayDeliveries} icon="🚚" />
                <StatPill label="Delivered" value={delivered} icon="✅" color="text-green-400" />
                <StatPill label="En Route" value={pending} icon="🔵" color="text-blue-400" />
                <StatPill label="Issues" value={issues} icon="⚠️" color={issues > 0 ? 'text-red-400' : 'text-[#6b7280]'} />
                <StatPill label="Open Quotes" value={openQuotes} icon="📄" color="text-yellow-400" />
                <div className="bg-[#111111] rounded-[6px] px-3 py-2 text-center">
                  <div className="text-[10px] text-[#6b7280] mb-0.5">Revenue</div>
                  <div className="text-[13px] font-bold text-green-400">${(quoteRevenue / 1000).toFixed(0)}k</div>
                  <div className="text-[9px] text-[#6b7280]">${(pendingRevenue / 1000).toFixed(0)}k pend.</div>
                </div>
              </div>

              {activeTodos > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#9ca3af]">
                  <CheckSquare className="w-3 h-3 text-[#f97316]" />
                  <span>{activeTodos} open task{activeTodos !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity + Top Performers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[10px] p-4">
          <h3 className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <div className="text-xs text-[#6b7280]">No activity yet</div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f97316] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-white leading-snug truncate">{a.txt}</div>
                    <div className="text-[10px] text-[#6b7280]">{new Date(a.ts).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[10px] p-4">
          <h3 className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-widest mb-3">Team Overview</h3>
          {users.slice(0, 10).map(u => {
            const userQuotes = quotes.filter(q => q.ownerId === u.id);
            const accepted = userQuotes.filter(q => q.status === 'accepted').length;
            const userDeliveries = deliveries.filter(d => d.ownerId === u.id).length;
            return (
              <div key={u.id} className="flex items-center gap-2.5 py-1.5 border-b border-[#222] last:border-0">
                <div className="w-6 h-6 rounded-[5px] bg-[#252525] flex items-center justify-center text-[9px] font-bold text-[#9ca3af] shrink-0">
                  {u.first[0]}{u.last[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-white truncate">{u.first} {u.last}</div>
                  <div className="text-[10px] text-[#6b7280] capitalize">{u.role.replace('_', ' ')}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-white">{userQuotes.length} quotes</div>
                  <div className="text-[10px] text-[#6b7280]">{accepted} accepted</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, color }: {
  icon: ReactNode; label: string; value: string | number; sub: string; color: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[10px] p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-[6px] flex items-center justify-center" style={{ backgroundColor: color + '22', color }}>
          {icon}
        </div>
        <span className="text-[11px] text-[#6b7280] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-[28px] font-bold text-white leading-none">{value}</div>
      <div className="text-[11px] text-[#6b7280] mt-1">{sub}</div>
    </div>
  );
}

function StatPill({ label, value, icon, color = 'text-white' }: {
  label: string; value: number; icon: string; color?: string;
}) {
  return (
    <div className="bg-[#111111] rounded-[6px] px-3 py-2 text-center">
      <div className="text-[10px] text-[#6b7280] mb-0.5">{label}</div>
      <div className={`text-[15px] font-bold ${color}`}>{value}</div>
    </div>
  );
}
