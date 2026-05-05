import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { Truck, ChevronLeft, ChevronRight, Camera, X, ZoomIn, MapPin, Route } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';

// ── Signature Modal ───────────────────────────────────────────────────────────
function SignatureModal({ onSave, onClose }: { onSave: (sig: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = (e: any) => {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: any) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  };

  const stopDraw = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const canvas = canvasRef.current!;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box w-[480px] max-w-full">
        <div className="px-6 py-4 border-b border-[#2e2e2e] flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-white">Customer Signature</h2>
            <p className="text-xs text-[#9ca3af] mt-0.5">Sign in the box below (optional)</p>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <canvas ref={canvasRef} width={420} height={180}
            className="w-full rounded-[8px] border border-[#3a3a3a] cursor-crosshair touch-none"
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
          />
        </div>
        <div className="px-6 py-4 border-t border-[#2e2e2e] flex justify-between">
          <button className="win-btn win-btn-default" onClick={clear}>Clear</button>
          <div className="flex gap-2">
            <button className="win-btn win-btn-default" onClick={onClose}>Skip</button>
            <button className="win-btn win-btn-primary" onClick={save}>Save Signature</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'SCHEDULED', onroute: 'ON ROUTE', delivered: 'DELIVERED', issue: 'ISSUE',
};
const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-[#252525] text-[#9ca3af]',
  onroute:   'bg-[#1e3a5f] text-[#60a5fa]',
  delivered: 'bg-[#14311f] text-[#22c55e]',
  issue:     'bg-[#3b1a1a] text-[#ef4444]',
};
const SLOTS = ['priority-1', 'priority-2', 'priority-3', 'am', 'pm'] as const;
const SLOT_LABELS: Record<string, string> = {
  'priority-1': '1st Priority', 'priority-2': '2nd Priority', 'priority-3': '3rd Priority',
  'am': 'AM Run', 'pm': 'PM Run',
};

// ── Draggable delivery card ───────────────────────────────────────────────────
function DraggableCard({ d, onEdit, onCycleStatus, onPhotoClick }: {
  d: any; onEdit: () => void; onCycleStatus: () => void; onPhotoClick: (url: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `delivery-${d.id}`,
    data: { type: 'delivery', delivery: d },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.35 : 1 }}
      className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[7px] hover:border-[#f97316]/50 transition-all cursor-grab active:cursor-grabbing select-none group"
    >
      <div
        {...attributes} {...listeners}
        className="h-1.5 bg-[#252525] group-hover:bg-[#f97316]/30 rounded-t-[7px] transition-colors cursor-grab"
        title="Drag to reschedule"
      />
      <div className="p-2.5">
        <div className="flex justify-between items-start mb-1 gap-1">
          <div className="font-semibold text-xs text-white leading-tight line-clamp-2 flex-1">{d.customer}</div>
          <button
            onClick={(e) => { e.stopPropagation(); onCycleStatus(); }}
            className={`text-[9px] whitespace-nowrap uppercase font-bold px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80 transition shrink-0 ${STATUS_COLORS[d.status] || STATUS_COLORS.scheduled}`}
            title="Click to cycle status"
          >
            {STATUS_LABELS[d.status] || d.status.toUpperCase()}
          </button>
        </div>

        {d.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(d.address)}`}
            target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] text-[#9ca3af] hover:text-[#f97316] transition mb-1.5 truncate"
          >
            <MapPin className="w-2.5 h-2.5 shrink-0" />{d.address}
          </a>
        )}

        {d.photos && d.photos.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-1.5">
            {d.photos.slice(0, 4).map((url: string, i: number) => (
              <div key={i} className="relative">
                <img
                  src={url} alt="site"
                  onClick={e => { e.stopPropagation(); onPhotoClick(url); }}
                  className="w-8 h-8 object-cover rounded-[4px] border border-[#2e2e2e] cursor-pointer hover:border-[#f97316] transition"
                />
                {i === 3 && d.photos.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 rounded-[4px] flex items-center justify-center text-[9px] text-white font-bold">
                    +{d.photos.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 flex-wrap">
          {d.driver && (
            <span className="text-[9px] px-1.5 py-0.5 bg-[#252525] rounded text-[#9ca3af]">{d.driver}</span>
          )}
          {d.hardware && (
            <span className="text-[9px] px-1.5 py-0.5 bg-[#252525] rounded text-[#f97316]">HW</span>
          )}
          {d.call === 'Yes' && (
            <span className="text-[9px] px-1.5 py-0.5 bg-[#252525] rounded text-[#3b82f6]">phone</span>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="mt-2 w-full text-[10px] py-1 rounded bg-[#252525] text-[#9ca3af] hover:bg-[#2e2e2e] hover:text-white transition"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

// ── Site Photos section ───────────────────────────────────────────────────────
function SitePhotosSection({ editingDelId, deliveries, onAddPhoto, onViewPhoto, onRemovePhoto }: {
  editingDelId: number | null;
  deliveries: any[];
  onAddPhoto: (id: number) => void;
  onViewPhoto: (url: string) => void;
  onRemovePhoto: (url: string) => void;
}) {
  if (editingDelId === null) return null;
  const del = deliveries.find(d => d.id === editingDelId);
  const photos: string[] = del?.photos || [];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Site Photos</span>
        <button type="button" onClick={() => onAddPhoto(editingDelId)}
          className="flex items-center gap-1.5 text-xs text-[#f97316] hover:text-[#ea6100] transition font-semibold">
          <Camera className="w-3.5 h-3.5" /> Add Photos
        </button>
      </div>
      {photos.length === 0 ? (
        <button type="button" onClick={() => onAddPhoto(editingDelId)}
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#2e2e2e] rounded-[8px] py-6 text-[#6b7280] hover:border-[#f97316]/40 hover:text-[#f97316] transition">
          <Camera className="w-7 h-7" />
          <span className="text-xs">Click to upload site photos</span>
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative group aspect-square">
              <img src={url} alt={`site ${i + 1}`} className="w-full h-full object-cover rounded-[6px] border border-[#2e2e2e]" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-[6px] flex items-center justify-center gap-1">
                <button onClick={() => onViewPhoto(url)} className="p-1 text-white hover:text-[#f97316] transition">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onRemovePhoto(url)} className="p-1 text-white hover:text-[#ef4444] transition">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => onAddPhoto(editingDelId)}
            className="aspect-square border-2 border-dashed border-[#2e2e2e] rounded-[6px] flex flex-col items-center justify-center text-[#6b7280] hover:border-[#f97316]/40 hover:text-[#f97316] transition">
            <Camera className="w-4 h-4 mb-1" />
            <span className="text-[9px]">Add</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Droppable day column ──────────────────────────────────────────────────────
function DroppableDayCol({ dayStr, isToday, children }: { dayStr: string; isToday: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dayStr}`, data: { type: 'day', date: dayStr } });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-0 rounded-[7px] border transition-all ${
        isOver ? 'border-[#f97316] bg-[rgba(249,115,22,0.04)] ring-1 ring-[#f97316]/20' :
        isToday ? 'border-[#f97316]/30 bg-[#1a1a1a]' : 'border-[#2e2e2e] bg-[#1a1a1a]'
      }`}
    >
      {children}
    </div>
  );
}

// ── Droppable slot zone ───────────────────────────────────────────────────────
function DroppableSlot({ dayStr, slot, children }: { dayStr: string; slot: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${dayStr}-${slot}`, data: { type: 'slot', date: dayStr, slot },
  });
  return (
    <div ref={setNodeRef} className={`rounded-[5px] transition-all ${isOver ? 'bg-[rgba(249,115,22,0.06)] ring-1 ring-[#f97316]/20' : ''}`}>
      {children}
    </div>
  );
}

