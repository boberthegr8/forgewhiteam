import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { CalendarDays, DollarSign } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';

export function PayrollPage() {
  const { punches, users, userRole } = useAppStore();
  
  if (userRole !== 'admin') {
    return <div className="p-6 text-win-text-sec">You do not have permission to view this page.</div>;
  }

  // Calculate crude hours per user.
  // Group by user, then map punches to day. If there's an IN and OUT on the same day, calculate diff.
  
  const userStats = users.map((u: any) => {
    const uPunches = punches.filter((p: any) => p.userId === u.id).sort((a: any, b: any) => a.ts - b.ts); // oldest first
    
    let totalMinutes = 0;
    let currentInTime: Date | null = null;
    
    uPunches.forEach((p: any) => {
      if (p.type === 'in') {
        currentInTime = new Date(p.time);
      } else if (p.type === 'out' && currentInTime) {
        totalMinutes += differenceInMinutes(new Date(p.time), currentInTime);
        currentInTime = null;
      }
    });
    
    return {
      ...u,
      totalHours: (totalMinutes / 60).toFixed(2)
    };
  });

  return (
    <div className="flex flex-col h-full bg-win-bg p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <DollarSign className="w-5 h-5 text-win-accent" />
        <span className="text-xl font-semibold">Payroll & Timesheets</span>
      </div>

      <div className="bg-win-surface border border-win-border rounded-[4px] shadow-sm flex flex-col">
        <div className="p-4 border-b border-win-border flex gap-4 items-center">
          <CalendarDays className="w-5 h-5 text-win-text-sec" />
          <span className="font-semibold text-sm">All Time Summary</span>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-[#f9f9f9] border-b border-win-border text-xs">
            <tr>
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Total Hours Logged</th>
            </tr>
          </thead>
          <tbody>
             {userStats.map(u => (
               <tr key={u.id} className="border-b border-[#f0f0f0] hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                     <div className="w-6 h-6 rounded bg-win-accent flex items-center justify-center text-white text-[10px] font-bold">
                       {u.first[0]}{u.last[0]}
                     </div>
                     {u.first} {u.last}
                  </td>
                  <td className="px-4 py-3 capitalize text-win-text-sec">{u.role}</td>
                  <td className="px-4 py-3 font-semibold">{u.totalHours} hrs</td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 text-xs text-win-text-sec border-t border-win-border pt-4">
        * Note: This is a simplified timesheet summary. In a real system, you'd select pay periods, handle missed punches, and export to accounting software.
      </div>
    </div>
  );
}
