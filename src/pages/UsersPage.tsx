import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { Users as UsersIcon, UserPlus, Shield, User, HardHat, Car, Briefcase, Store, Truck, Eye, EyeOff, Mail, Key, Trash2 } from 'lucide-react';

const ROLE_META: Record<string, { icon: any; color: string; desc: string }> = {
  admin:         { icon: Shield,    color: '#f97316', desc: 'Full platform access. Manages all stores, users, and system settings.' },
  owner:         { icon: Shield,    color: '#fbbf24', desc: 'Cross-store visibility. Sees all stores, financials, and analytics. Cannot modify system settings.' },
  manager:       { icon: Briefcase, color: '#818cf8', desc: 'LBM manager. Near-full access across stores. Cannot add/remove users.' },
  store_manager: { icon: HardHat,   color: '#34d399', desc: 'Store manager. Full access within their assigned store only.' },
  foreman:       { icon: HardHat,   color: '#a78bfa', desc: 'Manage deliveries, view schedules, update task statuses.' },
  driver:        { icon: Car,       color: '#22c55e', desc: 'View delivery schedule, mark deliveries complete. Mobile view.' },
  sales:         { icon: Briefcase, color: '#60a5fa', desc: 'Manage own contacts, quotes, and pipeline. Sees only their own quotes.' },
  counter:       { icon: Store,     color: '#f59e0b', desc: 'Service desk. Contacts, deliveries, todos, punch clock. No quotes.' },
  yard:          { icon: Truck,     color: '#84cc16', desc: 'Yard staff. Deliveries, todos, punch clock. Assists with loading and on-site logistics.' },
  store:         { icon: Truck,     color: '#e879f9', desc: 'Delivery board only. View and update delivery status.' },
};

