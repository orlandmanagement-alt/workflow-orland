import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function AgencyDashboard() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 text-yellow-600">
        <AlertCircle size={20} />
        <p className="font-semibold">Agency Dashboard - Under Development</p>
      </div>
    </div>
  );
}