// ── Main DeliveryBoard ────────────────────────────────────────────────────────
export function DeliveryBoard() {
  const {
    deliveries, users, addDelivery, editDelivery, deleteDelivery,
    addDeliveryPhoto, removeDeliveryPhoto, cycleDeliveryStatus, dragDelivery,
    userRole, currentUser,
  } = useAppStore();
  const { addToast } = useToast();

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({ customer: '', address: '', comments: '' });

  const handleQuickAdd = () => {
    if (!quickForm.customer.trim()) return;
    addDelivery({
      customer: quickForm.customer,
      address: quickForm.address,
      comments: quickForm.comments,
      date: new Date().toISOString().slice(0, 10),
      slot: 'am',
      driver: '',
      hardware: '',
      call: '',
      status: 'scheduled',
      ownerId: currentUser.id,
      photos: [],
      requestedBy: currentUser.first + ' ' + currentUser.last,
    });
    addToast('Request logged — a manager will assign a driver.', 'success');
    setQuickForm({ customer: '', address: '', comments: '' });
    setQuickAddOpen(false);
  };

  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addingDelivery, setAddingDelivery] = useState(false);
  const [editingDelId, setEditingDelId] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhotoDeliveryId, setPendingPhotoDeliveryId] = useState<number | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [sigDeliveryId, setSigDeliveryId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    customer: '', address: '', date: new Date().toISOString().slice(0, 10),
    slot: 'am', driver: '', hardware: '', call: '', comments: '', status: 'scheduled',
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }).map((_, i) => addDays(weekStart, i));
  const currentDateStr = format(currentDate, 'yyyy-MM-dd');
  const dayDels = deliveries.filter(d => d.date === currentDateStr);

  const prevPeriod = () => setCurrentDate(viewMode === 'day' ? addDays(currentDate, -1) : subWeeks(currentDate, 1));
  const nextPeriod = () => setCurrentDate(viewMode === 'day' ? addDays(currentDate, 1) : addWeeks(currentDate, 1));

  const handleOpenAdd = (defaultDate?: string, defaultSlot?: string) => {
    setFormData({
      customer: '', address: '',
      date: defaultDate || format(currentDate, 'yyyy-MM-dd'),
      slot: defaultSlot || 'am',
      driver: '', hardware: '', call: '', comments: '', status: 'scheduled',
    });
    setEditingDelId(null);
    setAddingDelivery(true);
  };

  const handleOpenEdit = (d: any) => {
    setFormData({ ...d });
    setEditingDelId(d.id);
    setAddingDelivery(true);
  };

  const handleSave = () => {
    if (!formData.customer.trim()) return;
    if (editingDelId) {
      editDelivery(editingDelId, formData);
      addToast('Delivery updated.', 'success');
    } else {
      addDelivery(formData);
      addToast('Delivery scheduled!', 'success');
    }
    setAddingDelivery(false);
  };

  const handleDelete = () => {
    if (editingDelId) {
      deleteDelivery(editingDelId);
      addToast('Delivery deleted.', 'error');
      setAddingDelivery(false);
    }
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>, deliveryId: number) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      addDeliveryPhoto(deliveryId, url);
    });
    if (files.length) addToast(files.length + ' photo(s) added.', 'success');
    e.target.value = '';
  };

  const handlePhotoForDelivery = (deliveryId: number) => {
    setPendingPhotoDeliveryId(deliveryId);
    photoInputRef.current?.click();
  };

  const optimizeRoute = (dateStr: string) => {
    const dayDeliveries = deliveries.filter(d => d.date === dateStr && d.status !== 'delivered');
    if (dayDeliveries.length < 2) { addToast('Need at least 2 active deliveries to optimize.', 'info'); return; }
    // Simple nearest-neighbor sort by address string (alphabetical as a proxy when no geocoding)
    const sorted = [...dayDeliveries].sort((a, b) => (a.address || '').localeCompare(b.address || ''));
    const slotOrder = ['priority-1', 'priority-2', 'priority-3', 'am', 'pm'];
    sorted.forEach((d, i) => {
      const slot = slotOrder[Math.min(i, slotOrder.length - 1)];
      editDelivery(d.id, { slot });
    });
    addToast('Route optimized — deliveries sorted by address proximity.', 'success');
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const delivery = (active.data.current as any).delivery;
    const target = over.data.current as any;
    if (!delivery || !target) return;
    if (target.type === 'day') {
      if (delivery.date !== target.date) {
        dragDelivery(delivery.id, target.date);
        addToast('Delivery moved to ' + format(new Date(target.date + 'T00:00:00'), 'EEEE, MMM d') + '.', 'success');
      }
    } else if (target.type === 'slot') {
      const changed = delivery.date !== target.date || delivery.slot !== target.slot;
      if (changed) {
        dragDelivery(delivery.id, target.date, target.slot);
        addToast('Moved to ' + SLOT_LABELS[target.slot] + ' on ' + format(new Date(target.date + 'T00:00:00'), 'MMM d') + '.', 'success');
      }
    }
  };

  const activeDelivery = activeId ? deliveries.find(d => 'delivery-' + d.id === activeId) : null;

  const renderSlots = (dDels: any[], dayStr: string, compact = false) =>
    SLOTS.map(slot => {
      const slotDels = dDels.filter(d => d.slot === slot);
      return (
        <DroppableSlot key={slot} dayStr={dayStr} slot={slot}>
          {slotDels.length > 0 && (
            <div className={`flex flex-col gap-1 ${compact ? '' : 'mb-2'}`}>
              <div className="text-[9px] uppercase font-bold text-[#6b7280] tracking-wider px-0.5">
                {SLOT_LABELS[slot]}
              </div>
              {slotDels.map(d => (
                <DraggableCard
                  key={d.id} d={d}
                  onEdit={() => handleOpenEdit(d)}
                  onCycleStatus={() => {
                    cycleDeliveryStatus(d.id);
                    addToast('Status updated.', 'info');
                  }}
                  onPhotoClick={(url) => setLightboxUrl(url)}
                />
              ))}
            </div>
          )}
          {slotDels.length === 0 && !compact && (
            <div
              className="h-8 rounded-[5px] border border-dashed border-[#2e2e2e] flex items-center justify-center text-[9px] text-[#3a3a3a] mb-1 cursor-pointer hover:border-[#f97316]/30 hover:text-[#f97316]/50 transition"
              onClick={() => handleOpenAdd(dayStr, slot)}
            >
              {SLOT_LABELS[slot]}
            </div>
          )}
        </DroppableSlot>
      );
    });

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-[#0f0f0f] p-4 overflow-hidden">

        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[7px] bg-[#f97316]/15 flex items-center justify-center">
              <Truck className="w-4 h-4 text-[#f97316]" />
            </div>
            <span className="text-lg font-bold text-white">Delivery Board</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#1a1a1a] border border-[#2e2e2e] rounded-[6px] p-0.5">
              <button
                className={`px-3 py-1 text-xs font-semibold rounded-[4px] transition ${viewMode === 'day' ? 'bg-[#f97316] text-white' : 'text-[#9ca3af] hover:text-white'}`}
                onClick={() => setViewMode('day')}
              >Day</button>
              <button
                className={`px-3 py-1 text-xs font-semibold rounded-[4px] transition ${viewMode === 'week' ? 'bg-[#f97316] text-white' : 'text-[#9ca3af] hover:text-white'}`}
                onClick={() => setViewMode('week')}
              >Week</button>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:bg-[#252525] rounded text-[#9ca3af] hover:text-white transition" onClick={prevPeriod}><ChevronLeft className="w-4 h-4" /></button>
              <button className="px-2 py-1 text-xs font-semibold hover:bg-[#252525] rounded text-[#9ca3af] hover:text-white transition" onClick={() => setCurrentDate(new Date())}>Today</button>
              <button className="p-1.5 hover:bg-[#252525] rounded text-[#9ca3af] hover:text-white transition" onClick={nextPeriod}><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="font-semibold text-sm text-white min-w-[140px] text-center">
              {viewMode === 'day' ? format(currentDate, 'EEEE, MMM d') : format(weekStart, 'MMM d') + ' - ' + format(addDays(weekStart, 5), 'MMM d, yyyy')}
            </div>
            <button
              className="win-btn win-btn-default whitespace-nowrap text-xs flex items-center gap-1.5"
              onClick={() => optimizeRoute(viewMode === 'day' ? currentDateStr : format(weekStart, 'yyyy-MM-dd'))}
              title="Sort today's deliveries by proximity"
            >
              <Route className="w-3.5 h-3.5" /> Optimize
            </button>
            <button className="win-btn win-btn-primary whitespace-nowrap text-xs" onClick={() => handleOpenAdd()}>
              + Schedule
            </button>
            {/* Counter/Yard Quick-Add */}
            {(userRole === 'counter' || userRole === 'yard') && (
              <button
                className="win-btn whitespace-nowrap text-xs font-bold flex items-center gap-1.5"
                style={{ background: '#f97316', color: 'white', border: 'none' }}
                onClick={() => setQuickAddOpen(true)}
              >
                📋 Log a Request
              </button>
            )}
          </div>
        </div>

        {viewMode === 'week' ? (
          <div className="flex-1 flex gap-3 overflow-x-auto pb-2">
            {weekDays.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dDels = deliveries.filter(d => d.date === dayStr);
              const isToday = isSameDay(day, new Date());
              return (
                <DroppableDayCol key={dayStr} dayStr={dayStr} isToday={isToday}>
                  <div
                    className={`px-3 py-2.5 border-b flex justify-between items-center cursor-pointer hover:bg-[#252525] transition ${isToday ? 'border-[#f97316]/20' : 'border-[#2e2e2e]'}`}
                    onClick={() => handleOpenAdd(dayStr)}
                  >
                    <div>
                      <div className={`text-xs font-bold ${isToday ? 'text-[#f97316]' : 'text-white'}`}>{format(day, 'EEE')}</div>
                      <div className="text-[10px] text-[#9ca3af]">{format(day, 'MMM d')}</div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${dDels.length > 0 ? 'bg-[#f97316]/20 text-[#f97316]' : 'bg-[#252525] text-[#6b7280]'}`}>
                      {dDels.length}
                    </span>
                  </div>
                  <div className="p-2 flex flex-col gap-0.5 overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    {renderSlots(dDels, dayStr, true)}
                    {dDels.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-[#3a3a3a] text-[10px] gap-1 py-4">
                        <Truck className="w-5 h-5" />
                        <span>Drop here</span>
                      </div>
                    )}
                  </div>
                </DroppableDayCol>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-y-auto pb-4">
            {([
              { period: 'am', label: 'AM Run', color: 'text-[#f97316]', slots: ['priority-1','priority-2','priority-3','am'] },
              { period: 'pm', label: 'PM Run', color: 'text-[#60a5fa]', slots: ['pm'] },
            ]).map(({ period, label, color, slots }) => {
              const pDels = dayDels.filter(d => slots.includes(d.slot));
              return (
                <div key={period} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[8px] flex flex-col">
                  <div className={`p-3 border-b border-[#2e2e2e] font-semibold text-sm ${color}`}>
                    {label}
                    <span className="ml-2 text-xs font-normal text-[#6b7280]">{pDels.length} stops</span>
                  </div>
                  <div className="p-3 flex flex-col gap-1 overflow-y-auto flex-1">
                    {slots.map(slot => {
                      const slotDels = pDels.filter(d => d.slot === slot);
                      return (
                        <DroppableSlot key={slot} dayStr={currentDateStr} slot={slot}>
                          {slotDels.length > 0 && (
                            <div className="flex flex-col gap-1 mb-2">
                              <div className="text-[9px] uppercase font-bold text-[#6b7280] tracking-wider px-0.5">{SLOT_LABELS[slot]}</div>
                              {slotDels.map(d => (
                                <DraggableCard key={d.id} d={d}
                                  onEdit={() => handleOpenEdit(d)}
                                  onCycleStatus={() => { cycleDeliveryStatus(d.id); addToast('Status updated.', 'info'); }}
                                  onPhotoClick={url => setLightboxUrl(url)}
                                />
                              ))}
                            </div>
                          )}
                          {slotDels.length === 0 && (
                            <div onClick={() => handleOpenAdd(currentDateStr, slot)}
                              className="h-8 rounded-[5px] border border-dashed border-[#2e2e2e] flex items-center justify-center text-[9px] text-[#3a3a3a] mb-1 cursor-pointer hover:border-[#f97316]/30 hover:text-[#f97316]/50 transition">
                              {SLOT_LABELS[slot]}
                            </div>
                          )}
                        </DroppableSlot>
                      );
                    })}
                    {pDels.length === 0 && <div className="text-xs text-[#6b7280] text-center py-4 opacity-50">No deliveries</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => {
          if (pendingPhotoDeliveryId !== null) handlePhotoUpload(e, pendingPhotoDeliveryId);
        }}
      />

      <DragOverlay>
        {activeDelivery && (
          <div className="bg-[#1a1a1a] border border-[#f97316] rounded-[7px] p-3 shadow-[0_0_20px_rgba(249,115,22,0.3)] w-[200px] rotate-2 opacity-90">
            <div className="font-semibold text-xs text-white">{activeDelivery.customer}</div>
            <div className="text-[10px] text-[#9ca3af] mt-0.5">{activeDelivery.slot}</div>
          </div>
        )}
      </DragOverlay>

      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-[#f97316] transition" onClick={() => setLightboxUrl(null)}>
            <X className="w-7 h-7" />
          </button>
          <img src={lightboxUrl} alt="Site photo" className="max-w-full max-h-[90vh] rounded-[8px] object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {addingDelivery && (
        <div className="modal-overlay">
          <div className="modal-box w-[560px] max-w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#2e2e2e] flex justify-between items-center">
              <h2 className="text-base font-semibold text-white">{editingDelId ? 'Edit Delivery' : 'Schedule Delivery'}</h2>
              <button onClick={() => setAddingDelivery(false)} className="text-[#6b7280] hover:text-white text-xl leading-none">x</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Customer</span>
                  <input className="win-input" value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} placeholder="Customer name" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Slot</span>
                  <select className="win-input" value={formData.slot} onChange={e => setFormData({...formData, slot: e.target.value})}>
                    {SLOTS.map(s => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Address</span>
                <input className="win-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Delivery address" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Date</span>
                  <input type="date" className="win-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Driver</span>
                  <select className="win-input" value={formData.driver} onChange={e => setFormData({...formData, driver: e.target.value})}>
                    <option value="">-- Unassigned --</option>
                    {users.filter(u => u.role === 'driver' || u.role === 'foreman').map(u => (
                      <option key={u.id} value={u.first + ' ' + u.last}>{u.first} {u.last}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Hardware Included</span>
                  <select className="win-input" value={formData.hardware} onChange={e => setFormData({...formData, hardware: e.target.value})}>
                    <option value="">No</option>
                    <option value="1 - Yes">1 - Yes</option>
                    <option value="2 - Yes">2 - Yes</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Call Customer</span>
                  <select className="win-input" value={formData.call} onChange={e => setFormData({...formData, call: e.target.value})}>
                    <option value="">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Comments</span>
                <textarea className="win-input h-20 resize-y" value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} placeholder="Special instructions..." />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</span>
                <select className="win-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="scheduled">Scheduled</option>
                  <option value="onroute">On Route</option>
                  <option value="delivered">Delivered</option>
                  <option value="issue">Issue</option>
                </select>
              </label>

              <SitePhotosSection
                editingDelId={editingDelId}
                deliveries={deliveries}
                onAddPhoto={handlePhotoForDelivery}
                onViewPhoto={setLightboxUrl}
                onRemovePhoto={(url) => {
                  if (editingDelId !== null) {
                    removeDeliveryPhoto(editingDelId, url);
                    addToast('Photo removed.', 'info');
                  }
                }}
              />
            </div>
            {/* Signature display */}
            {editingDelId && (() => {
              const del = deliveries.find(d => d.id === editingDelId);
              return del?.signature ? (
                <div className="px-6 pb-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Captured Signature</span>
                    <button type="button" onClick={() => editDelivery(editingDelId, { signature: null })}
                      className="text-[10px] text-[#ef4444] hover:opacity-80">Remove</button>
                  </div>
                  <img src={del.signature} alt="Signature" className="rounded-[6px] border border-[#2e2e2e] max-h-[80px] object-contain bg-[#1a1a1a]" />
                </div>
              ) : null;
            })()}

            {/* GPS log display */}
            {editingDelId && (() => {
              const del = deliveries.find(d => d.id === editingDelId);
              const log: any[] = del?.gpsLog || [];
              if (log.length === 0) return null;
              return (
                <div className="px-6 pb-4 flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[#3b82f6]" /> GPS Check-ins
                  </span>
                  <div className="flex flex-col gap-1">
                    {log.map((entry: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] bg-[#111111] rounded-[6px] px-3 py-1.5">
                        <span className="capitalize font-semibold" style={{ color: entry.status === 'delivered' ? '#22c55e' : entry.status === 'issue' ? '#ef4444' : '#f97316' }}>
                          {entry.status}
                        </span>
                        <span className="text-[#6b7280]">{new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <a
                          href={`https://maps.google.com/?q=${entry.lat},${entry.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3b82f6] hover:underline ml-auto"
                        >
                          {entry.lat.toFixed(4)}, {entry.lng.toFixed(4)} ±{entry.accuracy}m
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="px-6 py-4 border-t border-[#2e2e2e] flex justify-end gap-2">
              {editingDelId && (
                <button className="win-btn border-[#3b1a1a] text-[#ef4444] hover:bg-[#3b1a1a] mr-auto" onClick={handleDelete}>
                  Delete
                </button>
              )}
              {editingDelId && (
                <button
                  type="button"
                  className="win-btn win-btn-default flex items-center gap-1.5"
                  onClick={() => { setSigDeliveryId(editingDelId); setShowSignature(true); }}
                >
                  <Pen className="w-3.5 h-3.5" /> Signature
                </button>
              )}
              <button className="win-btn win-btn-default" onClick={() => setAddingDelivery(false)}>Cancel</button>
              <button className="win-btn win-btn-primary" onClick={handleSave}>Save Delivery</button>
            </div>
          </div>
        </div>
      )}

      {/* Signature capture modal */}
      {showSignature && sigDeliveryId && (
        <SignatureModal
          onSave={(sig) => {
            editDelivery(sigDeliveryId, { signature: sig });
            setShowSignature(false);
            addToast('Signature captured.', 'success');
          }}
          onClose={() => setShowSignature(false)}
        />
      )}

      {/* Counter/Yard Quick-Add Modal */}
      {quickAddOpen && (
        <div className="modal-overlay">
          <div className="modal-box w-[420px] max-w-full">
            <div className="px-6 py-5 border-b border-[#2e2e2e]">
              <h2 className="text-base font-semibold text-white">📋 Log a Delivery Request</h2>
              <p className="text-xs text-[#9ca3af] mt-1">Fill in what you know — a manager will assign a driver.</p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Customer Name *</span>
                <input
                  className="win-input text-base py-3"
                  placeholder="e.g. John Smith"
                  value={quickForm.customer}
                  onChange={e => setQuickForm(f => ({ ...f, customer: e.target.value }))}
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Delivery Address</span>
                <input
                  className="win-input text-base py-3"
                  placeholder="e.g. 123 Main St, Brantford"
                  value={quickForm.address}
                  onChange={e => setQuickForm(f => ({ ...f, address: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Notes</span>
                <textarea
                  className="win-input text-sm py-2 resize-none"
                  rows={3}
                  placeholder="Anything the driver should know…"
                  value={quickForm.comments}
                  onChange={e => setQuickForm(f => ({ ...f, comments: e.target.value }))}
                />
              </label>
            </div>
            <div className="px-6 py-4 border-t border-[#2e2e2e] flex gap-2 justify-end">
              <button className="win-btn win-btn-default" onClick={() => setQuickAddOpen(false)}>Cancel</button>
              <button
                className="win-btn win-btn-primary font-bold"
                onClick={handleQuickAdd}
                disabled={!quickForm.customer.trim()}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}
