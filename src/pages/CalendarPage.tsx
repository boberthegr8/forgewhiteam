import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, LogIn } from 'lucide-react';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [token, setToken] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: tokenResponse => {
      setToken(tokenResponse.access_token);
      // Here we would use the token to fetch actual events using gapi or fetch
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly'
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  
  const startDate = monthStart; // Normally we pad this to the start of the week
  const endDate = monthEnd;

  const dateFormat = "MMMM yyyy";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const generateDays = () => {
    // Pad start to Sunday
    let start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay());

    let end = new Date(endDate);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const dateInterval = eachDayOfInterval({ start, end });
    
    return dateInterval.map(d => ({
      date: d,
      isCurrentMonth: isSameMonth(d, monthStart),
      isTodayItem: isToday(d)
    }));
  };

  const calendarDays = generateDays();

  return (
    <div className="flex flex-col h-full bg-win-bg overflow-y-auto">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
           <CalendarIcon className="w-5 h-5 text-win-accent" />
           <span className="text-xl font-semibold">Meetings Calendar</span>
        </div>
        {!token ? (
          <button 
             onClick={() => login()} 
             className="win-btn win-btn-primary flex items-center gap-2"
          >
             <LogIn className="w-4 h-4" />
             Connect Gmail
          </button>
        ) : (
          <span className="text-sm font-semibold text-[#107c10] bg-[#dff6dd] px-3 py-1 rounded">
             ✓ Connected to Gmail
          </span>
        )}
      </div>

      <div className="px-6 flex-1 flex flex-col pb-6">
         <div className="bg-win-surface border border-win-border shadow-sm flex-1 flex flex-col rounded-[4px]">
            <div className="p-4 border-b border-win-border flex justify-between items-center">
              <div className="text-lg font-semibold">{format(currentDate, dateFormat)}</div>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-[#f3f3f3] rounded" onClick={prevMonth}><ChevronLeft className="w-5 h-5" /></button>
                <button className="p-1 hover:bg-[#f3f3f3] rounded" onClick={() => setCurrentDate(new Date())}>Today</button>
                <button className="p-1 hover:bg-[#f3f3f3] rounded" onClick={nextMonth}><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-win-border bg-[#fafafa]">
              {days.map(d => (
                 <div key={d} className="py-2 text-center text-xs font-semibold text-win-text-sec uppercase">
                    {d}
                 </div>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-7 grid-rows-5">
              {calendarDays.map((dayObj, i) => (
                <div 
                  key={i} 
                  className={`border-b border-r border-win-border min-h-24 p-2 relative ${!dayObj.isCurrentMonth ? 'bg-[#fafafa] text-win-text-sec' : 'bg-white'}`}
                >
                  <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${dayObj.isTodayItem ? 'bg-win-accent text-white' : ''}`}>
                     {format(dayObj.date, 'd')}
                  </div>
                  
                  {/* Fake events indicating connected status */}
                  {token && dayObj.isCurrentMonth && dayObj.date.getDate() % 5 === 0 && (
                     <div className="mt-2 text-[10px] bg-[#e5f1fb] text-win-accent px-1 py-0.5 rounded truncate">
                        {dayObj.date.getDate() === 5 ? 'Site Visit (Client)' : 'Team Meeting'}
                     </div>
                  )}
                </div>
              ))}
            </div>
         </div>
      </div>
    </div>
  );
}