export function UsersPage() {
  const { users, stores, currentUser, currentStoreId, setCurrentUserId, updateState, addUserWithCredentials } = useAppStore();
  const isManager = currentUser.role === 'manager';
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({
    first: '', last: '', role: 'driver', email: '', password: '', storeId: currentStoreId,
    shiftStart: '', shiftEnd: '',
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setForm({ first: '', last: '', role: 'driver', email: '', password: '', storeId: currentStoreId, shiftStart: '', shiftEnd: '' });
    setShowPw(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (u: any) => {
    setEditingUser(u);
    setForm({ first: u.first, last: u.last, role: u.role, email: u.email || '', password: u.password || '', storeId: u.storeId || currentStoreId, shiftStart: u.shiftStart || '', shiftEnd: u.shiftEnd || '' });
    setShowPw(false);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.first || !form.last || !form.email) {
      addToast('First name, last name, and email are required.', 'error');
      return;
    }

    // Check for duplicate email
    const existing = users.find(u => u.email?.toLowerCase() === form.email.toLowerCase() && u.id !== editingUser?.id);
    if (existing) {
      addToast('That email is already in use.', 'error');
      return;
    }

    if (editingUser) {
      updateState({
        users: users.map(u => u.id === editingUser.id ? { ...u, ...form } : u)
      });
      addToast(`${form.first} ${form.last} updated.`, 'success');
    } else {
      if (!form.password) {
        addToast('Password is required when creating a new user.', 'error');
        return;
      }
      addUserWithCredentials(form);
      addToast(`Account created for ${form.first} ${form.last}!`, 'success');
    }

    setModalOpen(false);
  };

  const handleDelete = (u: any) => {
    if (u.id === currentUser.id) { addToast("You can't delete your own account.", 'error'); return; }
    if (!confirm(`Delete ${u.first} ${u.last}? This cannot be undone.`)) return;
    updateState({ users: users.filter(usr => usr.id !== u.id) });
    addToast(`${u.first} ${u.last} deleted.`, 'info');
  };

  const storeName = (storeId: string) => stores.find(s => s.id === storeId)?.name || storeId;

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-[#f97316]/15 flex items-center justify-center">
            <UsersIcon className="w-4.5 h-4.5 text-[#f97316]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">User Management</h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">{users.length} accounts across {stores.length} store(s)</p>
          </div>
        </div>
        {!isManager && (
          <button className="win-btn win-btn-primary flex items-center gap-2" onClick={handleOpenCreate}>
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-10 gap-3 mb-6">
        {Object.entries(ROLE_META).map(([role, meta]) => {
          const Icon = meta.icon;
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[8px] p-4 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-[6px] flex items-center justify-center" style={{ background: meta.color + '20' }}>
                <Icon className="w-4 h-4" style={{ color: meta.color }} />
              </div>
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className="text-xs text-[#9ca3af] capitalize font-semibold">{role}</div>
            </div>
          );
        })}
      </div>

      {/* Users table */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[10px] overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_180px_140px_120px] px-4 py-3 border-b border-[#2e2e2e] text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
          <div>User</div>
          <div>Role</div>
          <div>Email</div>
          <div>Store</div>
          <div className="text-right">Actions</div>
        </div>
        {users.map(u => {
          const meta = ROLE_META[u.role] || ROLE_META.counter;
          const Icon = meta.icon;
          const isMe = u.id === currentUser.id;
          return (
            <div key={u.id} className="grid grid-cols-[1fr_140px_180px_140px_120px] px-4 py-3 border-b border-[#1e1e1e] hover:bg-[#1e1e1e] transition items-center">
              {/* User info */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: meta.color + '30', color: meta.color }}
                >
                  {u.first[0]}{u.last[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm text-white flex items-center gap-2">
                    {u.first} {u.last}
                    {isMe && <span className="text-[10px] bg-[#f97316]/20 text-[#f97316] px-1.5 py-0.5 rounded font-bold uppercase">You</span>}
                  </div>
                </div>
              </div>
              {/* Role */}
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: meta.color }} />
                <span className="text-sm text-[#9ca3af] capitalize">{u.role}</span>
              </div>
              {/* Email */}
              <div className="text-xs text-[#9ca3af] truncate flex items-center gap-1.5">
                <Mail className="w-3 h-3 shrink-0 text-[#6b7280]" />
                {u.email || <span className="text-[#3a3a3a] italic">No email set</span>}
              </div>
              {/* Store */}
              <div className="text-xs text-[#9ca3af] truncate">
                {storeName(u.storeId || currentStoreId)}
              </div>
              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                {!isMe && (
                  <button
                    onClick={() => setCurrentUserId(u.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-[5px] bg-[#252525] text-[#9ca3af] hover:bg-[#f97316] hover:text-white transition"
                  >
                    Switch
                  </button>
                )}
                <button
                  onClick={() => handleOpenEdit(u)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-[5px] bg-[#252525] text-[#9ca3af] hover:bg-[#2e2e2e] hover:text-white transition"
                >
                  Edit
                </button>
                {!isMe && !isManager && (
                  <button
                    onClick={() => handleDelete(u)}
                    className="p-1.5 rounded-[5px] text-[#6b7280] hover:bg-[#3b1a1a] hover:text-[#ef4444] transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-box w-[480px] max-w-full">
            <div className="px-6 py-4 border-b border-[#2e2e2e] flex justify-between items-center">
              <div>
                <h2 className="text-base font-semibold text-white">{editingUser ? 'Edit User' : 'Create New User'}</h2>
                <p className="text-xs text-[#9ca3af] mt-0.5">
                  {editingUser ? 'Update account credentials and role.' : 'Staff will log in with the email and password you set.'}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-[#6b7280] hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">First Name *</span>
                  <input className="win-input" value={form.first} onChange={e => setForm({...form, first: e.target.value})} placeholder="Jane" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Last Name *</span>
                  <input className="win-input" value={form.last} onChange={e => setForm({...form, last: e.target.value})} placeholder="Doe" />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Email *</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                  <input type="email" className="win-input pl-10" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jane@company.com" />
                </div>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </span>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="win-input pl-10 pr-10"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder={editingUser ? '••••••••' : 'Set a password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white transition"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Role</span>
                  <select className="win-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                    <option value="manager">LBM Manager</option>
                    <option value="store_manager">Store Manager</option>
                    <option value="foreman">Foreman</option>
                    <option value="driver">Driver</option>
                    <option value="sales">Sales</option>
                    <option value="counter">Counter / Service Desk</option>
                    <option value="yard">Yard Staff</option>
                    <option value="store">Store (Delivery Only)</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Store</span>
                  <select className="win-input" value={form.storeId} onChange={e => setForm({...form, storeId: e.target.value})}>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              </div>

              {/* Shift hours */}
              {form.role !== 'admin' && form.role !== 'manager' && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Shift Hours <span className="normal-case text-[#6b7280]">(optional — restricts login outside these hours)</span></span>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] text-[#6b7280]">Start</span>
                      <input type="time" className="win-input" value={form.shiftStart} onChange={e => setForm({...form, shiftStart: e.target.value})} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] text-[#6b7280]">End</span>
                      <input type="time" className="win-input" value={form.shiftEnd} onChange={e => setForm({...form, shiftEnd: e.target.value})} />
                    </label>
                  </div>
                </div>
              )}

              {/* Role preview */}
              {form.role && ROLE_META[form.role] && (
                <div className="flex items-center gap-3 bg-[#111111] border border-[#2e2e2e] rounded-[6px] p-3">
                  {(() => { const meta = ROLE_META[form.role]; const Icon = meta.icon;
                    return <Icon className="w-4 h-4 shrink-0" style={{ color: meta.color }} />; })()}
                  <p className="text-xs text-[#9ca3af]">{ROLE_META[form.role].desc}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[#2e2e2e] flex justify-end gap-2">
              <button className="win-btn win-btn-default" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="win-btn win-btn-primary" onClick={handleSave}>
                {editingUser ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
