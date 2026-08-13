// src/lib/roleRedirect.ts

/**
 * Utility to determine the appropriate domain URL based on a user's role.
 * The function expects a role string (e.g., 'admin', 'talent', 'client').
 * It returns the full URL for the target dashboard without forcing a logout.
 */
export const getRedirectUrl = (role: string): string => {
  const base = 'https://www.orlandmanagement.com';
  switch (role) {
    case 'admin':
      return 'https://admin.orlandmanagement.com';
    case 'talent':
      return 'https://talent.orlandmanagement.com';
    case 'client':
      return 'https://client.orlandmanagement.com';
    default:
      // Fallback to the main site if role is unknown
      return base;
  }
};
