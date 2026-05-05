import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { CheckSquare, Square, AlertCircle, Clock } from 'lucide-react';

export function TodosPage() {
  const { todos, addTodo, toggleTodo, currentUser, userRole, viewFilter, users } = useAppStore();
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'normal', due: '' });

  const effectiveUserId = userRole === 'admin' ? viewFilter : currentUser.id;
  const scopedTodos = effectiveUserId === 'all' ? todos : todos.filter(t => (t.ownerId || 1) === effectiveUserId);

  const handleCreate = () => {
    if (!newTask.title) return;
    addTodo({ ...newTask });
    setNewTask({ title: '', priority: 'normal', due: '' });
    setAdding(false);
  };

  const pending = scopedTodos.filter((t: any) => !t.done);
  const completed = scopedTodos.filter((t: any) => t.done);

  return (
    <div className="flex flex-col h-full bg-win-bg p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-2">
           <CheckSquare className="w-5 h-5 text-win-accent" />
           <span className="text-xl font-semibold">To-Do List</span>
        </div>
        <button className="win-btn win-btn-primary" onClick={() => setAdding(true)}>+ Task</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        {/* Pending Tasks */}
        <div className="bg-win-surface border border-win-border rounded-[4px] shadow-sm flex flex-col">
          <div className="p-4 border-b border-win-border font-semibold text-win-accent flex justify-between items-center">
            <span>Pending</span>
            <span className="bg-[#e5f1fb] text-xs px-2 py-0.5 rounded-full">{pending.length}</span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {pending.map((t: any) => {
              const owner = users.find(u => u.id === (t.ownerId || 1));
              return (
              <div key={t.id} className="flex items-center justify-between p-3 border border-win-border rounded-[4px] bg-white hover:border-win-accent transition">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleTodo(t.id)} className="text-win-text-sec hover:text-win-accent">
                    <Square className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{t.title}</span>
                    <div className="flex gap-2 items-center mt-1">
                      {t.priority === 'high' && <span className="flex items-center gap-1 text-[10px] text-[#d13438] font-bold"><AlertCircle className="w-3 h-3"/> HIGH PRIORITY</span>}
                      {t.due && <span className="flex items-center gap-1 text-[10px] text-win-text-sec"><Clock className="w-3 h-3"/> {t.due}</span>}
                      {userRole === 'admin' && owner && <span className="text-[10px] text-win-accent font-semibold">• {owner.first} {owner.last}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )})}
            {pending.length === 0 && <div className="text-sm text-win-text-sec p-2">All caught up!</div>}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-win-surface border border-win-border rounded-[4px] shadow-sm flex flex-col opacity-60 hover:opacity-100 transition-opacity">
          <div className="p-4 border-b border-win-border font-semibold text-win-text-sec flex justify-between items-center">
            <span>Completed</span>
            <span className="bg-[#f0f0f0] text-xs px-2 py-0.5 rounded-full">{completed.length}</span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {completed.map((t: any) => {
              const owner = users.find(u => u.id === (t.ownerId || 1));
              return (
              <div key={t.id} className="flex items-center justify-between p-3 border border-win-border rounded-[4px] bg-[#fdfdfd]">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleTodo(t.id)} className="text-win-accent">
                    <CheckSquare className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm line-through text-win-text-sec">{t.title}</span>
                    {userRole === 'admin' && owner && <span className="text-[10px] text-win-text-sec mt-0.5">{owner.first} {owner.last}</span>}
                  </div>
                </div>
              </div>
            )})}
            {completed.length === 0 && <div className="text-sm text-win-text-sec p-2">No completed tasks yet.</div>}
          </div>
        </div>
      </div>

      {adding && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-win-surface border border-win-border rounded-[8px] w-[400px] shadow-lg flex flex-col">
            <div className="px-6 py-4 border-b border-win-border font-semibold text-lg">Add Task</div>
            <div className="p-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-xs font-semibold">Title
                <input className="win-input" autoFocus value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="What needs to be done?" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-xs font-semibold">Priority
                  <select className="win-input" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold">Due Date
                  <input type="date" className="win-input" value={newTask.due} onChange={e => setNewTask({...newTask, due: e.target.value})} />
                </label>
              </div>
            </div>
            <div className="px-6 py-4 flex justify-end gap-2 border-t border-win-border bg-[#fbfbfb] rounded-b-[8px]">
              <button className="win-btn win-btn-default" onClick={() => setAdding(false)}>Cancel</button>
              <button className="win-btn win-btn-primary" onClick={handleCreate}>Save Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
