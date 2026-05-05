import { useAppStore } from '../lib/store';
import { BarChart as BarC, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity } from 'lucide-react';

export function AnalyticsPage() {
  const { deals, deliveries, quotes, currentUser, userRole, viewFilter } = useAppStore();

  const effectiveUserId = userRole === 'admin' ? viewFilter : currentUser.id;
  const scopedDeals = effectiveUserId === 'all' ? deals : deals.filter(d => (d.ownerId || 1) === effectiveUserId);
  const scopedQuotes = effectiveUserId === 'all' ? quotes : quotes.filter(q => (q.ownerId || 1) === effectiveUserId);

  // Deal Stage Data
  const stageData = [
    { name: 'Quoting', count: scopedDeals.filter((d: any) => d.stage === 'Quoting').length },
    { name: 'Measurements', count: scopedDeals.filter((d: any) => d.stage === 'Measurements').length },
    { name: 'Engineering', count: scopedDeals.filter((d: any) => d.stage === 'Engineering').length },
    { name: 'Production', count: scopedDeals.filter((d: any) => d.stage === 'Production').length },
    { name: 'Delivery', count: scopedDeals.filter((d: any) => d.stage === 'Delivery').length }
  ];

  // Pipeline Value by Stage
  const pipelineData = [
    { name: 'Quoting', value: scopedDeals.filter((d: any) => d.stage === 'Quoting').reduce((acc: number, d: any) => acc + d.value, 0) },
    { name: 'Measurements', value: scopedDeals.filter((d: any) => d.stage === 'Measurements').reduce((acc: number, d: any) => acc + d.value, 0) },
    { name: 'Engineering', value: scopedDeals.filter((d: any) => d.stage === 'Engineering').reduce((acc: number, d: any) => acc + d.value, 0) },
    { name: 'Production', value: scopedDeals.filter((d: any) => d.stage === 'Production').reduce((acc: number, d: any) => acc + d.value, 0) },
    { name: 'Delivery', value: scopedDeals.filter((d: any) => d.stage === 'Delivery').reduce((acc: number, d: any) => acc + d.value, 0) }
  ];

  // Delivery Status (Admin/Driver)
  const deliveryData = [
    { name: 'Scheduled', value: deliveries.filter((d: any) => d.status === 'scheduled').length },
    { name: 'On Route', value: deliveries.filter((d: any) => d.status === 'onroute').length },
    { name: 'Delivered', value: deliveries.filter((d: any) => d.status === 'delivered').length }
  ];
  const COLORS = ['#0078d4', '#d83b01', '#107c10'];

  // Summary Metrics
  const totalDeals = scopedDeals.length;
  const activeDeals = scopedDeals.filter((d: any) => d.stage !== 'Delivery').length;
  const totalPipeline = scopedDeals.reduce((acc: number, d: any) => acc + d.value, 0);
  const totalQuotes = scopedQuotes.length;
  const acceptedQuotes = scopedQuotes.filter((q: any) => q.status === 'accepted').length;

  return (
    <div className="flex flex-col h-full bg-win-bg p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-2">
           <Activity className="w-5 h-5 text-win-accent" />
           <span className="text-xl font-semibold">Analytics Dashboard</span>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-win-surface border border-win-border p-4 rounded-[4px] shadow-sm">
          <div className="text-sm text-win-text-sec mb-1">Total Pipeline Value</div>
          <div className="text-2xl font-bold">${totalPipeline.toLocaleString()}</div>
        </div>
        <div className="bg-win-surface border border-win-border p-4 rounded-[4px] shadow-sm">
          <div className="text-sm text-win-text-sec mb-1">Active Deals</div>
          <div className="text-2xl font-bold">{activeDeals}</div>
        </div>
        <div className="bg-win-surface border border-win-border p-4 rounded-[4px] shadow-sm">
          <div className="text-sm text-win-text-sec mb-1">Win Rate</div>
          <div className="text-2xl font-bold">{totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0}%</div>
        </div>
        <div className="bg-win-surface border border-win-border p-4 rounded-[4px] shadow-sm">
          <div className="text-sm text-win-text-sec mb-1">Pending Deliveries</div>
          <div className="text-2xl font-bold">{deliveries.filter((d: any) => d.status !== 'delivered').length}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Deal Stage Bar Chart */}
        <div className="bg-win-surface border border-win-border p-4 rounded-[4px] shadow-sm flex flex-col">
          <div className="text-sm font-semibold mb-6">Deals by Stage</div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarC data={stageData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={{stroke: '#e5e5e5'}} tickLine={false} />
                <YAxis allowDecimals={false} tick={{fontSize: 10}} axisLine={{stroke: '#e5e5e5'}} tickLine={false} />
                <Tooltip cursor={{fill: '#f3f3f3'}} contentStyle={{fontSize: '12px', borderRadius: '4px', border: '1px solid #e5e5e5'}} />
                <Bar dataKey="count" fill="#0078d4" radius={[2, 2, 0, 0]} />
              </BarC>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Value Bar Chart */}
        <div className="bg-win-surface border border-win-border p-4 rounded-[4px] shadow-sm flex flex-col">
          <div className="text-sm font-semibold mb-6">Pipeline Value ($) by Stage</div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarC data={pipelineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={{stroke: '#e5e5e5'}} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${v/1000}k`} tick={{fontSize: 10}} axisLine={{stroke: '#e5e5e5'}} tickLine={false} />
                <Tooltip cursor={{fill: '#f3f3f3'}} formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{fontSize: '12px', borderRadius: '4px', border: '1px solid #e5e5e5'}} />
                <Bar dataKey="value" fill="#d83b01" radius={[2, 2, 0, 0]} />
              </BarC>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deliveries Pie Chart */}
        <div className="bg-win-surface border border-win-border p-4 rounded-[4px] shadow-sm flex flex-col">
          <div className="text-sm font-semibold mb-6">Delivery Status</div>
          <div className="h-64 w-full flex items-center justify-center">
            {deliveries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliveryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deliveryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{fontSize: '12px', borderRadius: '4px', border: '1px solid #e5e5e5'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-win-text-sec text-sm">No deliveries scheduled.</div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-2">
             {deliveryData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1 text-xs">
                   <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i]}} />
                   <span className="text-win-text-sec">{d.name}</span>
                </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}
