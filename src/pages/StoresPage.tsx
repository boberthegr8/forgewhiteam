import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { Store, Plus, Trash2, ArrowRightLeft, Building2, Phone, MapPin, Mail } from 'lucide-react';

export function StoresPage() {
  const { stores, currentStoreId, addStore, switchStore, deleteStore, updateState, userRole } = useAppStore();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [form, setForm] = useState({ name: '', adminEmail: '', address: '', phone: '', accentColor: '#f97316', logoText: '' });

  if (userRole !== 'admin') return (
    <div className="flex items-center justify-center h-full text-[#9ca3af]">
      Admin access required.
    </div>
  );

  const handleCreate = () => {
    if (!form.name || !form.adminEmail) return;
    const orgId = addStore(form);
    addToast(`Store "${form.name}" created!`, 'success');
    setModalOpen(false);
    setForm({ name: '', adminEmail: '', address: '', phone: '', accentColor: '#f97316', logoText: '' });
    if (confirm(`Switch to ${form.name} now?`)) switchStore(orgId);
  };

  const handleSaveBranding = () => {
    if (!editingStore) return;
    updateState({
      stores: stores.map(s => s.id === editingStore.id ? { ...s, ...editingStore } : s)
    });
    addToast('Branding updated!', 'success');
    setEditingStore(null);
  };

  const handleSwitch = (storeId: string) => {
    switchStore(storeId);
    addToast(`Switched to ${stores.find(s => s.id === storeId)?.name}`, 'info');
  };

  const handleDelete = (storeId: string, name: string) => {
    if (!confirm(`Delete store "${name}"? This cannot be undone.`)) return;
    deleteStore(storeId);
    addToast(`Store "${name}" deleted.`, 'error');
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[#f97316]/15 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#f97316]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Store Management</h1>
            <p className="text-[#9ca3af] text-xs mt-0.5">Manage your store locations and isolated data</p>
          </div>
        </div>
        <button
          className="win-btn win-btn-primary flex items-center gap-2"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4" /> Add Store
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Stores', value: stores.length, icon: Building2, color: '#f97316' },
          { label: 'Active Store', value: stores.find(s => s.id === currentStoreId)?.name || '—', icon: Store, color: '#22c55e' },
          { label: 'Total Locations', value: stores.length, icon: MapPin, color: '#3b82f6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[10px] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-[6px] flex items-center justify-center" style={{ background: color + '20' }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-xs text-[#9ca3af] uppercase tracking-wider font-semibold">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white truncate">{value}</div>
          </div>
        ))}
      </div>

      {/* Store list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map(store => {
          const isActive = store.id === currentStoreId;
          return (
            <div
              key={store.id}
              className={`bg-[#1a1a1a] border rounded-[10px] p-5 flex flex-col gap-4 transition
                ${isActive ? 'border-[#f97316] shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'border-[#2e2e2e] hover:border-[#3a3a3a]'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0
                    ${isActive ? 'bg-[#f97316]' : 'bg-[#252525]'}`}>
                    <Building2 className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#9ca3af]'}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{store.name}</div>
                    {isActive && (
                      <span className="text-[10px] uppercase font-bold text-[#f97316] tracking-wider">● Active</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-xs text-[#9ca3af]">
                {store.adminEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{store.adminEmail}</span>
                  </div>
                )}
                {store.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{store.address}</span>
                  </div>
                )}
                {store.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{store.phone}</span>
                  </div>
                )}
                <div className="text-[#6b7280] mt-1">
                  ID: {store.orgId}
                </div>
              </div>

              {store.accentColor && store.accentColor !== '#f97316' && (
                <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                  <div className="w-3 h-3 rounded-full border border-[#3a3a3a]" style={{ backgroundColor: store.accentColor }} />
                  <span>Custom branding</span>
                  {store.logoText && <span className="text-[#6b7280]">· {store.logoText}</span>}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-[#2e2e2e]">
                {!isActive && (
                  <button
                    className="flex-1 win-btn win-btn-primary flex items-center justify-center gap-1.5 text-xs py-2"
                    onClick={() => handleSwitch(store.id)}
                  >
                    <ArrowRightLeft className="w-3 h-3" /> Switch
                  </button>
                )}
                {isActive && (
                  <div className="flex-1 text-center text-xs text-[#f97316] font-semibold py-2">
                    Currently Active
                  </div>
                )}
                <button
                  className="win-btn px-3 py-2 text-xs"
                  onClick={() => setEditingStore({ ...store })}
                  title="Edit branding"
                >
                  🎨
                </button>
                {store.id !== 'jk-hardware-001' && (
                  <button
                    className="win-btn border-[#3b1a1a] text-[#ef4444] hover:bg-[#3b1a1a] px-3 py-2"
                    onClick={() => handleDelete(store.id, store.name)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Branding Edit Modal */}
      {editingStore && (
        <div className="modal-overlay">
          <div className="modal-box w-[420px] max-w-full">
            <div className="px-6 py-4 border-b border-[#2e2e2e] flex justify-between items-center">
              <div>
                <h2 className="text-base font-semibold text-white">Edit Branding</h2>
                <p className="text-xs text-[#9ca3af] mt-0.5">{editingStore.name}</p>
              </div>
              <button onClick={() => setEditingStore(null)} className="text-[#6b7280] hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Store Name</span>
                <input className="win-input" value={editingStore.name} onChange={e => setEditingStore({...editingStore, name: e.target.value})} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">App Name / Logo Text</span>
                <input className="win-input" value={editingStore.logoText || ''} onChange={e => setEditingStore({...editingStore, logoText: e.target.value})} placeholder="Forge AM" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Accent Colour</span>
                <div className="flex items-center gap-3">
                  <input type="color" className="w-12 h-10 rounded border border-[#2e2e2e] bg-[#1a1a1a] cursor-pointer" value={editingStore.accentColor || '#f97316'} onChange={e => setEditingStore({...editingStore, accentColor: e.target.value})} />
                  <div className="flex-1 p-2 rounded-[6px] text-sm font-bold text-white text-center" style={{ backgroundColor: editingStore.accentColor || '#f97316' }}>
                    Preview Button
                  </div>
                </div>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Address</span>
                <input className="win-input" value={editingStore.address || ''} onChange={e => setEditingStore({...editingStore, address: e.target.value})} placeholder="City, Province" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Phone</span>
                <input className="win-input" value={editingStore.phone || ''} onChange={e => setEditingStore({...editingStore, phone: e.target.value})} placeholder="519-555-0100" />
              </label>
            </div>
            <div className="px-6 py-4 border-t border-[#2e2e2e] flex justify-end gap-2">
              <button className="win-btn win-btn-default" onClick={() => setEditingStore(null)}>Cancel</button>
              <button className="win-btn win-btn-primary" onClick={handleSaveBranding}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Store Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-box w-[480px] max-w-full">
            <div className="px-6 py-4 border-b border-[#2e2e2e] flex justify-between items-center">
              <div>
                <h2 className="text-base font-semibold text-white">Add New Store</h2>
                <p className="text-xs text-[#9ca3af] mt-0.5">Each store gets its own isolated data</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-[#6b7280] hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Store Name *</span>
                <input className="win-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. JK Hardware - Simcoe" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Admin Email *</span>
                <input type="email" className="win-input" value={form.adminEmail} onChange={e => setForm({...form, adminEmail: e.target.value})} placeholder="manager@store.com" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Accent Colour</span>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-10 h-9 rounded border border-[#2e2e2e] bg-[#1a1a1a] cursor-pointer" value={form.accentColor} onChange={e => setForm({...form, accentColor: e.target.value})} />
                    <input className="win-input flex-1" value={form.accentColor} onChange={e => setForm({...form, accentColor: e.target.value})} placeholder="#f97316" />
                  </div>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">App Name / Logo Text</span>
                  <input className="win-input" value={form.logoText} onChange={e => setForm({...form, logoText: e.target.value})} placeholder="e.g. Forge AM" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Address</span>
                  <input className="win-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="City, Province" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Phone</span>
                  <input className="win-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="519-555-0100" />
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#2e2e2e] flex justify-end gap-2">
              <button className="win-btn win-btn-default" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="win-btn win-btn-primary" onClick={handleCreate}>Create Store</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
