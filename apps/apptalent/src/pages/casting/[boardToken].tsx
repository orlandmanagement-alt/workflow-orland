import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Film, Users, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { CastingGuestSubmit } from '@/components/casting/CastingGuestSubmit';

interface CastingBoardData {
  board_id: string;
  project_id: string;
  project_name: string;
  role_title: string;
  role_description?: string;
  quantity_needed?: number;
  casting_director_name?: string;
  casting_director_email?: string;
  allow_guests: boolean;
  guest_questions?: any[];
  expires_at?: string;
  status: string;
}

export default function CastingCallPage() {
  const { boardToken } = useParams<{ boardToken: string }>();
  const [searchParams] = useSearchParams();
  
  const [boardData, setBoardData] = useState<CastingBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBoardData();
  }, [boardToken]);

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const res: any = await api(`/api/v1/casting/board/${boardToken}`, {
        method: 'GET',
      });

      if (res.status === 'ok') {
        setBoardData(res.data);
      } else {
        setError(res.message || 'Casting board tidak ditemukan');
      }
    } catch (err: any) {
      setError('Gagal memuat casting board');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !boardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="font-bold text-lg text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600">{error || 'Casting board tidak ditemukan'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{boardData.role_title}</h1>
              <p className="text-lg text-indigo-600 font-medium">{boardData.project_name}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left - Project Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Role Description */}
            {boardData.role_description && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="font-bold text-lg text-gray-900 mb-3">Deskripsi Peran</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{boardData.role_description}</p>
              </div>
            )}

            {/* Requirements */}
            <div className="grid grid-cols-2 gap-4">
              {boardData.quantity_needed && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Posisi Dibutuhkan</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{boardData.quantity_needed}</p>
                </div>
              )}

              {boardData.expires_at && (
                <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">Batas Pendaftaran</span>
                  </div>
                  <p className="text-lg font-bold text-purple-900">
                    {new Date(boardData.expires_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Casting Director Info */}
            {boardData.casting_director_name && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3">Casting Director</h3>
                <p className="text-gray-700 font-medium mb-1">{boardData.casting_director_name}</p>
                {boardData.casting_director_email && (
                  <a
                    href={`mailto:${boardData.casting_director_email}`}
                    className="text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    {boardData.casting_director_email}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right - Registration Form */}
          <div className="md:col-span-1">
            {boardData.status === 'Active' ? (
              <CastingGuestSubmit
                boardInfo={{
                  board_id: boardData.board_id,
                  project_name: boardData.project_name,
                  role_title: boardData.role_title,
                  role_description: boardData.role_description,
                  casting_director_name: boardData.casting_director_name,
                  casting_director_email: boardData.casting_director_email,
                  allow_guests: boardData.allow_guests,
                  guest_questions: boardData.guest_questions,
                  expires_at: boardData.expires_at,
                }}
              />
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <h3 className="font-bold text-yellow-900 mb-2">Casting Ditutup</h3>
                <p className="text-yellow-700 text-sm">
                  Maaf, pendaftaran untuk casting call ini sudah ditutup.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
