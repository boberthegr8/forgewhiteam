import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Users, FileText, CheckSquare, X, FileUp } from 'lucide-react';

export function WorkforcePage() {
  const { users, quotes, todos, notes, currentUser, addTodo } = useAppStore();
  const [addingTodoFor, setAddingTodoFor] = useState<number | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [viewingQuote, setViewingQuote] = useState<any>(null);

  if (currentUser.role !== 'admin') {
    return <div className="p-6 text-win-text-sec">Access denied.</div>;
  }

  const handleCreateTodo = (userId: number) => {
    if (!newTodoTitle) return;
    addTodo({ title: newTodoTitle, priority: 'normal', due: '', ownerId: userId });
    setNewTodoTitle('');
    setAddingTodoFor(null);
  };

  const fmt = (n: number) => '$' + Number(n).toLocaleString();

  return (
    <div className="flex flex-col h-full bg-win-bg p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <Users className="w-5 h-5 text-win-accent" />
        <span className="text-xl font-semibold">Workforce</span>
      </div>

      <div className="flex flex-col gap-6">
        {users.map(u => {
          const userQuotes = quotes.filter(q => (q.ownerId || 1) === u.id);
          const userTodos = todos.filter(t => (t.ownerId || 1) === u.id && !t.done);
          
          return (
            <div key={u.id} className="bg-win-surface border border-win-border rounded-[4px] shadow-sm flex flex-col md:flex-row overflow-hidden">
              <div className="md:w-[250px] bg-[#fdfdfd] border-b md:border-b-0 md:border-r border-win-border p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded shrink-0 bg-win-accent flex items-center justify-center text-white font-bold">
                      {u.first[0]}{u.last[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-win-text">{u.first} {u.last}</div>
                      <div className="text-xs text-win-text-sec uppercase tracking-wider">{u.role}</div>
                    </div>
                  </div>
                  <div className="text-xs text-win-text-sec mb-4">{u.email}</div>
                </div>
                
                <div className="text-xs font-semibold text-win-accent cursor-pointer hover:underline" onClick={() => setAddingTodoFor(u.id)}>
                   + Assign Task
                </div>
              </div>

              <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold uppercase text-win-text-sec flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Recent Quotes
                    </div>
                    <div className="text-xs bg-[#e5f1fb] text-win-accent px-2 py-0.5 rounded-full">{userQuotes.length}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {userQuotes.slice(0, 3).map(q => (
                      <div 
                        key={q.id} 
                        className="border border-win-border rounded p-2 text-sm flex justify-between items-center bg-[#fafafa] cursor-pointer hover:bg-win-surface-hover hover:border-win-border-hover transition"
                        onClick={() => setViewingQuote(q)}
                      >
                        <div className="truncate pr-2 font-medium">{q.client}</div>
                        <div className="text-right shrink-0">
                           <div className="font-semibold">{fmt(q.amount)}</div>
                           <div className="text-[10px] uppercase text-[#107c10]">{q.status}</div>
                        </div>
                      </div>
                    ))}
                    {userQuotes.length === 0 && <div className="text-xs text-win-text-sec italic">No quotes found</div>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold uppercase text-win-text-sec flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" /> Open Tasks
                    </div>
                    <div className="text-xs bg-[#fdf2e8] text-[#d83b01] px-2 py-0.5 rounded-full">{userTodos.length}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {addingTodoFor === u.id && (
                      <div className="border border-win-border rounded p-2 text-sm flex flex-col gap-2 bg-white">
                        <input 
                          type="text" 
                          className="win-input text-xs" 
                          placeholder="Task title..." 
                          value={newTodoTitle}
                          onChange={e => setNewTodoTitle(e.target.value)}
                          autoFocus
                          onKeyDown={e => {
                             if (e.key === 'Enter') handleCreateTodo(u.id);
                             if (e.key === 'Escape') setAddingTodoFor(null);
                          }}
                        />
                        <div className="flex justify-end gap-2">
                           <button className="text-[10px] text-win-text-sec" onClick={() => setAddingTodoFor(null)}>Cancel</button>
                           <button className="text-[10px] bg-win-accent text-white px-2 py-0.5 rounded" onClick={() => handleCreateTodo(u.id)}>Add</button>
                        </div>
                      </div>
                    )}
                    {userTodos.slice(0, 3).map(t => (
                        <div key={t.id} className="border border-win-border rounded p-2 text-sm flex items-center gap-2 bg-[#fafafa]">
                          <div className="w-3 h-3 border border-win-text-sec rounded-sm shrink-0"></div>
                          <div className="truncate flex-1">{t.title}</div>
                        </div>
                    ))}
                    {userTodos.length === 0 && addingTodoFor !== u.id && <div className="text-xs text-win-text-sec italic">No open tasks</div>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {viewingQuote && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-win-surface border border-win-border rounded-[8px] w-[500px] max-w-full shadow-lg flex flex-col">
            <div className="px-6 py-4 border-b border-win-border flex justify-between items-center text-lg font-semibold bg-[#fafafa] rounded-t-[8px]">
              Quote Details
              <button onClick={() => setViewingQuote(null)} className="text-win-text-sec hover:text-win-text text-xl">&times;</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
               <div>
                  <div className="text-xs font-semibold text-win-text-sec uppercase">Client</div>
                  <div className="font-semibold text-base">{viewingQuote.client} <span className="text-sm font-normal text-win-text-sec">({viewingQuote.company})</span></div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <div className="text-xs font-semibold text-win-text-sec uppercase">Amount</div>
                    <div className="font-semibold text-lg text-win-accent">{fmt(viewingQuote.amount)}</div>
                 </div>
                 <div>
                    <div className="text-xs font-semibold text-win-text-sec uppercase">Status</div>
                    <div className="font-semibold">{viewingQuote.status}</div>
                 </div>
               </div>

               <div>
                 <div className="text-xs font-semibold text-win-text-sec uppercase mb-1">Description</div>
                 <div className="text-sm border-l-2 border-[#e5e5e5] pl-3 py-1 italic text-win-text-sec">
                   {viewingQuote.desc || 'No description provided.'}
                 </div>
               </div>

               {viewingQuote.items && (
                 <div>
                   <div className="text-xs font-semibold text-win-text-sec uppercase mb-1">Line Items</div>
                   <div className="text-sm pb-2 whitespace-pre-wrap">{viewingQuote.items}</div>
                 </div>
               )}

               {viewingQuote.pdfUrl && (
                 <div className="pt-2">
                   <a href={viewingQuote.pdfUrl} target="_blank" rel="noreferrer" className="text-sm text-win-accent hover:underline flex items-center gap-2">
                     <FileUp className="w-4 h-4" /> View Associated PDF
                   </a>
                 </div>
               )}
            </div>
            <div className="px-6 py-4 flex justify-end gap-2 border-t border-win-border bg-[#fbfbfb] rounded-b-[8px]">
              <button className="win-btn win-btn-default" onClick={() => setViewingQuote(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
