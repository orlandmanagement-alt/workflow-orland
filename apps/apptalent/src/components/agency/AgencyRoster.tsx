/**
 * Agency Roster Component
 * Displays all talents managed by an agency in a public-facing list
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Users, Phone, Mail } from 'lucide-react';

interface Talent {
  id: string;
  name: string;
  profileImage: string;
  accountTier: 'free' | 'premium';
  email: string | null;
  phone: string | null;
  media: Array<{ id: string; url: string }>;
  contactEmail: string;
  contactPhone: string;
  whatsappUrl?: string;
}

interface AgencyRosterProps {
  agencyId: string;
  showContactInfo?: boolean;
}

interface RosterData {
  agencyId: string;
  agencyName: string;
  talentCount: number;
  talents: Talent[];
}

const AgencyRoster: React.FC<AgencyRosterProps> = ({ agencyId, showContactInfo = true }) => {
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgencyRoster();
  }, [agencyId]);

  const fetchAgencyRoster = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/public/agency/${agencyId}/roster`, {
        headers: {
          'x-user-tier': localStorage.getItem('userTier') || 'free',
          'x-user-role': localStorage.getItem('userRole') || 'client',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch roster: ${response.statusText}`);
      }

      const data = await response.json();
      setRoster(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching agency roster:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-semibold text-red-900">Error Loading Roster</h3>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!roster) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto text-gray-400" size={48} />
        <p className="text-gray-600 mt-4">No talents found in this agency roster.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900">{roster.agencyName}</h1>
        <p className="text-gray-600 mt-2">
          Roster with <span className="font-semibold">{roster.talentCount}</span> talent
          {roster.talentCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Talents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roster.talents.map((talent) => (
          <div key={talent.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* Profile Image */}
            <div className="aspect-square bg-gray-200 overflow-hidden">
              {talent.media && talent.media.length > 0 ? (
                <img
                  src={talent.media[0].url}
                  alt={talent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                  <Users size={64} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Talent Info */}
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{talent.name}</h3>
                {talent.accountTier === 'premium' && (
                  <span className="inline-block mt-2 px-3 py-1 bg-gold-100 text-gold-800 text-xs font-semibold rounded-full">
                    ⭐ Premium Talent
                  </span>
                )}
              </div>

              {/* Contact Info */}
              {showContactInfo && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} />
                    <span>{talent.email || 'Contact via agency'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} />
                    <span>{talent.phone || 'Contact via agency'}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => window.location.href = `/talent/${talent.id}`}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  View Profile
                </button>
                {talent.whatsappUrl && (
                  <button
                    onClick={() => window.open(talent.whatsappUrl, '_blank')}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    WhatsApp
                  </button>
                )}
              </div>

              {/* Agency Contact Redirect */}
              <div className="bg-blue-50 rounded-md p-3 text-sm">
                <p className="font-semibold text-blue-900 mb-2">Book via Agency</p>
                <p className="text-blue-700 text-xs mb-2">
                  To book this talent, please contact the agency directly:
                </p>
                <div className="space-y-1">
                  {talent.contactEmail && (
                    <a
                      href={`mailto:${talent.contactEmail}`}
                      className="text-blue-600 hover:text-blue-800 text-xs block truncate font-mono"
                    >
                      {talent.contactEmail}
                    </a>
                  )}
                  {talent.contactPhone && (
                    <a
                      href={`tel:${talent.contactPhone}`}
                      className="text-blue-600 hover:text-blue-800 text-xs block"
                    >
                      {talent.contactPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgencyRoster;
