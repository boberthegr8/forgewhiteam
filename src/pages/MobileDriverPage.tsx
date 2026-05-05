import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { Truck, CheckCircle, AlertTriangle, Clock, MapPin, Phone, ChevronDown, ChevronUp, LogOut, Navigation } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; next: string; nextLabel: string }> = {
  scheduled: { label: 'Scheduled',  color: '#60a5fa', next: 'onroute',   nextLabel: 'Start Delivery' },
  onroute:   { label: 'En Route',   color: '#f97316', next: 'delivered', nextLabel: 'Mark Delivered' },
  delivered: { label: 'Delivered',  color: '#22c55e', next: 'delivered', nextLabel: 'Delivered ✓' },
  issue:     { label: 'Issue',      color: '#ef4444', next: 'scheduled', nextLabel: 'Reset' },
};

export function MobileDriverPage() {
  const { deliveries, currentUser, editDelivery, logout } = useAppStore();
  const { addToast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const myDeliveries = deliveries
    .filter(d => d.date === today)
    .sort((a: any, b: any) => {
      const order = ['priority-1', 'priority-2', 'am', 'pm', 'eve'];
      return order.indexOf(a.slot) - order.indexOf(b.slot);
    });

  const done = myDeliveries.filter(d => d.status === 'delivered').length;
  const total = myDeliveries.length;

  const logGps = (deliveryId: number, status: string) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const entry = {
          status,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          ts: Date.now(),
        };
        const delivery = deliveries.find(d => d.id === deliveryId);
        const existing = delivery?.gpsLog || [];
        editDelivery(deliveryId, { gpsLog: [...existing, entry] });
      },
      () => {} // silently ignore if denied
    );
  };

  const advance = (delivery: any) => {
    const cfg = STATUS_CONFIG[delivery.status] || STATUS_CONFIG.scheduled;
    if (delivery.status === 'delivered') return;
    editDelivery(delivery.id, { status: cfg.next });
    logGps(delivery.id, cfg.next);
    addToast(cfg.nextLabel + ' — ' + delivery.customer, 'success');
  };

  const flagIssue = (delivery: any) => {
    editDelivery(delivery.id, { status: 'issue' });
    logGps(delivery.id, 'issue');
    addToast('Issue flagged for ' + delivery.customer, 'error');
  };

  const openMaps = (address: string) => {
    window.open('https://maps.google.com/?q=' + encodeURIComponent(address), '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col pb-8">
      {/* Header */}
      <div className="bg-[#111111] border-b border-[#1e1e1e] px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-[#f97316] flex items-center justify-center shadow-[0_0_16px_rgba(249,115,22,0.4)]">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Hey, {currentUser.first}!</div>
            <div className="text-[11px] text-[#9ca3af]">{done}/{total} delivered today</div>
          </div>
        </div>
        <button onClick={logout} className="p-2 rounded-[6px] text-[#6b7280] hover:text-[#ef4444] hover:bg-[#1a1a1a] transition">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#1e1e1e]">
        <div className="h-full bg-[#f97316] transition-all" style={{ width: total > 0 ? (done / total * 100) + '%' : '0%' }} />
      </div>

      {/* Delivery cards */}
      <div className="px-4 pt-4 flex flex-col gap-3">
        {myDeliveries.length === 0 && (
          <div className="text-center text-[#6b7280] py-16 text-sm">
            No deliveries scheduled for today.
          </div>
        )}

        {myDeliveries.map(delivery => {
          const cfg = STATUS_CONFIG[delivery.status] || STATUS_CONFIG.scheduled;
          const isExpanded = expandedId === delivery.id;
          const isDone = delivery.status === 'delivered';

          return (
            <div key={delivery.id}
              className={`bg-[#1a1a1a] border rounded-[12px] overflow-hidden transition ${isDone ? 'border-[#22c55e]/30 opacity-70' : 'border-[#2e2e2e]'}`}>
              {/* Status bar */}
              <div className="h-1" style={{ background: cfg.color }} />

              {/* Main content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-base leading-tight">{delivery.customer}</div>
                    <div className="text-sm text-[#9ca3af] mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{delivery.address || 'No address'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0"
                    style={{ background: cfg.color + '20', color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>

                {/* Quick info */}
                <div className="flex items-center gap-3 text-[11px] text-[#6b7280] mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {delivery.slot?.replace('-', ' ').replace('priority', 'P') || '—'}
                  </span>
                  {delivery.hardware && <span>Hardware: {delivery.hardware}</span>}
                  {delivery.call === 'Yes' && (
                    <span className="flex items-center gap-1 text-[#f97316]">
                      <Phone className="w-3 h-3" /> Call ahead
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {delivery.address && (
                    <button onClick={() => openMaps(delivery.address)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#252525] hover:bg-[#2e2e2e] text-[#9ca3af] hover:text-white text-sm font-semibold py-3 rounded-[8px] transition">
                      <Navigation className="w-4 h-4" /> Navigate
                    </button>
                  )}
                  {!isDone && (
                    <>
                      <button onClick={() => flagIssue(delivery)}
                        className="flex items-center justify-center px-3 bg-[#3b1a1a] hover:bg-[#4a1f1f] text-[#ef4444] py-3 rounded-[8px] transition">
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                      <button onClick={() => advance(delivery)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-white text-sm font-bold py-3 rounded-[8px] transition"
                        style={{ background: cfg.color }}>
                        {delivery.status === 'scheduled' ? <Truck className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        {cfg.nextLabel}
                      </button>
                    </>
                  )}
                  {isDone && (
                    <div className="flex-1 flex items-center justify-center gap-1.5 bg-[#22c55e]/10 text-[#22c55e] text-sm font-bold py-3 rounded-[8px]">
                      <CheckCircle className="w-4 h-4" /> Delivered
                    </div>
                  )}
                </div>

                {/* Expand for notes */}
                {delivery.comments && (
                  <button onClick={() => setExpandedId(isExpanded ? null : delivery.id)}
                    className="w-full flex items-center justify-center gap-1 mt-2 text-[11px] text-[#6b7280] hover:text-white transition">
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isExpanded ? 'Hide notes' : 'View notes'}
                  </button>
                )}
                {isExpanded && delivery.comments && (
                  <div className="mt-2 bg-[#111111] rounded-[6px] px-3 py-2 text-xs text-[#9ca3af]">
                    {delivery.comments}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
