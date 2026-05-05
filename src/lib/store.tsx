import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = 'https://zumamemyvczdmpswirjt.supabase.co';
const SUPA_KEY = 'sb_publishable_favqe0R1h3-xnSaoNGi-Iw_R8CVAlV6';
export const supabase = createClient(SUPA_URL, SUPA_KEY);
const DEFAULT_ORG = 'jk-hardware-001';

const ld = (k: string, d: any) => {
  try { return JSON.parse(localStorage.getItem('f2_' + k) || '') || d; }
  catch { return d; }
};
const sv = (k: string, v: any) => localStorage.setItem('f2_' + k, JSON.stringify(v));

export interface Store {
  id: string;
  name: string;
  orgId: string;
  adminEmail: string;
  createdAt: string;
  address?: string;
  phone?: string;
  accentColor?: string;
  logoText?: string;
}

export const initialData = {
  users: [
    { id: 1,  first: 'Rob',       last: 'Flagg',    role: 'admin',         email: 'rob.flagg1234@gmail.com',        password: 'admin123',    storeId: DEFAULT_ORG },
    { id: 2,  first: 'Adam',      last: 'Moulton',  role: 'owner',         email: 'Adam.Moulton@homehardware.ca',   password: 'Moulton1234', storeId: DEFAULT_ORG },
    { id: 3,  first: 'Steve',     last: 'Running',  role: 'manager',       email: 'Steve.Running@homehardware.ca',  password: 'Running9876', storeId: DEFAULT_ORG },
    { id: 4,  first: 'Manager',   last: '1',        role: 'store_manager', email: 'manager1@jkhardware.com',        password: 'manager1',    storeId: DEFAULT_ORG },
    { id: 5,  first: 'Manager',   last: '2',        role: 'store_manager', email: 'manager2@jkhardware.com',        password: 'manager2',    storeId: DEFAULT_ORG },
    { id: 6,  first: 'Manager',   last: '3',        role: 'store_manager', email: 'manager3@jkhardware.com',        password: 'manager3',    storeId: DEFAULT_ORG },
    { id: 7,  first: 'Manager',   last: '4',        role: 'store_manager', email: 'manager4@jkhardware.com',        password: 'manager4',    storeId: DEFAULT_ORG },
    { id: 8,  first: 'Manager',   last: '5',        role: 'store_manager', email: 'manager5@jkhardware.com',        password: 'manager5',    storeId: DEFAULT_ORG },
    { id: 9,  first: 'Manager',   last: '6',        role: 'store_manager', email: 'manager6@jkhardware.com',        password: 'manager6',    storeId: DEFAULT_ORG },
    { id: 10, first: 'Manager',   last: '7',        role: 'store_manager', email: 'manager7@jkhardware.com',        password: 'manager7',    storeId: DEFAULT_ORG },
    { id: 11, first: 'Manager',   last: '8',        role: 'store_manager', email: 'manager8@jkhardware.com',        password: 'manager8',    storeId: DEFAULT_ORG },
  ],
  contacts: [
    { id: 1, first: 'Michael', last: 'Scott', email: 'm.scott@dundermifflin.com', company: 'Dunder Mifflin', phone: '', status: 'active', date: '2024-05-15', ts: Date.now() - 864e5 * 300, ownerId: 1 },
    { id: 2, first: 'Wayne', last: 'Young', email: 'wayne@beaverhome.ca', company: 'Beaver Home', phone: '705-555-0101', status: 'lead', date: '2026-02-03', ts: Date.now() - 864e5 * 70, ownerId: 1 },
  ],
  quotes: [],
  deals: [],
  todos: [],
  deliveries: [
    { id: 901, customer: 'George Masterville', address: 'Savannah Ridge Drive, Brantford', date: new Date().toISOString().slice(0,10), slot: 'priority-1', driver: 'Driver 1', hardware: '1 - Yes', call: 'Yes', comments: '', status: 'delivered', ownerId: 1, photos: [] },
    { id: 902, customer: 'Adam - Boss', address: 'Burford Home Hardware', date: new Date().toISOString().slice(0,10), slot: 'priority-2', driver: 'Driver 1', hardware: '', call: '', comments: '', status: 'delivered', ownerId: 1, photos: [] },
  ],
  activity: [],
  notes: [],
  punches: [],
  nid: 1000,
  stores: [
    { id: DEFAULT_ORG, name: 'JK Hardware - Main', orgId: DEFAULT_ORG, adminEmail: 'rob.flagg1234@gmail.com', createdAt: new Date().toISOString(), address: 'Brantford, ON', phone: '' }
  ] as Store[],
  currentStoreId: DEFAULT_ORG,
};

