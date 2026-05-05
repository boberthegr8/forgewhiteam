import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  type DragStartEvent, type DragEndEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { Trello, Truck, GripVertical, DollarSign } from 'lucide-react';

const STAGES = ['Quoting', 'Site Visit', 'Engineering', 'Permit', 'Framing', 'Truss Install', 'Complete'];

const STAGE_COLORS: Record<string, string> = {
  'Quoting':     '#9ca3af',
  'Site Visit':  '#60a5fa',
  'Engineering': '#a78bfa',
  'Permit':      '#f59e0b',
  'Framing':     '#f97316',
  'Truss Install':'#22c55e',
  'Complete':    '#22c55e',
};

// ── Draggable deal card ───────────────────────────────────────────────────────
function DraggableDeal({ deal, onSchedule }: { deal: any; onSchedule: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `deal-${deal.id}`,
    data: { type: 'deal', deal },
  });

  const fmt = (n: number) => '$' + Number(n).toLocaleString();

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className="bg-[#222222] border border-[#2e2e2e] rounded-[8px] p-4 hover:border-[#3a3a3a] transition group flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-sm text-white">{deal.client}</div>
          <div className="text-xs text-[#9ca3af]">{deal.company}</div>
        </div>
        <div
          {...attributes} {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-[#6b7280] hover:text-[#f97316] transition shrink-0"
          title="Drag to move stage"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="font-bold text-[#f97316] flex items-center gap-1">
        <DollarSign className="w-3.5 h-3.5" />{fmt(deal.value)}
      </div>

      <div className="text-[10px] text-[#6b7280]">Added {deal.date}</div>

      <button
        onClick={(e) => { e.stopPropagation(); onSchedule(); }}
        className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-[#9ca3af] hover:text-[#f97316] py-1.5 rounded-[5px] border border-[#2e2e2e] hover:border-[#f97316]/30 transition mt-1"
      >
        <Truck className="w-3 h-3" /> Schedule Delivery
      </button>
    </div>
  );
}

// ── Droppable stage column ────────────────────────────────────────────────────
function DroppableStage({ stage, children, count }: { stage: string; children: React.ReactNode; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage}`, data: { type: 'stage', stage } });
  const color = STAGE_COLORS[stage] || '#9ca3af';

  return (
    <div
      ref={setNodeRef}
      className={`w-[270px] shrink-0 flex flex-col rounded-[10px] border transition-all
        ${isOver ? 'border-[#f97316]/60 bg-[#1e1e1e] shadow-[0_0_16px_rgba(249,115,22,0.1)]' : 'border-[#2e2e2e] bg-[#1a1a1a]'}`}
    >
      {/* Stage header */}
      <div className="px-3 py-3 border-b border-[#2e2e2e] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider">{stage}</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${count > 0 ? 'bg-[#252525] text-white' : 'bg-[#1e1e1e] text-[#6b7280]'}`}>
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className="p-2 flex flex-col gap-2 overflow-y-auto flex-1 min-h-[80px]">
        {children}
        {isOver && (
          <div className="h-12 border-2 border-dashed border-[#f97316]/40 rounded-[7px] flex items-center justify-center">
            <span className="text-[10px] text-[#f97316]/60">Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main PipelinePage ─────────────────────────────────────────────────────────
export function PipelinePage() {
  const { deals, addDealToDelivery, dragDeal, currentUser, userRole, viewFilter } = useAppStore();
  const { addToast } = useToast();
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [activeDeal, setActiveDeal] = useState<any>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const effectiveUserId = userRole === 'admin' ? viewFilter : currentUser.id;
  const scopedDeals = effectiveUserId === 'all' ? deals : deals.filter(d => (d.ownerId || 1) === effectiveUserId);

  const totalValue = scopedDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
  const fmt = (n: number) => '$' + Number(n).toLocaleString();

  const handleDragStart = (e: DragStartEvent) => setActiveDeal((e.active.data.current as any).deal);
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = e;
    if (!over) return;
    const deal = (active.data.current as any).deal;
    const target = over.data.current as any;
    if (target?.type === 'stage' && deal.stage !== target.stage) {
      dragDeal(deal.id, target.stage);
      addToast(`${deal.client} moved to ${target.stage}.`, 'success');
    }
  };

  const handleScheduleDelivery = () => {
    if (!selectedDeal) return;
    addDealToDelivery(selectedDeal, deliveryDate);
    addToast(`Delivery scheduled for ${selectedDeal.client}!`, 'success');
    setScheduleModal(false);
    setSelectedDeal(null);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-[#0f0f0f] overflow-hidden p-5 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#f97316]/15 flex items-center justify-center">
              <Trello className="w-4.5 h-4.5 text-[#f97316]" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">Pipeline</span>
              <span className="ml-3 text-sm text-[#9ca3af]">{scopedDeals.length} deals · {fmt(totalValue)} total</span>
            </div>
          </div>
          <div className="text-xs text-[#6b7280] flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5" />
            Drag cards between stages
          </div>
        </div>

        {/* Stage columns */}
        <div className="flex-1 flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageDeals = scopedDeals.filter(d => d.stage === stage);
            return (
              <DroppableStage key={stage} stage={stage} count={stageDeals.length}>
                {stageDeals.map(deal => (
                  <DraggableDeal
                    key={deal.id}
                    deal={deal}
                    onSchedule={() => { setSelectedDeal(deal); setScheduleModal(true); }}
                  />
                ))}
              </DroppableStage>
            );
          })}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDeal && (
          <div className="bg-[#222222] border border-[#f97316] rounded-[8px] p-4 shadow-[0_0_20px_rgba(249,115,22,0.3)] w-[240px] rotate-2 opacity-95">
            <div className="font-semibold text-white text-sm">{activeDeal.client}</div>
            <div className="text-[#f97316] font-bold mt-1">{fmt(activeDeal.value)}</div>
          </div>
        )}
      </DragOverlay>

      {/* Schedule delivery modal */}
      {scheduleModal && selectedDeal && (
        <div className="modal-overlay">
          <div className="modal-box w-[400px]">
            <div className="px-6 py-4 border-b border-[#2e2e2e]">
              <h2 className="font-semibold text-white">Schedule Delivery From Pipeline</h2>
              <p className="text-xs text-[#9ca3af] mt-0.5">{selectedDeal.client} · {selectedDeal.company}</p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Delivery Date</span>
                <input type="date" className="win-input" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
              </label>
            </div>
            <div className="px-6 py-4 border-t border-[#2e2e2e] flex justify-end gap-2">
              <button className="win-btn win-btn-default" onClick={() => setScheduleModal(false)}>Cancel</button>
              <button className="win-btn win-btn-primary" onClick={handleScheduleDelivery}>Schedule Delivery</button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}
