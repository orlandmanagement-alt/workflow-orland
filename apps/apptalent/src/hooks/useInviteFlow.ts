import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import { AcceptInviteResponse } from '@/types/recommendations';

interface UseInviteFlowOptions {
  autoAccept?: boolean;
  onSuccess?: (response: AcceptInviteResponse) => void;
  onError?: (error: string) => void;
}

/**
 * Hook to handle invite flow:
 * 1. Extract token from session/URL
 * 2. Handle post-SSO callback
 * 3. Auto-accept recommendation if token present
 */
export const useInviteFlow = (options: UseInviteFlowOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state: any) => state.user);

  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract token from sessionStorage or URL params
  useEffect(() => {
    // Check sessionStorage first (set before redirect to login)
    const storedToken = sessionStorage.getItem('inviteToken');
    if (storedToken) {
      setInviteToken(storedToken);
      sessionStorage.removeItem('inviteToken');
    }

    // Also check URL params in case it's passed directly
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('inviteToken');
    if (urlToken) {
      setInviteToken(urlToken);
    }
  }, [location]);

  // Auto-accept invite after successful login
  useEffect(() => {
    if (
      user &&
      inviteToken &&
      !isProcessing &&
      (options.autoAccept ?? true)
    ) {
      acceptInvite();
    }
  }, [user, inviteToken, isProcessing]);

  const acceptInvite = async () => {
    if (!inviteToken) {
      setError('No invite token found');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const response = await api.post<AcceptInviteResponse>(
        `/api/v1/public/invites/${inviteToken}/accept`,
        {}
      );

      if (response.data.success) {
        setInviteToken(null);

        // Call success callback
        if (options.onSuccess) {
          options.onSuccess(response.data);
        }

        // Auto-redirect after short delay
        if (response.data.redirectUrl) {
          setTimeout(() => {
            navigate(response.data.redirectUrl || '/projects');
          }, 500);
        }
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || 'Failed to accept invite';
      setError(errorMessage);

      if (options.onError) {
        options.onError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectInvite = async () => {
    if (!inviteToken) {
      setError('No invite token found');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      await api.post(
        `/api/v1/public/invites/${inviteToken}/reject`,
        {}
      );

      setInviteToken(null);
      navigate('/home');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || 'Failed to reject invite';
      setError(errorMessage);

      if (options.onError) {
        options.onError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    inviteToken,
    isProcessing,
    error,
    acceptInvite,
    rejectInvite,
    clearError: () => setError(null),
  };
};

export default useInviteFlow;
