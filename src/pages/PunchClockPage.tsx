import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Clock, Play, Square } from 'lucide-react';
import { format } from 'date-fns';

export function PunchClockPage() {
  const { punches, clockIn, clockOut, currentUser, users } = useAppStore();
  const [note, setNote] = useState('');

  const myPunches = punches.filter((p: any) => p.userId === currentUser.id).sort((a: any, b: any) => b.ts - a.ts);
  
  // A naive check: if the last punch was 'in', user is clocked in.
  const isClockedIn = myPunches.length > 0 && myPunches[0].type === 'in';

  const handleAction = () => {
    if (isClockedIn) {
      clockOut(currentUser.id, note);
    } else {
      clockIn(currentUser.id, note);
    }
    setNote('');
  };

  return (
    <div className="flex flex-col h-full bg-win-bg p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <Clock className="w-5 h-5 text-win-accent" />
        <span className="text-xl font-semibold">Time Tracking</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Clock In/Out Panel */}
        <div className="w-full md:w-1/3 bg-win-surface border border-win-border rounded-[4px] p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="mb-4 text-sm text-win-text-sec">
             Current Status: <strong className={isClockedIn ? 'text-[#107c10]' : 'text-win-text'}>{isClockedIn ? 'CLOCKED IN' : 'CLOCKED OUT'}</strong>
          </div>

          <div className="text-3xl font-light mb-8 tabular-nums">
             {format(new Date(), 'h:mm a')}
          </div>

          <input 
             className="win-input w-full mb-4 text-center" 
             placeholder={isClockedIn ? "What are you working on? (optional)" : "Punch note (optional)"}
             value={note}
             onChange={e => setNote(e.target.value)}
          />

          <button 
             onClick={handleAction}
             className={`w-full py-4 rounded-[4px] text-white font-bold flex items-center justify-center gap-2 transition active:scale-95 ${isClockedIn ? 'bg-[#d13438] hover:bg-[#b02a2d]' : 'bg-[#107c10] hover:bg-[#0c5d0c]'}`}
          >
             {isClockedIn ? <><Square className="w-5 h-5 fill-current" /> CLOCK OUT</> : <><Play className="w-5 h-5 fill-current" /> CLOCK IN</>}
          </button>
        </div>

        {/* Recent Punches Summary */}
        <div className="w-full md:w-2/3 bg-win-surface border border-win-border rounded-[4px] shadow-sm flex flex-col">
          <div className="p-4 border-b border-win-border font-semibold text-win-text">My Recent Punches</div>
          <div className="p-0 overflow-y-auto">
            {myPunches.length === 0 ? (
               <div className="p-4 text-sm text-win-text-sec text-center">No recent punches found.</div>
            ) : (
               <table className="w-full text-sm text-left">
                  <thead className="bg-[#f9f9f9] border-b border-win-border text-xs">
                     <tr>
                        <th className="px-4 py-2 font-semibold">Date & Time</th>
                        <th className="px-4 py-2 font-semibold">Action</th>
                        <th className="px-4 py-2 font-semibold">Note</th>
                     </tr>
                  </thead>
                  <tbody>
                    {myPunches.slice(0, 15).map((p: any) => (
                      <tr key={p.id} className="border-b border-[#f0f0f0] hover:bg-[#fafafa]">
                         <td className="px-4 py-2 font-medium">{format(new Date(p.time), 'MMM d, yyyy h:mm a')}</td>
                         <td className="px-4 py-2">
                           {p.type === 'in' ? 
                             <span className="bg-[#dff6dd] text-[#107c10] px-2 py-0.5 text-[10px] uppercase font-bold rounded">In</span> :
                             <span className="bg-[#fde7e9] text-[#d13438] px-2 py-0.5 text-[10px] uppercase font-bold rounded">Out</span>
                           }
                         </td>
                         <td className="px-4 py-2 text-win-text-sec max-w-xs truncate">{p.note || '\u2014'}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
