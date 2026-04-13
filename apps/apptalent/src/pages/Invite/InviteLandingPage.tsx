import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import { PublicInvite } from '@/types/recommendations';

export const InviteLandingPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated);

  const [invite, setInvite] = useState<PublicInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);

  // Load invite details
  useEffect(() => {
    const loadInvite = async () => {
      if (!token) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/api/v1/public/invites/${token}`);
        setInvite(response.data);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.error || 
          'Could not load invite. It may have expired.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [token, api]);

  // Handle accept
  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Redirect to login/signup with return URL
      sessionStorage.setItem('inviteToken', token || '');
      navigate('/login', {
        state: { from: location.pathname, inviteToken: token },
      });
      return;
    }

    try {
      setResponding(true);
      const response = await api.post(`/api/v1/public/invites/${token}/accept`, {});
      
      // Success - redirect to project
      setTimeout(() => {
        navigate(response.data.redirectUrl || '/projects');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept invite');
    } finally {
      setResponding(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    try {
      setResponding(true);
      await api.post(`/api/v1/public/invites/${token}/reject`, {});
      
      // Show success message and redirect
      setTimeout(() => {
        navigate('/home');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to decline invite');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-slate-700 font-medium">Loading your opportunity...</div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
        <div className="max-w-md w-full">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-bold mb-1">Invite Expired or Invalid</p>
            <p className="text-sm">{error}</p>
          </div>
          <div className="mt-6 text-center">
            <button 
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  const isExpired = new Date(invite.expires_at) < new Date();
  const scorePct = Math.max(0, Math.min(100, Number(invite.match_score || 0)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            You're Invited!
          </h1>
          <p className="text-lg text-slate-600">
            {invite.company_name} has a special opportunity for you
          </p>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden shadow-lg mb-8 bg-white rounded-xl border border-slate-200">
          {/* Company Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12">
            {invite.logo_url && (
              <img
                src={invite.logo_url}
                alt={invite.company_name}
                className="h-16 object-contain mb-4"
              />
            )}
            <h2 className="text-2xl font-bold text-white mb-2">
              {invite.company_name}
            </h2>
            <p className="text-blue-100">
              Wants to work with you on an exclusive project
            </p>
          </div>

          {/* Project Details */}
          <div className="px-8 py-8 space-y-6">
            {/* Project Title */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {invite.project_title}
              </h3>
              {invite.project_description && (
                <p className="text-slate-600 leading-relaxed">
                  {invite.project_description}
                </p>
              )}
            </div>

            {/* Match Score */}
            {scorePct > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700">
                    How Well You're Matched:
                  </span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {scorePct.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${scorePct}%` }}
                  />
                </div>
                {invite.reason_text && (
                  <p className="text-sm text-slate-600 mt-2">
                    {invite.reason_text}
                  </p>
                )}
              </div>
            )}

            {/* Project Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {invite.budget && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 font-medium">Budget</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    ${invite.budget.toLocaleString()}
                  </p>
                </div>
              )}
              {invite.deadline && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 font-medium">Deadline</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {new Date(invite.deadline).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Expiry Warning */}
            {isExpired ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-medium">
                  ⚠️ This invite has expired
                </p>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Invite expires on{' '}
                <span className="font-medium">
                  {new Date(invite.expires_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 flex gap-3">
            <button
              onClick={handleReject}
              disabled={responding || isExpired}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-50"
            >
              {responding ? 'Processing...' : 'Decline'}
            </button>
            <button
              onClick={handleAccept}
              disabled={responding || isExpired}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {!isAuthenticated
                ? 'Sign Up & Accept'
                : responding
                ? 'Processing...'
                : 'Accept Opportunity'}
            </button>
          </div>
        </div>

        {/* Authentication Status */}
        {!isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl">
            <div className="p-6">
              <p className="text-blue-900">
                You'll need to create an account or sign in to accept this opportunity.
                Don't worry, it takes just a minute!
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-bold mb-1">Action Failed</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Footer Text */}
        <div className="text-center mt-12 text-slate-600">
          <p className="text-sm">
            Questions? Contact {invite.company_name} directly
          </p>
        </div>
      </div>
    </div>
  );
};

export default InviteLandingPage;