interface CrmState {
  users: any[];
  currentUserId: number;
  viewFilter: number | 'all';
  contacts: any[];
  quotes: any[];
  deals: any[];
  todos: any[];
  deliveries: any[];
  activity: any[];
  notes: any[];
  punches: any[];
  notifications: any[];
  permits: any[];
  nid: number;
  stores: Store[];
  currentStoreId: string;
  isLoggedIn: boolean;
  authEmail: string | null;
  customPermissions: Record<string, string[]> | null;
  focusMode: boolean;
}

interface AppContextType extends CrmState {
  setCurrentUserId: (id: number) => void;
  setViewFilter: (filter: number | 'all') => void;
  updateState: (updates: Partial<CrmState>) => void;
  loginWithGoogle: (email: string, name: string) => { success: boolean; error?: string };
  addDelivery: (delivery: any) => void;
  editDelivery: (id: number, data: any) => void;
  deleteDelivery: (id: number) => void;
  addDeliveryPhoto: (deliveryId: number, photoUrl: string) => void;
  removeDeliveryPhoto: (deliveryId: number, photoUrl: string) => void;
  cycleDeliveryStatus: (id: number) => void;
  addQuote: (quote: any) => void;
  updateQuote: (id: number, data: any) => void;
  acceptQuote: (id: number) => void;
  addContact: (contact: any) => void;
  addDealToDelivery: (deal: any, deliveryDate: string) => void;
  updateContact: (id: number, data: any) => void;
  addTodo: (todo: any) => void;
  toggleTodo: (id: number) => void;
  clockIn: (userId: number, note?: string) => void;
  clockOut: (userId: number, note?: string) => void;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  addStore: (store: Omit<Store, 'id' | 'orgId' | 'createdAt'>) => string;
  switchStore: (storeId: string) => Promise<void>;
  deleteStore: (storeId: string) => void;
  addUserWithCredentials: (userData: any) => void;
  addNotification: (msg: string, type?: string) => void;
  clearNotifications: () => void;
  toggleFocusMode: () => void;
  bulkAddPermits: (permits: any[]) => number;
  addPermit: (permit: any) => void;
  updatePermit: (id: number, data: any) => void;
  deletePermit: (id: number) => void;
  convertPermitToContact: (permitId: number, contactData: any) => void;
  dragDelivery: (id: number, newDate: string, newSlot?: string) => void;
  dragDeal: (id: number, newStage: string) => void;
  scheduleQuoteAsDelivery: (quoteId: number, date: string, slot?: string) => void;
  currentUser: any;
  userRole: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Helper: load from localStorage but fall back to default if array is empty
  const lda = (k: string, d: any[]) => {
    const v = ld(k, d);
    return (Array.isArray(v) && v.length === 0) ? d : v;
  };

