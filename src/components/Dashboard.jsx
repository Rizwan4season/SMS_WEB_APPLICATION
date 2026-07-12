import React from 'react';
import { GraduationCap, CalendarCheck, Receipt, Users, Megaphone } from 'lucide-react';

function Dashboard({ metrics, loading, onRefresh }) {
  const present = metrics.attendance_present || 0;
  const absent = metrics.attendance_absent || 0;
  const total = present + absent;
  const attendancePct = total > 0 ? `${Math.round((present / total) * 100)}%` : "92%";

  return (
    <div className="space-y-6">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{metrics.total_students}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Attendance</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{attendancePct}</h3>
            <p className="text-[10px] text-green-600 mt-0.5 font-semibold">{present} present today</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Fees Collected</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">₨ {parseFloat(metrics.fees_today || 0).toLocaleString()}</h3>
            <p className="text-[10px] text-amber-600 mt-0.5 font-semibold">Today's collections</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Staff</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{metrics.total_staff}</h3>
          </div>
        </div>
      </div>

      {/* Announcements / Notice Board & Birthdays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="text-sky-500" size={20} />
            <h3 className="font-bold text-slate-800">Notice Board & Announcements</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-sky-600 font-bold uppercase tracking-wider">July 11, 2026</span>
              <h4 className="font-bold text-sm text-slate-800 mt-1">Mid-Term Examination Schedule Released</h4>
              <p className="text-xs text-slate-500 mt-1">The mid-term examination cards have been disbursed to active students. Exams will commence from July 20, 2026. Please check timetable section.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-sky-600 font-bold uppercase tracking-wider">July 10, 2026</span>
              <h4 className="font-bold text-sm text-slate-800 mt-1">Daily Automated Fees & Attendance Alerts</h4>
              <p className="text-xs text-slate-500 mt-1">Parent SMS alerts are now active for both absentees and received fee collections. Phone numbers must be valid 11 digit numbers.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🎉</span>
            <h3 className="font-bold text-slate-800">Today's Birthdays</h3>
          </div>
          {metrics.birthdays && metrics.birthdays.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {metrics.birthdays.map((st, idx) => (
                <div key={idx} className="p-3 bg-sky-50/50 rounded-xl border border-sky-100/50 flex items-center gap-2.5">
                  <span className="text-xl">🎂</span>
                  <div className="leading-tight">
                    <h4 className="font-semibold text-sm text-slate-800">{st.name}</h4>
                    <p className="text-[10px] text-slate-500">{st.class} - Sec {st.section}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">
              No birthdays or notices today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
