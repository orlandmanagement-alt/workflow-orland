import React, { useState, useEffect } from 'react';
import { Building2, Copy, Check, LogOut } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface AgencyInfo {
  agency_id: string;
  agency_name: string;
  logo_url?: string;
  admin_email: string;
  admin_name: string;
}

interface AgencyProfileCardProps {
  agencyInfo: AgencyInfo | null;
  onLeaveAgency?: () => void;
}

export function AgencyProfileCard({ agencyInfo, onLeaveAgency }: AgencyProfileCardProps) {
  const [copied, setCopied] = useState(false);

  if (!agencyInfo) return null;

  const handleCopyAgencyInfo = () => {
    const infoText = `Agensi: ${agencyInfo.agency_name}\nKontak: ${agencyInfo.admin_email}`;
    navigator.clipboard.writeText(infoText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Agency Logo */}
          {agencyInfo.logo_url ? (
            <img 
              src={agencyInfo.logo_url} 
              alt={agencyInfo.agency_name}
              className="w-16 h-16 rounded-lg object-cover border border-blue-300"
            />
          ) : (
            <div className="w-16 h-16 bg-blue-200 rounded-lg flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          )}
          
          {/* Agency Info */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Agensi Anda</h3>
            <p className="text-sm font-medium text-indigo-700">{agencyInfo.agency_name}</p>
            <p className="text-xs text-gray-600 mt-1">
              Admin: {agencyInfo.admin_name} ({agencyInfo.admin_email})
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ID Agensi: <code className="bg-white px-2 py-0.5 rounded text-xs">{agencyInfo.agency_id}</code>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleCopyAgencyInfo}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            title="Salin info agensi"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-blue-600" />
            )}
          </button>
          
          {onLeaveAgency && (
            <button
              onClick={onLeaveAgency}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              title="Tinggalkan agensi"
            >
              <LogOut className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      </div>

      {/* Agency Status */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <p className="text-xs text-gray-600">
          ✓ Profil Anda terhubung dengan agensi <span className="font-semibold">{agencyInfo.agency_name}</span>.
          Hubungi admin agensi untuk bantuan lebih lanjut.
        </p>
      </div>
    </div>
  );
}