  const [state, setState] = useState<CrmState>(() => ({
    users: lda('users', initialData.users),
    currentUserId: ld('currentUserId', 1),
    viewFilter: ld('viewFilter', 'all'),
    contacts: lda('contacts', initialData.contacts),
    quotes: lda('quotes', initialData.quotes),
    deals: lda('deals', initialData.deals),
    todos: lda('todos', initialData.todos),
    deliveries: lda('deliveries', initialData.deliveries),
    activity: lda('activity', initialData.activity),
    notes: lda('notes', initialData.notes),
    punches: lda('punches', initialData.punches),
    notifications: lda('notifications', []),
    permits: lda('permits', []),
    nid: ld('nid', initialData.nid),
    stores: lda('stores', initialData.stores),
    currentStoreId: ld('currentStoreId', DEFAULT_ORG),
    isLoggedIn: ld('isLoggedIn', false),
    authEmail: ld('authEmail', null),
    customPermissions: ld('customPermissions', null),
    focusMode: ld('focusMode', false),
  }));

  const pushToCloud = async (s: CrmState) => {
    try {
      await supabase.from('forge_state').upsert({
        org_id: s.currentStoreId,
        users: s.users, contacts: s.contacts, quotes: s.quotes, deals: s.deals,
        todos: s.todos, deliveries: s.deliveries, activity: s.activity,
        notes: s.notes, punches: s.punches, nid: s.nid, stores: s.stores,
        permits: s.permits,
        updated_at: new Date().toISOString()
      }, { onConflict: 'org_id' });
    } catch (e) {
      console.warn('Cloud sync failed:', e);
    }
  };

  const updateState = (updates: Partial<CrmState>) => {
    setState((prev) => {
      const next = { ...prev, ...updates };
      Object.keys(updates).forEach(k => sv(k, next[k as keyof CrmState]));
      pushToCloud(next);
      return next;
    });
  };

  const setCurrentUserId = (id: number) => {
    sv('currentUserId', id);
    setState(s => ({ ...s, currentUserId: id }));
  };

  const setViewFilter = (filter: number | 'all') => {
    sv('viewFilter', filter);
    setState(s => ({ ...s, viewFilter: filter }));
  };

  const currentUser = state.users.find(u => u.id === state.currentUserId) || state.users[0];
  const userRole = currentUser?.role || 'admin';

