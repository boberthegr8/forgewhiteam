import { useState, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import {
  Zap, RefreshCw, UserPlus, X, Filter,
  DollarSign, TrendingUp, CheckCircle, AlertCircle, Trash2,
  FileText,
} from 'lucide-react';

// ── Municipality Connectors ───────────────────────────────────────────────────
const CONNECTORS: Record<string, { name: string; region: string; fetch: () => Promise<any[]> }> = {
  toronto: {
    name: 'City of Toronto',
    region: 'ON',
    fetch: async () => {
      // Toronto Open Data — Building Permits (Active) via CKAN API (CORS enabled)
      const url =
        'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search' +
        '?resource_id=cc7a-d1bd&limit=200&sort=issued_date%20desc';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Toronto API error: ' + res.status);
      const json = await res.json();
      return (json.result?.records || []).map((r: any) => ({
        municipality: 'Toronto',
        address: [r.STREET_NUM, r.STREET_NAME, r.STREET_TYPE].filter(Boolean).join(' ').trim() || r.POSTAL || 'Unknown address',
        permitType: r.WORK_TYPE || r.CURRENT_USE || 'Unknown',
        description: r.DESCRIPTION || '',
        issueDate: (r.ISSUED_DATE || r.APPLICATION_DATE || '').slice(0, 10),
        value: Number(r.ESTIMATED_COST) || 0,
        applicant: '',
        rawData: r,
      }));
    },
  },
};

// Sample data for demo / offline use
const SAMPLE_PERMITS = [
  { municipality: 'Brantford', address: '42 Colborne St W', permitType: 'New Construction', description: 'New single family dwelling, 2-storey, attached garage', issueDate: new Date().toISOString().slice(0,10), value: 380000, applicant: 'J. Morrison' },
  { municipality: 'Brantford', address: '88 Grey St', permitType: 'Addition', description: 'Rear addition to existing dwelling, 400 sq ft', issueDate: new Date().toISOString().slice(0,10), value: 95000, applicant: 'S. Patel' },
  { municipality: 'Brantford', address: '14 Brant Ave', permitType: 'New Construction', description: 'New detached garage 24x30', issueDate: new Date(Date.now()-864e5).toISOString().slice(0,10), value: 45000, applicant: 'B. Tremblay' },
  { municipality: 'Brantford', address: '230 King George Rd', permitType: 'Renovation', description: 'Interior renovation, kitchen and bathrooms', issueDate: new Date(Date.now()-864e5).toISOString().slice(0,10), value: 62000, applicant: '' },
  { municipality: 'Hamilton', address: '1015 Upper James St', permitType: 'New Construction', description: 'New commercial building, mixed-use retail/residential', issueDate: new Date(Date.now()-2*864e5).toISOString().slice(0,10), value: 1200000, applicant: 'Prime Develop.' },
  { municipality: 'Hamilton', address: '456 Fennell Ave E', permitType: 'Addition', description: 'Second storey addition, 600 sq ft', issueDate: new Date(Date.now()-3*864e5).toISOString().slice(0,10), value: 130000, applicant: 'M. Kowalski' },
  { municipality: 'Paris', address: '72 Grand River St N', permitType: 'New Construction', description: 'New dwelling, raised bungalow', issueDate: new Date(Date.now()-3*864e5).toISOString().slice(0,10), value: 290000, applicant: '' },
  { municipality: 'Simcoe', address: '189 Norfolk St S', permitType: 'Accessory Structure', description: 'Detached workshop/barn structure 40x60', issueDate: new Date(Date.now()-4*864e5).toISOString().slice(0,10), value: 85000, applicant: 'R. Schell' },
];

const PERMIT_TYPE_COLORS: Record<string, string> = {
  'New Construction': '#10b981',
  'Addition': '#3b82f6',
  'Renovation': '#f59e0b',
  'Accessory Structure': '#8b5cf6',
  'Alteration': '#f97316',
  'Demolition': '#ef4444',
};

const STATUS_CONFIG = {
  new:       { label: 'New Lead',  color: '#60a5fa', bg: '#1a2a45' },
  contacted: { label: 'Contacted', color: '#f59e0b', bg: '#2a1f0a' },
  converted: { label: 'Converted', color: '#22c55e', bg: '#0a2a15' },
  dismissed: { label: 'Dismissed', color: '#6b7280', bg: '#1e1e1e' },
};

// ── Convert Modal ─────────────────────────────────────────────────────────────
function ConvertModal({ permit, onSave, onClose }: { permit: any; onSave: (data: any) => void; onClose: () => void }) {
  const nameParts = (permit.applicant || '').split(' ');
  const [form, setForm] = useState({
    first: nameParts[0] || '',
    last: nameParts.slice(1).join(' ') || '',
    email: '',
    phone: '',
    company: '',
    notes: [
      permit.permitType && `Permit Type: ${permit.permitType}`,
      permit.description && `Description: ${permit.description}`,
      permit.address && `Address: ${permit.address}`,
      permit.issueDate && `Permit Issued: ${permit.issueDate}`,
      permit.value && `Permit Value: $${Number(permit.value).toLocaleString()}`,
    ].filter(Boolean).join('\n'),
  });

  const isValid = form.first.trim() || form.company.trim();

  return (
    <div className="modal-overlay">
      <div className="modal-box w-[500px] max-w-full">
        <div className="px-6 py-4 border-b border-[#2e2e2e] flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#f97316]" /> Convert to Contact
            </h2>
            <p className="text-xs text-[#9ca3af] mt-0.5 truncate max-w-[320px]">{permit.address} · {permit.municipality}</p>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Permit summary */}
        <div className="mx-6 mt-4 bg-[#111111] border border-[#2e2e2e] rounded-[8px] p-3 flex gap-4 text-xs text-[#9ca3af]">
          <div><span className="text-[#6b7280]">Type</span><br/><span className="text-white font-semibold">{permit.permitType}</span></div>
          <div><span className="text-[#6b7280]">Issued</span><br/><span className="text-white font-semibold">{permit.issueDate}</span></div>
          <div><span className="text-[#6b7280]">Value</span><br/><span className="text-[#f97316] font-bold">${Number(permit.value).toLocaleString()}</span></div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">First Name</span>
            <input className="win-input" value={form.first} onChange={e => setForm({...form, first: e.target.value})} placeholder="First" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Last Name</span>
            <input className="win-input" value={form.last} onChange={e => setForm({...form, last: e.target.value})} placeholder="Last" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Company</span>
            <input className="win-input" value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Builder / Contractor" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Phone</span>
            <input className="win-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="519-555-0100" />
          </label>
          <label className="col-span-2 flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Email</span>
            <input type="email" className="win-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="contact@email.com" />
          </label>
          <label className="col-span-2 flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Notes (pre-filled from permit)</span>
            <textarea className="win-input resize-none text-xs" rows={4} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </label>
        </div>

        <div className="px-6 py-4 border-t border-[#2e2e2e] flex justify-end gap-2">
          <button className="win-btn win-btn-default" onClick={onClose}>Cancel</button>
          <button
            className="win-btn win-btn-primary flex items-center gap-2"
            onClick={() => isValid && onSave(form)}
            disabled={!isValid}
          >
            <UserPlus className="w-3.5 h-3.5" /> Create Contact
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main OpportunitiesPage ────────────────────────────────────────────────────
export function OpportunitiesPage() {
  const { permits, contacts, bulkAddPermits, updatePermit, deletePermit, convertPermitToContact, userRole } = useAppStore();
  const { addToast } = useToast();

  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [filterMuni, setFilterMuni] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [convertTarget, setConvertTarget] = useState<any>(null);
  const [addManual, setAddManual] = useState(false);
  const [manualForm, setManualForm] = useState({ municipality: 'Brantford', address: '', permitType: 'New Construction', description: '', issueDate: new Date().toISOString().slice(0,10), value: '', applicant: '' });

  // ── Derived values ────────────────────────────────────────────────────────
  const municipalities = useMemo(() => ['all', ...Array.from(new Set(permits.map((p: any) => p.municipality)))], [permits]);
  const permitTypes = useMemo(() => ['all', ...Array.from(new Set(permits.map((p: any) => p.permitType).filter(Boolean)))], [permits]);

  const filtered = useMemo(() => permits.filter((p: any) => {
    if (filterMuni !== 'all' && p.municipality !== filterMuni) return false;
    if (filterType !== 'all' && p.permitType !== filterType) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (search && !`${p.address} ${p.applicant} ${p.description} ${p.municipality}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [permits, filterMuni, filterType, filterStatus, search]);

  const stats = useMemo(() => ({
    total: permits.length,
    newLeads: permits.filter((p: any) => p.status === 'new').length,
    converted: permits.filter((p: any) => p.status === 'converted').length,
    totalValue: permits.reduce((s: number, p: any) => s + (Number(p.value) || 0), 0),
    relevantValue: permits.filter((p: any) => ['New Construction', 'Addition', 'Accessory Structure'].includes(p.permitType))
      .reduce((s: number, p: any) => s + (Number(p.value) || 0), 0),
  }), [permits]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleFetchToronto = async () => {
    setFetching(true); setFetchError('');
    try {
      const raw = await CONNECTORS.toronto.fetch();
      const added = bulkAddPermits(raw);
      if (added === 0) addToast('No new permits — already up to date.', 'info');
      else addToast(`${added} new Toronto permits loaded.`, 'success');
    } catch (e: any) {
      const msg = 'Could not reach Toronto Open Data. Try again later.';
      setFetchError(msg);
      addToast(msg, 'error');
    }
    setFetching(false);
  };

  const handleLoadSample = () => {
    const added = bulkAddPermits(SAMPLE_PERMITS);
    if (added === 0) addToast('Sample data already loaded.', 'info');
    else addToast(`${added} sample permits loaded.`, 'success');
  };

  const handleConvert = (permit: any) => setConvertTarget(permit);

  const handleSaveConvert = (contactData: any) => {
    convertPermitToContact(convertTarget.id, contactData);
    addToast(`${contactData.first || contactData.company} added to Contacts!`, 'success');
    setConvertTarget(null);
  };

  const handleManualAdd = () => {
    if (!manualForm.address) return;
    bulkAddPermits([{ ...manualForm, value: Number(manualForm.value) || 0 }]);
    addToast('Permit added.', 'success');
    setAddManual(false);
    setManualForm({ municipality: 'Brantford', address: '', permitType: 'New Construction', description: '', issueDate: new Date().toISOString().slice(0,10), value: '', applicant: '' });
  };

  const fmt$ = (n: number) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}k` : `$${n}`;

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-[#f97316]/15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#f97316]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Opportunities</h1>
              <p className="text-xs text-[#9ca3af] mt-0.5">Building permit leads — find your next customer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="win-btn win-btn-default text-xs flex items-center gap-1.5"
            >
              Load Sample Data
            </button>
            <button
              onClick={() => setAddManual(true)}
              className="win-btn win-btn-default text-xs flex items-center gap-1.5"
            >
              + Add Manual
            </button>
            <button
              onClick={handleFetchToronto}
              disabled={fetching}
              className="win-btn win-btn-primary text-xs flex items-center gap-2"
            >
              {fetching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {fetching ? 'Fetching…' : 'Fetch Toronto Permits'}
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-[8px] px-4 py-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" /> {fetchError}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total Permits', value: stats.total, icon: <FileText className="w-4 h-4"/>, color: '#9ca3af' },
            { label: 'New Leads', value: stats.newLeads, icon: <Zap className="w-4 h-4"/>, color: '#60a5fa' },
            { label: 'Converted', value: stats.converted, icon: <CheckCircle className="w-4 h-4"/>, color: '#22c55e' },
            { label: 'Total Permit Value', value: fmt$(stats.totalValue), icon: <DollarSign className="w-4 h-4"/>, color: '#f59e0b' },
            { label: 'LBM Opportunity', value: fmt$(stats.relevantValue), icon: <TrendingUp className="w-4 h-4"/>, color: '#f97316' },
          ].map((s, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[8px] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-[5px] flex items-center justify-center" style={{ backgroundColor: s.color + '22', color: s.color }}>
                  {s.icon}
                </div>
                <span className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-wider truncate">{s.label}</span>
              </div>
              <div className="text-[22px] font-bold text-white leading-none">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
          <select className="win-input py-1.5 text-xs px-2 w-[160px] bg-[#1a1a1a]" value={filterMuni} onChange={e => setFilterMuni(e.target.value)}>
            {municipalities.map(m => <option key={m} value={m}>{m === 'all' ? 'All Municipalities' : m}</option>)}
          </select>
          <select className="win-input py-1.5 text-xs px-2 w-[180px] bg-[#1a1a1a]" value={filterType} onChange={e => setFilterType(e.target.value)}>
            {permitTypes.map(t => <option key={t} value={t}>{t === 'all' ? 'All Permit Types' : t}</option>)}
          </select>
          <select className="win-input py-1.5 text-xs px-2 w-[140px] bg-[#1a1a1a]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="new">New Lead</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <input
            type="text"
            className="win-input py-1.5 text-xs px-3 w-[220px] bg-[#1a1a1a]"
            placeholder="Search address, applicant…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="text-[11px] text-[#6b7280] ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        {permits.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <Zap className="w-8 h-8 text-[#f97316]" />
            </div>
            <div>
              <div className="text-white font-semibold text-lg">No permits loaded yet</div>
              <div className="text-[#6b7280] text-sm mt-1">Click "Load Sample Data" to see how this works, or fetch live Toronto permits.</div>
            </div>
            <button onClick={handleLoadSample} className="win-btn win-btn-primary text-sm mt-2">Load Sample Data</button>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-[10px] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2e2e2e] bg-[#111111]">
                  {['Address', 'Municipality', 'Type', 'Permit Value', 'Issued', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-[#6b7280] text-sm">No permits match your filters.</td></tr>
                )}
                {filtered.map((permit: any) => {
                  const typeColor = PERMIT_TYPE_COLORS[permit.permitType] || '#9ca3af';
                  const sCfg = STATUS_CONFIG[permit.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new;
                  const linkedContact = permit.contactId ? contacts.find((c: any) => c.id === permit.contactId) : null;

                  return (
                    <tr key={permit.id} className={`border-b border-[#1e1e1e] hover:bg-[#1e1e1e] transition ${permit.status === 'dismissed' ? 'opacity-40' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white text-[13px] max-w-[200px] truncate">{permit.address}</div>
                        {permit.description && (
                          <div className="text-[11px] text-[#6b7280] truncate max-w-[200px] mt-0.5">{permit.description}</div>
                        )}
                        {permit.applicant && (
                          <div className="text-[11px] text-[#9ca3af] mt-0.5">👤 {permit.applicant}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] text-[#9ca3af]">{permit.municipality}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: typeColor + '22', color: typeColor }}>
                          {permit.permitType || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-[13px] ${permit.value >= 100000 ? 'text-[#f97316]' : 'text-white'}`}>
                          {permit.value ? fmt$(permit.value) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#9ca3af]">
                        {permit.issueDate || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold px-2 py-1 rounded" style={{ backgroundColor: sCfg.bg, color: sCfg.color }}>
                          {sCfg.label}
                        </span>
                        {linkedContact && (
                          <div className="text-[10px] text-[#22c55e] mt-1 truncate max-w-[100px]">
                            → {linkedContact.first} {linkedContact.last}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {permit.status === 'new' && (
                            <>
                              <button
                                onClick={() => handleConvert(permit)}
                                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-[5px] bg-[#f97316]/15 text-[#f97316] hover:bg-[#f97316]/25 transition"
                                title="Convert to Contact"
                              >
                                <UserPlus className="w-3 h-3" /> Convert
                              </button>
                              <button
                                onClick={() => updatePermit(permit.id, { status: 'contacted' })}
                                className="text-[11px] px-2 py-1.5 rounded-[5px] text-[#f59e0b] bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 transition"
                                title="Mark as Contacted"
                              >
                                Contacted
                              </button>
                              <button
                                onClick={() => updatePermit(permit.id, { status: 'dismissed' })}
                                className="p-1.5 rounded-[5px] text-[#6b7280] hover:text-[#ef4444] hover:bg-[#3b1a1a] transition"
                                title="Dismiss"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          {permit.status === 'contacted' && (
                            <>
                              <button
                                onClick={() => handleConvert(permit)}
                                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-[5px] bg-[#f97316]/15 text-[#f97316] hover:bg-[#f97316]/25 transition"
                              >
                                <UserPlus className="w-3 h-3" /> Convert
                              </button>
                              <button
                                onClick={() => updatePermit(permit.id, { status: 'dismissed' })}
                                className="p-1.5 rounded-[5px] text-[#6b7280] hover:text-[#ef4444] hover:bg-[#3b1a1a] transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          {permit.status === 'converted' && linkedContact && (
                            <span className="flex items-center gap-1 text-[11px] text-[#22c55e]">
                              <CheckCircle className="w-3.5 h-3.5" /> In Contacts
                            </span>
                          )}
                          {permit.status === 'dismissed' && (
                            <button
                              onClick={() => updatePermit(permit.id, { status: 'new' })}
                              className="text-[11px] text-[#6b7280] hover:text-white transition"
                            >
                              Restore
                            </button>
                          )}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => deletePermit(permit.id)}
                              className="p-1.5 rounded-[5px] text-[#6b7280] hover:text-[#ef4444] hover:bg-[#3b1a1a] transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Convert Modal */}
      {convertTarget && (
        <ConvertModal
          permit={convertTarget}
          onSave={handleSaveConvert}
          onClose={() => setConvertTarget(null)}
        />
      )}

      {/* Manual Add Modal */}
      {addManual && (
        <div className="modal-overlay">
          <div className="modal-box w-[480px] max-w-full">
            <div className="px-6 py-4 border-b border-[#2e2e2e] flex justify-between items-center">
              <h2 className="text-base font-semibold text-white">Add Permit Manually</h2>
              <button onClick={() => setAddManual(false)} className="text-[#6b7280] hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Municipality</span>
                <input className="win-input" value={manualForm.municipality} onChange={e => setManualForm({...manualForm, municipality: e.target.value})} placeholder="Brantford" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Issue Date</span>
                <input type="date" className="win-input" value={manualForm.issueDate} onChange={e => setManualForm({...manualForm, issueDate: e.target.value})} />
              </label>
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Address *</span>
                <input className="win-input" value={manualForm.address} onChange={e => setManualForm({...manualForm, address: e.target.value})} placeholder="42 Main St" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Permit Type</span>
                <select className="win-input" value={manualForm.permitType} onChange={e => setManualForm({...manualForm, permitType: e.target.value})}>
                  {['New Construction','Addition','Renovation','Accessory Structure','Alteration','Demolition','Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Est. Value ($)</span>
                <input type="number" className="win-input" value={manualForm.value} onChange={e => setManualForm({...manualForm, value: e.target.value})} placeholder="250000" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Applicant</span>
                <input className="win-input" value={manualForm.applicant} onChange={e => setManualForm({...manualForm, applicant: e.target.value})} placeholder="Name / Company" />
              </label>
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Description</span>
                <input className="win-input" value={manualForm.description} onChange={e => setManualForm({...manualForm, description: e.target.value})} placeholder="New single family dwelling…" />
              </label>
            </div>
            <div className="px-6 py-4 border-t border-[#2e2e2e] flex justify-end gap-2">
              <button className="win-btn win-btn-default" onClick={() => setAddManual(false)}>Cancel</button>
              <button className="win-btn win-btn-primary" onClick={handleManualAdd} disabled={!manualForm.address.trim()}>Add Permit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
