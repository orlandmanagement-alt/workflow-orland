import React, { useState } from 'react';
import { AttendanceLog, EventRundown } from '@/types/workspace.types';
import { QrCode, CalendarClock, Users, CheckSquare, Clock, MapPin } from 'lucide-react';

const mockAttendance: AttendanceLog[] = [
  { id: 'a1', talent_id: 't-123', talent_name: 'Kevin Pratama', role_name: 'MC Panggung Utama', qr_code_scanned: true, status: 'present', check_in_time: '07:45 AM', location_verified: true },
  { id: 'a2', talent_id: 't-124', talent_name: 'Anita Lestari', role_name: 'Usher VVIP', qr_code_scanned: true, status: 'late', check_in_time: '08:15 AM', location_verified: true },
  { id: 'a3', talent_id: 't-125', talent_name: 'Bima Satria', role_name: 'Manpower / Security', qr_code_scanned: false, status: 'absent', location_verified: false }
];

const mockRundown: EventRundown[] = [
  { id: 'r1', start_time: '08:00', end_time: '09:00', activity: 'Registration & Check-in VIP', pic_name: 'Anita Lestari', talent_role_ids: ['role1'] },
  { id: 'r2', start_time: '09:00', end_time: '09:15', activity: 'Opening Ceremony by MC', pic_name: 'Kevin Pratama', talent_role_ids: ['role2'] }
];

export const EOWorkspace = ({ projectId, data }: any) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'rundown'>('attendance');

  return (
    <div className="w-full space-y-8">
      
      {/* HEADER & QR GENERATOR */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 bg-white dark:bg-dark-card p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
        
        {/* Background Graphic */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl">
              <CalendarClock size={24} />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Event Command Center</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Project ID: {projectId} • EO/WO Workspace</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('attendance')}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'attendance' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}
            >
              <Users size={16} className="inline mr-2" /> Live Check-In
            </button>
            <button 
              onClick={() => setActiveTab('rundown')}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'rundown' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}
            >
              <Clock size={16} className="inline mr-2" /> Dynamic Rundown
            </button>
          </div>
        </div>

        {/* QR CODE SYSTEM */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center relative z-10 w-full md:w-auto shrink-0 group hover:border-brand-500 transition-colors cursor-pointer text-center">
            <QrCode size={64} className="text-slate-800 dark:text-white mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Event QR Code</h4>
            <p className="text-[10px] text-slate-500">Minta talent men-scan dari Apptalent</p>
        </div>
      </div>

      {/* DYNAMIC TABS CONTENT */}
      {activeTab === 'attendance' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="text-brand-500" /> Live Attendance Feed
            </h3>
            <span className="flex items-center gap-2 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Sync Active
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl">Talent</th>
                  <th className="px-6 py-4">Assigned Role</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Check-in Time</th>
                  <th className="px-6 py-4 rounded-tr-2xl text-center">GPS Verify</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-slate-100 dark:divide-slate-800">
                {mockAttendance.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{log.talent_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{log.talent_id}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                      {log.role_name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {log.status === 'present' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400">HADIR</span>}
                      {log.status === 'late' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">TERLAMBAT</span>}
                      {log.status === 'absent' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">BELUM HADIR</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {log.check_in_time || '--:--'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {log.location_verified ? (
                        <MapPin size={16} className="text-green-500 mx-auto" />
                      ) : (
                        <MapPin size={16} className="text-slate-300 dark:text-slate-700 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="text-amber-500" /> Rundown Builder
            </h3>
            <button className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white px-4 py-2 rounded-xl transition-colors">
              + Tambah Slot Waktu
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl">Time Frame</th>
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4 rounded-tr-2xl">PIC / Talent in Charge</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-slate-100 dark:divide-slate-800">
                {mockRundown.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-grab active:cursor-grabbing">
                    <td className="px-6 py-4 font-mono font-bold text-brand-600 dark:text-brand-400 text-xs">
                      {item.start_time} - {item.end_time}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {item.activity}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                      {item.pic_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