  const getOwnerId = () => {
    if (userRole === 'admin' && state.viewFilter !== 'all') return state.viewFilter;
    return currentUser?.id || 1;
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = (email: string, password: string) => {
    const user = state.users.find(u =>
      u.email?.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) return { success: false, error: 'Invalid email or password.' };

    // Shift-based login check (skip for admin/manager)
    if (user.shiftStart && user.shiftEnd && user.role !== 'admin' && user.role !== 'manager') {
      const now = new Date();
      const [sh, sm] = user.shiftStart.split(':').map(Number);
      const [eh, em] = user.shiftEnd.split(':').map(Number);
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;
      if (nowMins < startMins || nowMins > endMins) {
        return { success: false, error: `Access restricted. Your shift is ${user.shiftStart} – ${user.shiftEnd}.` };
      }
    }

    sv('isLoggedIn', true);
    sv('authEmail', email);
    sv('currentUserId', user.id);
    setState(s => ({
      ...s, isLoggedIn: true, authEmail: email, currentUserId: user.id,
      activity: [{ txt: `${user.first} ${user.last} signed in`, ts: Date.now(), userId: user.id }, ...s.activity],
    }));
    return { success: true };
  };

  const loginWithGoogle = (googleEmail: string, _name: string) => {
    const user = state.users.find(u =>
      u.email?.toLowerCase() === googleEmail.toLowerCase()
    );
    if (!user) return { success: false, error: `No account found for ${googleEmail}. Ask your admin to create one with that email.` };
    sv('isLoggedIn', true);
    sv('authEmail', googleEmail);
    sv('currentUserId', user.id);
    setState(s => ({
      ...s, isLoggedIn: true, authEmail: googleEmail, currentUserId: user.id,
      activity: [{ txt: `${user.first} ${user.last} signed in via Google`, ts: Date.now(), userId: user.id }, ...s.activity],
    }));
    return { success: true };
  };

  const logout = () => {
    sv('isLoggedIn', false);
    sv('authEmail', null);
    setState(s => ({ ...s, isLoggedIn: false, authEmail: null }));
  };

  // ── Stores ────────────────────────────────────────────────────────────────
  const addStore = (storeData: Omit<Store, 'id' | 'orgId' | 'createdAt'>) => {
    const orgId = 'store-' + Date.now();
    const newStore: Store = { ...storeData, id: orgId, orgId, createdAt: new Date().toISOString() };
    updateState({ stores: [...state.stores, newStore] });
    return orgId;
  };

  const switchStore = async (storeId: string) => {
    sv('currentStoreId', storeId);
    setState(s => ({ ...s, currentStoreId: storeId }));
    try {
      const { data } = await supabase.from('forge_state').select('*').eq('org_id', storeId).single();
      if (data) {
        const ns = {
          contacts: data.contacts || [],
          quotes: data.quotes || [],
          deals: data.deals || [],
          todos: data.todos || [],
          deliveries: data.deliveries || [],
          activity: data.activity || [],
          notes: data.notes || [],
          punches: data.punches || [],
          nid: data.nid || 1000,
        };
        setState(prev => ({ ...prev, ...ns, currentStoreId: storeId }));
        Object.keys(ns).forEach(k => sv(k, ns[k as keyof typeof ns]));
      }
    } catch (e) { console.warn('Store switch failed:', e); }
  };

  const deleteStore = (storeId: string) => {
    if (storeId === DEFAULT_ORG) return;
    updateState({ stores: state.stores.filter(s => s.id !== storeId) });
  };

  // ── User with credentials ──────────────────────────────────────────────────
  const addUserWithCredentials = (userData: any) => {
    const newId = Math.max(...state.users.map(u => u.id), 0) + 1;
    const newUser = { ...userData, id: newId, storeId: state.currentStoreId };
    updateState({ users: [...state.users, newUser] });
  };

  // ── Deliveries ─────────────────────────────────────────────────────────────
  const addDelivery = (delivery: any) => {
    updateState({
      deliveries: [...state.deliveries, { ...delivery, id: state.nid + 1, photos: delivery.photos || [] }],
      nid: state.nid + 1
    });
    addNotification(`New delivery scheduled for ${delivery.customer || 'customer'}`, 'delivery');
  };

  const editDelivery = (id: number, data: any) => {
    updateState({
      deliveries: state.deliveries.map(d => d.id === id ? { ...d, ...data } : d)
    });
  };

  const deleteDelivery = (id: number) => {
    updateState({ deliveries: state.deliveries.filter(d => d.id !== id) });
  };

  const addDeliveryPhoto = (deliveryId: number, photoUrl: string) => {
    updateState({
      deliveries: state.deliveries.map(d =>
        d.id === deliveryId ? { ...d, photos: [...(d.photos || []), photoUrl] } : d
      )
    });
  };

  const removeDeliveryPhoto = (deliveryId: number, photoUrl: string) => {
    updateState({
      deliveries: state.deliveries.map(d =>
        d.id === deliveryId ? { ...d, photos: (d.photos || []).filter((p: string) => p !== photoUrl) } : d
      )
    });
  };

  const STATUS_CYCLE = ['scheduled', 'onroute', 'delivered', 'issue'];
  const cycleDeliveryStatus = (id: number) => {
    const delivery = state.deliveries.find(d => d.id === id);
    if (!delivery) return;
    const idx = STATUS_CYCLE.indexOf(delivery.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    editDelivery(id, { status: next });
  };

  const dragDelivery = (id: number, newDate: string, newSlot?: string) => {
    const updates: any = { date: newDate };
    if (newSlot) updates.slot = newSlot;
    editDelivery(id, updates);
  };

  // ── Quotes ─────────────────────────────────────────────────────────────────
  const addQuote = (quote: any) => {
    updateState({
      quotes: [{ ...quote, id: state.nid + 1, ts: Date.now(), ownerId: getOwnerId() }, ...state.quotes],
      nid: state.nid + 1
    });
  };

  const updateQuote = (id: number, data: any) => {
    updateState({ quotes: state.quotes.map(q => q.id === id ? { ...q, ...data } : q) });
  };

  const acceptQuote = (id: number) => {
    const quote = state.quotes.find(q => q.id === id);
    if (!quote) return;
    const newQuotes = state.quotes.map(q => q.id === id ? { ...q, status: 'accepted' } : q);
    const newDeal = {
      id: state.nid + 1, quoteId: id, client: quote.client, company: quote.company,
      value: quote.amount, stage: 'Quoting', date: new Date().toISOString().slice(0, 10),
      todos: [], timeline: [{ id: state.nid + 2, name: 'Quote accepted', date: new Date().toISOString().slice(0, 10), type: 'milestone', done: true }],
      steps: [], truss: null, ts: Date.now(), ownerId: quote.ownerId || getOwnerId()
    };
    updateState({
      quotes: newQuotes, deals: [newDeal, ...state.deals], nid: state.nid + 2,
      activity: [{ txt: `Quote accepted — ${quote.client} moved to Pipeline`, ts: Date.now() }, ...state.activity]
    });
  };

  const scheduleQuoteAsDelivery = (quoteId: number, date: string, slot = 'am') => {
    const quote = state.quotes.find(q => q.id === quoteId);
    if (!quote) return;
    const newDelivery = {
      id: state.nid + 1, customer: quote.client, address: '', date, slot,
      driver: '', hardware: '', call: '', comments: `From quote: ${quote.desc || ''}`,
      status: 'scheduled', ownerId: quote.ownerId || getOwnerId(), photos: []
    };
    updateState({
      deliveries: [...state.deliveries, newDelivery], nid: state.nid + 1,
      activity: [{ txt: `Delivery scheduled for ${quote.client} from quote`, ts: Date.now() }, ...state.activity]
    });
  };

  // ── Contacts ───────────────────────────────────────────────────────────────
  const addContact = (contact: any) => {
    updateState({
      contacts: [{ ...contact, id: state.nid + 1, ts: Date.now(), customFields: {}, ownerId: getOwnerId() }, ...state.contacts],
      nid: state.nid + 1
    });
  };

  const updateContact = (id: number, data: any) => {
    updateState({ contacts: state.contacts.map(c => c.id === id ? { ...c, ...data } : c) });
  };

  // ── Pipeline ───────────────────────────────────────────────────────────────
  const addDealToDelivery = (deal: any, deliveryDate: string) => {
    const newDelivery = {
      id: state.nid + 1, customer: deal.client, address: '', date: deliveryDate,
      slot: 'am', driver: '', hardware: '', call: '', comments: `From deal: ${deal.stage}`,
      status: 'scheduled', ownerId: deal.ownerId || getOwnerId(), photos: []
    };
    updateState({
      deliveries: [...state.deliveries, newDelivery], nid: state.nid + 1,
      activity: [{ txt: `Delivery scheduled for ${deal.client}`, ts: Date.now() }, ...state.activity]
    });
  };

  const dragDeal = (id: number, newStage: string) => {
    updateState({ deals: state.deals.map(d => d.id === id ? { ...d, stage: newStage } : d) });
  };

  // ── Todos ──────────────────────────────────────────────────────────────────
  const addTodo = (todo: any) => {
    updateState({
      todos: [{ ...todo, id: state.nid + 1, ts: Date.now(), done: false, ownerId: todo.ownerId || getOwnerId() }, ...state.todos],
      nid: state.nid + 1,
      activity: [{ txt: `Added a task: ${todo.title}`, ts: Date.now() }, ...state.activity]
    });
    addNotification(`New task: ${todo.title}`, 'todo');
  };

  const toggleTodo = (id: number) => {
    updateState({ todos: state.todos.map(t => t.id === id ? { ...t, done: !t.done } : t) });
  };

  // ── Punch Clock ────────────────────────────────────────────────────────────
  const clockIn = (userId: number, note = '') => {
    updateState({
      punches: [{ id: state.nid + 1, userId, type: 'in', ts: Date.now(), time: new Date().toISOString(), note }, ...state.punches],
      nid: state.nid + 1
    });
  };

  const clockOut = (userId: number, note = '') => {
    updateState({
      punches: [{ id: state.nid + 1, userId, type: 'out', ts: Date.now(), time: new Date().toISOString(), note }, ...state.punches],
      nid: state.nid + 1
    });
  };

  // ── Permits ────────────────────────────────────────────────────────────────
  const addPermit = (permit: any) => {
    const newPermit = { ...permit, id: state.nid + 1, ts: Date.now(), status: permit.status || 'new' };
    updateState({ permits: [newPermit, ...state.permits], nid: state.nid + 1 });
  };

  // Returns count of new permits added (deduped by address+issueDate)
  const bulkAddPermits = (incoming: any[]): number => {
    const existing = new Set(state.permits.map((p: any) => `${p.address}|${p.issueDate}`));
    const newOnes = incoming.filter(p => !existing.has(`${p.address}|${p.issueDate}`));
    if (newOnes.length === 0) return 0;
    let nid = state.nid;
    const stamped = newOnes.map(p => ({ ...p, id: ++nid, ts: Date.now(), status: 'new' }));
    updateState({ permits: [...stamped, ...state.permits], nid });
    return stamped.length;
  };

  const updatePermit = (id: number, data: any) => {
    updateState({ permits: state.permits.map((p: any) => p.id === id ? { ...p, ...data } : p) });
  };

  const deletePermit = (id: number) => {
    updateState({ permits: state.permits.filter((p: any) => p.id !== id) });
  };

  const convertPermitToContact = (permitId: number, contactData: any) => {
    const permit = state.permits.find((p: any) => p.id === permitId);
    if (!permit) return;
    const nid = state.nid + 1;
    const newContact = {
      ...contactData,
      id: nid,
      ts: Date.now(),
      status: 'lead',
      date: new Date().toISOString().slice(0, 10),
      ownerId: currentUser?.id || 1,
      customFields: {},
      sourcePermitId: permitId,
    };
    const updatedPermits = state.permits.map((p: any) =>
      p.id === permitId ? { ...p, status: 'converted', contactId: nid } : p
    );
    updateState({
      contacts: [newContact, ...state.contacts],
      permits: updatedPermits,
      nid,
      activity: [{ txt: `Permit converted to lead: ${newContact.first} ${newContact.last}`, ts: Date.now() }, ...state.activity],
    });
    addNotification(`Permit at ${permit.address} converted to contact`, 'lead');
  };

  // ── Notifications ──────────────────────────────────────────────────────────
  const addNotification = (msg: string, type = 'info') => {
    const n = { id: Date.now(), msg, type, ts: Date.now(), read: false };
    setState(s => {
      const updated = [n, ...s.notifications].slice(0, 50);
      sv('notifications', updated);
      return { ...s, notifications: updated };
    });
  };

  const clearNotifications = () => {
    setState(s => {
      sv('notifications', []);
      return { ...s, notifications: [] };
    });
  };

  const toggleFocusMode = () => {
    setState(s => {
      const next = !s.focusMode;
      sv('focusMode', next);
      return { ...s, focusMode: next };
    });
  };

  // ── Pre-login: pull users only so all created accounts can log in ─────────
  useEffect(() => {
    const pullUsersForLogin = async () => {
      try {
        const { data, error } = await supabase
          .from('forge_state').select('users').eq('org_id', DEFAULT_ORG).single();
        if (data && !error && data.users && data.users.length > 0) {
          const cloudUsers: any[] = data.users;
          // Always keep the default admin in case Supabase is missing them
          const adminExists = cloudUsers.some((u: any) => u.email?.toLowerCase() === 'rob.flagg1234@gmail.com');
          const merged = adminExists
            ? cloudUsers
            : [...initialData.users, ...cloudUsers.filter((u: any) => u.id > 11)];
          setState(prev => ({ ...prev, users: merged }));
          sv('users', merged);
        }
      } catch (e) { console.warn('Pre-login user pull failed:', e); }
    };
    pullUsersForLogin();
  }, []);

  // ── Cloud Pull — only after login ─────────────────────────────────────────
  useEffect(() => {
    if (!state.isLoggedIn) return; // Never pull full state before login
    const pullFromCloud = async () => {
      try {
        const { data, error } = await supabase.from('forge_state').select('*').eq('org_id', state.currentStoreId).single();
        if (data && !error) {
          const newState = {
            users: (data.users && data.users.length > 0) ? data.users : state.users,
            contacts: (data.contacts && data.contacts.length > 0) ? data.contacts : state.contacts,
            quotes: (data.quotes && data.quotes.length > 0) ? data.quotes : state.quotes,
            deals: (data.deals && data.deals.length > 0) ? data.deals : state.deals,
            todos: (data.todos && data.todos.length > 0) ? data.todos : state.todos,
            deliveries: (data.deliveries && data.deliveries.length > 0) ? data.deliveries : state.deliveries,
            activity: (data.activity && data.activity.length > 0) ? data.activity : state.activity,
            notes: (data.notes && data.notes.length > 0) ? data.notes : state.notes,
            punches: (data.punches && data.punches.length > 0) ? data.punches : state.punches,
            nid: data.nid || state.nid,
            stores: (data.stores && data.stores.length > 0) ? data.stores : state.stores,
            permits: (data.permits && data.permits.length > 0) ? data.permits : state.permits,
          };
          setState(prev => ({ ...prev, ...newState }));
          Object.keys(newState).forEach(k => sv(k, newState[k as keyof typeof newState]));
        }
      } catch (e) {
        console.warn('Cloud pull failed:', e);
      }
    };
    pullFromCloud();
  }, [state.isLoggedIn]); // Fires when user logs in

  // ── Multi-store isolation: store_manager sees only their store's data ─────
  const isStoreManager = userRole === 'store_manager';
  const smStoreUsers = isStoreManager
    ? state.users.filter(u => u.storeId === currentUser?.storeId || u.id === currentUser?.id)
    : state.users;
  const smUserIds = new Set(smStoreUsers.map(u => u.id));

  const scopedState = isStoreManager ? {
    ...state,
    contacts:   state.contacts.filter(c => smUserIds.has(c.ownerId || 1)),
    quotes:     state.quotes.filter(q => smUserIds.has(q.ownerId || 1)),
    deals:      state.deals.filter(d => smUserIds.has(d.ownerId || 1)),
    todos:      state.todos.filter(t => smUserIds.has(t.ownerId || 1)),
    deliveries: state.deliveries.filter(d => smUserIds.has(d.ownerId || 1)),
    punches:    state.punches.filter((p: any) => smUserIds.has(p.userId)),
    users:      smStoreUsers,
  } : state;

  return (
    <AppContext.Provider value={{
      ...scopedState,
      setCurrentUserId, setViewFilter, updateState,
      addDelivery, editDelivery, deleteDelivery, addDeliveryPhoto, removeDeliveryPhoto,
      cycleDeliveryStatus, dragDelivery,
      addQuote, updateQuote, acceptQuote, scheduleQuoteAsDelivery,
      addContact, updateContact,
      addDealToDelivery, dragDeal,
      addTodo, toggleTodo,
      clockIn, clockOut,
      login, logout, loginWithGoogle,
      addStore, switchStore, deleteStore,
      addUserWithCredentials,
      addNotification, clearNotifications, toggleFocusMode,
      addPermit, bulkAddPermits, updatePermit, deletePermit, convertPermitToContact,
      currentUser, userRole
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};
