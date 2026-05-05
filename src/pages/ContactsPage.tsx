import { useState, ChangeEvent } from 'react';
import { useAppStore } from '../lib/store';
import { Users, Plus, Mail, Phone, Building, ArrowLeft, FileUp, Check, X } from 'lucide-react';

export function ContactsPage() {
  const { contacts, addContact, updateContact, quotes, addQuote, updateQuote, acceptQuote, currentUser, userRole, viewFilter } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [formData, setFormData] = useState({ first: '', last: '', email: '', company: '', phone: '', status: 'lead' });
  const [customFieldData, setCustomFieldData] = useState({ key: '', value: '' });
  const [quoteData, setQuoteData] = useState({ amount: '', desc: '', expiry: '', items: '', notes: '', pdfUrl: null as string | null });

  const effectiveUserId = userRole === 'admin' ? viewFilter : currentUser.id;
  const scopedContacts = effectiveUserId === 'all' ? contacts : contacts.filter(c => (c.ownerId || 1) === effectiveUserId);
  const scopedQuotes = effectiveUserId === 'all' ? quotes : quotes.filter(q => (q.ownerId || 1) === effectiveUserId);

  const fmt = (n: number) => '$' + Number(n).toLocaleString();

  const handleSave = () => {
    if (!formData.first || !formData.last) return;
    addContact({ ...formData, date: new Date().toISOString().slice(0, 10), customFields: {} });
    setModalOpen(false);
    setFormData({ first: '', last: '', email: '', company: '', phone: '', status: 'lead' });
  };

  const handleAddCustomField = () => {
    if (!selectedContactId || !customFieldData.key || !customFieldData.value) return;
    const contact = scopedContacts.find(c => c.id === selectedContactId);
    if (!contact) return;

    const newCustomFields = { ...(contact.customFields || {}), [customFieldData.key]: customFieldData.value };
    updateContact(selectedContactId, { customFields: newCustomFields });
    setCustomFieldData({ key: '', value: '' });
  };

  const handleQuoteFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setQuoteData({ ...quoteData, pdfUrl: url });
    }
  };

  const handleSaveQuote = () => {
    if (!selectedContactId || !quoteData.amount) return;
    const contact = scopedContacts.find(c => c.id === selectedContactId);
    if (!contact) return;

    addQuote({
      contactId: selectedContactId,
      client: `${contact.first} ${contact.last}`,
      company: contact.company,
      desc: quoteData.desc,
      amount: Number(quoteData.amount),
      items: quoteData.items,
      notes: quoteData.notes,
      expiry: quoteData.expiry,
      status: 'draft',
      date: new Date().toISOString().slice(0, 10),
      pdfUrl: quoteData.pdfUrl
    });
    setQuoteModalOpen(false);
    setQuoteData({ amount: '', desc: '', expiry: '', items: '', notes: '', pdfUrl: null });
  };

  if (selectedContactId) {
    const contact = scopedContacts.find(c => c.id === selectedContactId);
    if (!contact) return null;

    const contactQuotes = scopedQuotes.filter(q => q.contactId === selectedContactId);

    return (
      <div className="flex flex-col h-full bg-win-bg p-6 overflow-y-auto">
        <div className="flex items-center gap-4 mb-6">
          <button className="p-2 hover:bg-[#e5e5e5] rounded-[4px] transition" onClick={() => setSelectedContactId(null)}>
            <ArrowLeft className="w-5 h-5 text-win-text-sec" />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded shrink-0 bg-win-accent flex items-center justify-center text-white text-lg font-bold">
               {contact.first[0]}{contact.last[0]}
             </div>
             <div>
                <div className="text-xl font-semibold">{contact.first} {contact.last}</div>
                <div className="text-xs text-win-text-sec">{contact.company}</div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info Details */}
          <div className="bg-win-surface border border-win-border rounded-[4px] p-5 shadow-sm">
            <div className="text-sm font-semibold mb-4 border-b border-win-border pb-2">Contact Details</div>
            <div className="flex flex-col gap-3 text-sm">
               <div className="flex justify-between items-center"><span className="text-win-text-sec">Status</span> <span className="font-semibold uppercase text-[10px] bg-[#e5f1fb] text-win-accent px-2 py-0.5 rounded">{contact.status}</span></div>
               <div className="flex justify-between items-center"><span className="text-win-text-sec">Email</span> <span>{contact.email || '\u2014'}</span></div>
               <div className="flex justify-between items-center"><span className="text-win-text-sec">Phone</span> <span>{contact.phone || '\u2014'}</span></div>
            </div>

            <div className="text-sm font-semibold mt-6 mb-4 border-b border-win-border pb-2">Custom Fields</div>
            <div className="flex flex-col gap-3 text-sm mb-4">
               {Object.keys(contact.customFields || {}).map(key => (
                 <div key={key} className="flex justify-between items-center">
                   <span className="text-win-text-sec capitalize">{key}</span>
                   <span className="font-medium text-win-text text-right max-w-[200px] truncate">{contact.customFields[key]}</span>
                 </div>
               ))}
               {Object.keys(contact.customFields || {}).length === 0 && <div className="text-win-text-sec text-xs">No custom fields added yet.</div>}
            </div>

            <div className="flex gap-2 items-center mt-2 p-3 bg-[#fbfbfb] border border-win-border rounded-[4px]">
              <input className="win-input text-xs w-full" placeholder="Key (e.g. Kids)" value={customFieldData.key} onChange={e => setCustomFieldData({...customFieldData, key: e.target.value})} />
              <input className="win-input text-xs w-full" placeholder="Value (e.g. John, Jane)" value={customFieldData.value} onChange={e => setCustomFieldData({...customFieldData, value: e.target.value})} />
              <button className="win-btn win-btn-primary py-1 px-3 text-xs" onClick={handleAddCustomField}>Add</button>
            </div>
          </div>

          {/* Quotes */}
          <div className="bg-win-surface border border-win-border rounded-[4px] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-win-border pb-2 mb-4">
               <div className="text-sm font-semibold">Quotes</div>
               <button className="text-xs text-win-accent font-semibold hover:underline" onClick={() => setQuoteModalOpen(true)}>+ New Quote</button>
            </div>
            <div className="flex flex-col gap-4">
              {contactQuotes.map(q => (
                <div key={q.id} className="p-3 border border-win-border rounded-[4px] flex flex-col gap-2">
                   <div className="flex justify-between items-start">
                     <span className="font-medium text-sm">{fmt(q.amount)}</span>
                     <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                       q.status === 'accepted' ? 'bg-[#dff6dd] text-[#107c10]' :
                       q.status === 'rejected' ? 'bg-[#fde7e9] text-[#d13438]' :
                       q.status === 'sent' ? 'bg-[#e5f1fb] text-win-accent' :
                       'bg-[#f3f3f3] text-win-text-sec' 
                     }`}>{q.status}</span>
                   </div>
                   <div className="text-xs text-win-text-sec truncate">{q.desc || 'No description'}</div>
                   {q.pdfUrl && (
                    <a href={q.pdfUrl} target="_blank" rel="noreferrer" className="text-[10px] text-win-accent hover:underline flex items-center gap-1">
                      <FileUp className="w-3 h-3" /> View Uploaded PDF
                    </a>
                   )}
                   <div className="mt-2 pt-2 border-t border-[#f0f0f0] flex justify-end gap-1">
                     {q.status === 'draft' && (
                       <button className="win-btn win-btn-default px-2 py-0.5 text-[10px] flex items-center gap-1" onClick={() => updateQuote(q.id, {status: 'sent'})}>
                         <Check className="w-3 h-3" /> Mark Sent
                       </button>
                     )}
                     {q.status === 'sent' && (
                       <>
                         <button className="win-btn win-btn-default px-2 py-0.5 text-[10px] text-[#d13438] hover:bg-[#fde7e9]" title="Reject" onClick={() => updateQuote(q.id, {status: 'rejected'})}>
                           <X className="w-3 h-3" />
                         </button>
                         <button className="win-btn win-btn-default px-2 py-0.5 text-[10px] text-[#107c10] hover:bg-[#dff6dd] flex gap-1 items-center" title="Accept to pipeline" onClick={() => acceptQuote(q.id)}>
                            <Check className="w-3 h-3" /> Accept
                         </button>
                       </>
                     )}
                   </div>
                </div>
              ))}
              {contactQuotes.length === 0 && <div className="text-xs text-win-text-sec">No quotes found.</div>}
            </div>
          </div>
        </div>

        {quoteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-win-surface border border-win-border rounded-[8px] w-[500px] max-w-full shadow-lg flex flex-col">
            <div className="px-6 py-4 border-b border-win-border flex justify-between items-center text-lg font-semibold">
              Create New Quote
              <button onClick={() => setQuoteModalOpen(false)} className="text-win-text-sec hover:text-win-text text-xl">&times;</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-xs font-semibold">Description
                <input className="win-input" value={quoteData.desc} onChange={e => setQuoteData({...quoteData, desc: e.target.value})} placeholder="Project description" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-xs font-semibold">Amount ($)
                  <input type="number" className="win-input" value={quoteData.amount} onChange={e => setQuoteData({...quoteData, amount: e.target.value})} placeholder="e.g. 15000" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold">Valid Until
                  <input type="date" className="win-input" value={quoteData.expiry} onChange={e => setQuoteData({...quoteData, expiry: e.target.value})} />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-xs font-semibold">Line Items
                <textarea className="win-input h-20 resize-y" value={quoteData.items} onChange={e => setQuoteData({...quoteData, items: e.target.value})} placeholder="Line items..."></textarea>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold">Upload PDF Quote (Optional)
                <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-[4px] file:border-0 file:text-sm file:font-semibold file:bg-win-accent file:text-white hover:file:bg-win-accent-hover cursor-pointer" accept=".pdf" onChange={handleQuoteFileUpload} />
              </label>
            </div>
            <div className="px-6 py-4 flex justify-end gap-2 border-t border-win-border bg-[#fbfbfb] rounded-b-[8px]">
              <button className="win-btn win-btn-default" onClick={() => setQuoteModalOpen(false)}>Cancel</button>
              <button className="win-btn win-btn-primary" onClick={handleSaveQuote}>Create</button>
            </div>
          </div>
        </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-win-bg p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
           <Users className="w-5 h-5 text-win-accent" />
           <span className="text-xl font-semibold">Contacts</span>
        </div>
        <button className="win-btn win-btn-primary flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      <div className="bg-win-surface border border-win-border rounded-[4px] shadow-sm flex-1">
        <div className="flex bg-[#fafafa] border-b border-win-border text-xs font-semibold text-win-text-sec uppercase tracking-wider">
          <div className="flex-1 p-4">Name</div>
          <div className="flex-1 p-4">Company</div>
          <div className="w-32 p-4">Status</div>
          <div className="w-48 p-4">Contact Info</div>
        </div>
        <div className="flex flex-col">
          {scopedContacts.map(c => (
            <div key={c.id} className="flex items-center border-b border-win-border hover:bg-win-surface-hover transition text-sm cursor-pointer" onClick={() => setSelectedContactId(c.id)}>
              <div className="flex-1 p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded shrink-0 bg-win-accent flex items-center justify-center text-white text-xs font-bold">
                  {c.first[0]}{c.last[0]}
                </div>
                <div className="font-semibold">{c.first} {c.last}</div>
              </div>
              <div className="flex-1 p-4 flex items-center gap-2 text-win-text-sec">
                <Building className="w-4 h-4" /> {c.company || '\u2014'}
              </div>
              <div className="w-32 p-4">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  c.status === 'active' ? 'bg-[#dff6dd] text-[#107c10]' :
                  c.status === 'prospect' ? 'bg-[#e5f1fb] text-win-accent' :
                  'bg-[#f3f3f3] text-win-text-sec'
                }`}>
                   {c.status}
                </span>
              </div>
              <div className="w-48 p-4 flex flex-col gap-1 text-xs text-win-text-sec">
                {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> <span className="truncate">{c.email}</span></div>}
                {c.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> <span>{c.phone}</span></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-win-surface border border-win-border rounded-[8px] w-[500px] shadow-lg flex flex-col">
            <div className="px-6 py-4 border-b border-win-border flex justify-between items-center text-lg font-semibold">
              Add Contact
              <button onClick={() => setModalOpen(false)} className="text-win-text-sec hover:text-win-text text-xl">&times;</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-xs font-semibold">First Name
                  <input className="win-input" value={formData.first} onChange={e => setFormData({...formData, first: e.target.value})} placeholder="Wayne" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold">Last Name
                  <input className="win-input" value={formData.last} onChange={e => setFormData({...formData, last: e.target.value})} placeholder="Young" />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-xs font-semibold">Email
                <input className="win-input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="wayne@example.com" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-xs font-semibold">Company
                  <input className="win-input" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Beaver Home" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold">Phone
                  <input className="win-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="705-555-0100" />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-xs font-semibold">Status
                <select className="win-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            <div className="px-6 py-4 flex justify-end gap-2 border-t border-win-border bg-[#fbfbfb] rounded-b-[8px]">
              <button className="win-btn win-btn-default" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="win-btn win-btn-primary" onClick={handleSave}>Add Contact</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
