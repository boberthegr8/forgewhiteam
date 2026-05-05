import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { ShieldCheck, Save, RotateCcw } from 'lucide-react';

const ALL_PAGES = [
  { id: 'dash',      label: 'Dashboard' },
  { id: 'contacts',  label: 'Contacts' },
  { id: 'quotes',    label: 'Quotes' },
  { id: 'pipeline',  label: 'Pipeline' },
  { id: 'todos',     label: 'To-do List' },
  { id: 'delivery',  label: 'Delivery Board' },
  { id: 'workforce', label: 'Workforce' },
  { id: 'users',     label: 'Users' },
  { id: 'stores',    label: 'Stores' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'payroll',   label: 'Payroll' },
  { id: 'punch',     label: 'Punch Clock' },
  { id: 'map',       label: 'Driver Map' },
  { id: 'audit',     label: 'Audit Log' },
  { id: 'permissions', label: 'Permissions' },
];

const ROLES = ['admin', 'manager', 'foreman', 'driver', 'sales', 'counter', 'store'];

const ROLE_COLORS: Record<string, string> = {
  admin:   '#f97316',
  manager: '#818cf8',
  foreman: '#a78bfa',
  driver:  '#22c55e',
  sales:   '#60a5fa',
  counter: '#f59e0b',
  store:   '#e879f9',
};

// Default permissions — matches the app defaults
const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  dash:        ['admin', 'manager', 'sales', 'counter'],
  contacts:    ['admin', 'manager', 'sales', 'counter'],
  quotes:      ['admin', 'manager', 'sales', 'counter'],
  pipeline:    ['admin', 'manager', 'foreman', 'sales', 'counter'],
  todos:       ['admin', 'manager', 'foreman', 'driver', 'sales', 'counter'],
  delivery:    ['admin', 'manager', 'foreman', 'driver', 'sales', 'counter', 'store'],
  workforce:   ['admin', 'manager'],
  users:       ['admin', 'manager'],
  stores:      ['admin', 'manager'],
  analytics:   ['admin', 'manager', 'sales'],
  payroll:     ['admin', 'manager'],
  punch:       ['admin', 'manager', 'foreman', 'driver', 'counter'],
  map:         ['admin', 'manager', 'foreman'],
  audit:       ['admin', 'manager'],
  permissions: ['admin'],
};

export function PermissionsPage() {
  const { customPermissions, updateState } = useAppStore();
  const { addToast } = useToast();

  const current: Record<string, string[]> = customPermissions || DEFAULT_PERMISSIONS;
  const [perms, setPerms] = useState<Record<string, string[]>>(current);
  const [dirty, setDirty] = useState(false);

  const toggle = (page: string, role: string) => {
    // Admin always has all permissions — protect it
    if (role === 'admin') return;
    const current = perms[page] || [];
    const next = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role];
    setPerms(p => ({ ...p, [page]: next }));
    setDirty(true);
  };

  const save = () => {
    updateState({ customPermissions: perms } as any);
    addToast('Permissions saved. Changes take effect on next page load.', 'success');
    setDirty(false);
  };

  const reset = () => {
    setPerms(DEFAULT_PERMISSIONS);
    setDirty(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-[#f97316]/15 flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5 text-[#f97316]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Permission Builder</h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">Control which roles can access each page. Admin always has full access.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="win-btn win-btn-default flex items-center gap-2 text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <button onClick={save} disabled={!dirty} className="win-btn win-btn-primary flex items-center gap-2">
            <Save className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      </div>

      {/* Permission grid */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[10px] overflow-hidden">
        {/* Header row */}
        <div className="grid border-b border-[#2e2e2e]"
          style={{ gridTemplateColumns: `180px repeat(${ROLES.length}, 1fr)` }}>
          <div className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Page</div>
          {ROLES.map(role => (
            <div key={role} className="px-2 py-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider capitalize"
                style={{ color: ROLE_COLORS[role] || '#9ca3af' }}>{role}</span>
            </div>
          ))}
        </div>

        {/* Page rows */}
        {ALL_PAGES.map((page, idx) => (
          <div key={page.id}
            className={`grid items-center border-b border-[#1e1e1e] hover:bg-[#1e1e1e] transition ${idx % 2 === 0 ? '' : 'bg-[#171717]'}`}
            style={{ gridTemplateColumns: `180px repeat(${ROLES.length}, 1fr)` }}>
            <div className="px-4 py-3 text-sm font-semibold text-white">{page.label}</div>
            {ROLES.map(role => {
              const hasAccess = (perms[page.id] || []).includes(role);
              const isAdmin = role === 'admin';
              return (
                <div key={role} className="flex items-center justify-center py-3">
                  <button
                    onClick={() => toggle(page.id, role)}
                    disabled={isAdmin}
                    className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${
                      hasAccess ? 'bg-[#f97316]' : 'bg-[#2e2e2e]'
                    } ${isAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                      hasAccess ? 'left-5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {dirty && (
        <div className="mt-4 bg-[#f97316]/10 border border-[#f97316]/30 rounded-[8px] px-4 py-3 text-sm text-[#f97316]">
          You have unsaved changes. Click "Save Changes" to apply them.
        </div>
      )}
    </div>
  );
}
