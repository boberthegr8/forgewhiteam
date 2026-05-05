import { useState, ChangeEvent } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  type DragStartEvent, type DragEndEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { FileText, Plus, Check, X, FileUp, GripVertical, Truck } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

// ── Draggable Quote Card ──────────────────────────────────────────────────────
function DraggableQuoteCard({ q, owner, userRole, onMarkSent, onReject, onAccept }: any) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `quote-${q.id}`,
    data: { type: 'quote', quote: q },
  });

  const statusClass: Record<string, string> = {
    accepted: 'bg-[#14311f] text-[#22c55e]',
    rejected: 'bg-[#3b1a1a] text-[#ef4444]',
    sent:     'bg-[#1a2a45] text-[#60a5fa]',
    draft:    'bg-[#252525] text-[#9ca3af]',
  };

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[10px] p-5 flex flex-col gap-3 hover:border-[#3a3a3a] transition-all group"
    >
      {/* Drag handle */}
      <div className="flex justify-between items-start">
        <div className="font-semibold text-white">{q.client}</div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${statusClass[q.status] || statusClass.draft}`}>
            {q.status}
          </span>
          {(q.status === 'draft' || q.status === 'sent') && (
            <div
              {...attributes} {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded text-[#6b7280] hover:text-[#f97316] transition"
              title="Drag to schedule as delivery"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-[#9ca3af]">{q.company}</div>

      {userRole === 'admin' && owner && (
        <div className="text-[10px] text-[#6b7280]">By: {owner.first} {owner.last}</div>
      )}

      <div className="text-sm border-l-2 border-[#2e2e2e] pl-3 py-1 text-[#9ca3af] italic">
        {q.desc || 'No description'}
      </div>

      {q.pdfUrl && (
        <a href={q.pdfUrl} target="_blank" rel="noreferrer"
          className="text-xs text-[#f97316] hover:underline flex items-center gap-1">
          <FileUp className="w-3 h-3" /> View PDF
        </a>
      )}

      <div className="mt-auto pt-3 border-t border-[#2e2e2e] flex justify-between items-center">
        <div className="font-bold text-lg text-[#f97316]">${Number(q.amount).toLocaleString()}</div>
        <div className="flex gap-2">
          {q.status === 'draft' && (
            <button className="win-btn win-btn-default px-2 py-1 flex items-center gap-1 text-xs" onClick={onMarkSent}>
              <Check className="w-3 h-3" /> Mark Sent
            </button>
          )}
          {q.status === 'sent' && (
            <div className="flex gap-2">
              <button className="win-btn border-[#3b1a1a] text-[#ef4444] hover:bg-[#3b1a1a] px-2 py-1" onClick={onReject}>
                <X className="w-3 h-3" />
              </button>
              <button className="win-btn border-[#14311f] text-[#22c55e] hover:bg-[#14311f] px-2 py-1 flex gap-1 items-center text-xs" onClick={onAccept}>
                <Check className="w-3 h-3" /> Accept
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Droppable Day Cell (in the scheduling panel) ─────────────────────────────
function DroppableDayCell({ date, children }: { date: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `schedule-${date}`, data: { type: 'scheduleDay', date } });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 border rounded-[8px] py-3 px-2 flex flex-col items-center gap-1 transition cursor-pointer
        ${isOver ? 'border-[#f97316] bg-[rgba(249,115,22,0.1)] shadow-[0_0_12px_rgba(249,115,22,0.2)]' : 'border-[#2e2e2e] bg-[#1a1a1a] hover:border-[#3a3a3a]'}`}
    >
      {children}
    </div>
  );
}

// ── Main QuotesPage ───────────────────────────────────────────────────────────
export function QuotesPage() {
  const { quotes, contacts, users, addQuote, updateQuote, acceptQuote, scheduleQuoteAsDelivery, currentUser, userRole, viewFilter } = useAppStore();
  const { addToast } = useToast();

  const [isModalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ contactId: '', amount: '', desc: '', expiry: '', items: '', notes: '', pdfUrl: null as string | null });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [draggingQuote, setDraggingQuote] = useState<any>(null);
  const [confirmSchedule, setConfirmSchedule] = useState<{ quote: any; date: string } | null>(null);

  const canSeeAll = ['admin', 'owner', 'manager', 'store_manager'].includes(userRole);
  const effectiveUserId = canSeeAll ? viewFilter : currentUser.id;
  const scopedQuotes = (canSeeAll && effectiveUserId === 'all')
    ? quotes
    : quotes.filter(q => (q.ownerId || 1) === (canSeeAll ? effectiveUserId : currentUser.id));
  const filteredQuotes = filterStatus === 'all' ? scopedQuotes : scopedQuotes.filter(q => q.status === filterStatus);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }).map((_, i) => addDays(weekStart, i));

  const handleSave = () => {
    if (!formData.contactId || !formData.amount) return;
    const contact = contacts.find(c => c.id === parseInt(formData.contactId));
    if (!contact) return;
    addQuote({
      contactId: parseInt(formData.contactId),
      client: `${contact.first} ${contact.last}`,
      company: contact.company,
      desc: formData.desc, amount: Number(formData.amount),
      items: formData.items, notes: formData.notes, expiry: formData.expiry,
      status: 'draft', date: new Date().toISOString().slice(0, 10), pdfUrl: formData.pdfUrl,
    });
    addToast('Quote created!', 'success');
    setModalOpen(false);
    setFormData({ contactId: '', amount: '', desc: '', expiry: '', items: '', notes: '', pdfUrl: null });
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormData({ ...formData, pdfUrl: URL.createObjectURL(file) });
  };

  const handleDragStart = (e: DragStartEvent) => {
    setDraggingQuote((e.active.data.current as any).quote);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { over } = e;
    if (over && (over.data.current as any)?.type === 'scheduleDay') {
      const date = (over.data.current as any).date;
      setConfirmSchedule({ quote: draggingQuote, date });
    }
    setDraggingQuote(null);
  };

  const handleConfirmSchedule = (slot: string) => {
    if (!confirmSchedule) return;
    scheduleQuoteAsDelivery(confirmSchedule.quote.id, confirmSchedule.date, slot);
    addToast(`Delivery scheduled for ${confirmSchedule.quote.client} on ${format(new Date(confirmSchedule.date + 'T00:00:00'), 'MMM d')}!`, 'success');
    setConfirmSchedule(null);
  };

  const statusCounts = {
    all: scopedQuotes.length,
    draft: scopedQuotes.filter(q => q.status === 'draft').length,
    sent: scopedQuotes.filter(q => q.status === 'sent').length,
    accepted: scopedQuotes.filter(q => q.status === 'accepted').length,
    rejected: scopedQuotes.filter(q => q.status === 'rejected').length,
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-[#0f0f0f] p-6 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#f97316]/15 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-[#f97316]" />
            </div>
            <span className="text-xl font-bold text-white">Quotes</span>
          </div>
          <div className="flex items-center gap-3">
            {draggingQuote && (
              <div className="flex items-center gap-2 text-xs text-[#f97316] font-semibold animate-pulse">
                <Truck className="w-3.5 h-3.5" /> Drop on a day to schedule delivery
              </div>
            )}
            <button className="win-btn win-btn-primary flex items-center gap-2" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4" /> New Quote
            </button>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 mb-6 bg-[#1a1a1a] border border-[#2e2e2e] rounded-[8px] p-1 w-fit">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold capitalize transition flex items-center gap-1.5
                ${filterStatus === status ? 'bg-[#f97316] text-white' : 'text-[#9ca3af] hover:text-white hover:bg-[#252525]'}`}
            >
              {status} <span className={`rounded-full px-1.5 text-[10px] font-bold ${filterStatus === status ? 'bg-white/20 text-white' : 'bg-[#252525] text-[#9ca3af]'}`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Quote cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuotes.map(q => {
            const owner = users.find(u => u.id === (q.ownerId || 1));
            return (
              <DraggableQuoteCard
                key={q.id} q={q} owner={owner} userRole={userRole}
                onMarkSent={() => { updateQuote(q.id, { status: 'sent' }); addToast('Quote marked as sent.', 'info'); }}
                onReject={() => { updateQuote(q.id, { status: 'rejected' }); addToast('Quote rejected.', 'error'); }}
                onAccept={() => { acceptQuote(q.id); addToast(`Quote accepted — ${q.client} moved to Pipeline!`, 'success'); }}
              />
            );
          })}
          {filteredQuotes.length === 0 && (
            <div className="col-span-3 text-center py-16 text-[#6b7280]">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No quotes found. Create your first one!</p>
            </div>
          )}
        </div>

        {/* Delivery scheduling panel — appears when dragging a quote */}
        {draggingQuote && (
          <div className="fixed bottom-0 left-[240px] right-0 z-[60] p-4 fade-in">
            <div className="bg-[#1a1a1a] border border-[#f97316]/40 rounded-[12px] p-4 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-4 h-4 text-[#f97316]" />
                <span className="text-sm font-semibold text-white">Drop on a day to schedule delivery for <span className="text-[#f97316]">{draggingQuote.client}</span></span>
              </div>
              <div className="flex gap-2">
                {weekDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  return (
                    <DroppableDayCell key={dateStr} date={dateStr}>
                      <span className="text-[10px] font-bold text-[#9ca3af] uppercase">{format(day, 'EEE')}</span>
                      <span className="text-sm font-bold text-white">{format(day, 'd')}</span>
                      <span className="text-[9px] text-[#6b7280]">{format(day, 'MMM')}</span>
                    </DroppableDayCell>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggingQuote && (
          <div className="bg-[#1a1a1a] border border-[#f97316] rounded-[10px] p-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] w-[220px] rotate-2 opacity-90">
            <div className="font-semibold text-white text-sm">{draggingQuote.client}</div>
            <div className="text-[#f97316] font-bold mt-1">${Number(draggingQuote.amount).toLocaleString()}</div>
          </div>
        )}
      </DragOverlay>

      {/* Confirm delivery schedule modal */}
      {confirmSchedule && (
        <div className="modal-overlay z-[70]">
          <div className="modal-box w-[400px]">
            <div className="px-6 py-4 border-b border-[#2e2e2e]">
              <h2 className="font-semibold text-white">Schedule Delivery</h2>
              <p className="text-xs text-[#9ca3af] mt-0.5">
                {confirmSchedule.quote.client} · {format(new Date(confirmSchedule.date + 'T00:00:00'), 'EEEE, MMMM d')}
              </p>
            </div>
            <div className="p-6">
              <p className="text-sm text-[#9ca3af] mb-4">Choose a time slot:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'priority-1', label: '🚨 1st Priority' },
                  { key: 'priority-2', label: '⚡ 2nd Priority' },
                  { key: 'priority-3', label: '⚡ 3rd Priority' },
                  { key: 'am', label: '☀ AM Run' },
                  { key: 'pm', label: '🌙 PM Run' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleConfirmSchedule(key)}
                    className="win-btn win-btn-default text-left py-2.5 flex items-center gap-2"
                  >
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#2e2e2e] flex justify-end">
              <button className="win-btn win-btn-default" onClick={() => setConfirmSchedule(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* New Quote Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box w-[500px] max-w-full">
            <div className="px-6 py-4 border-b border-[#2e2e2e] flex justify-between items-center">
              <h2 className="text-base font-semibold text-white">Create New Quote</h2>
              <button onClick={() => setModalOpen(false)} className="text-[#6b7280] hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Client</span>
                <select className="win-input" value={formData.contactId} onChange={e => setFormData({...formData, contactId: e.target.value})}>
                  <option value="">-- Choose client --</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.first} {c.last} – {c.company}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Description</span>
                <input className="win-input" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} placeholder="Project description" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Amount ($)</span>
                  <input type="number" className="win-input" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="e.g. 15000" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Valid Until</span>
                  <input type="date" className="win-input" value={formData.expiry} onChange={e => setFormData({...formData, expiry: e.target.value})} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Line Items</span>
                <textarea className="win-input h-20 resize-y" value={formData.items} onChange={e => setFormData({...formData, items: e.target.value})} placeholder="Materials, labour..." />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Upload PDF (Optional)</span>
                <input type="file" accept=".pdf" onChange={handleFileUpload}
                  className="block w-full text-sm text-[#9ca3af] file:mr-4 file:py-2 file:px-4 file:rounded-[6px] file:border-0 file:text-sm file:font-semibold file:bg-[#f97316] file:text-white hover:file:bg-[#ea6100] cursor-pointer" />
              </label>
            </div>
            <div className="px-6 py-4 border-t border-[#2e2e2e] flex justify-end gap-2">
              <button className="win-btn win-btn-default" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="win-btn win-btn-primary" onClick={handleSave}>Create Quote</button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}
