/**
 * Data Masking Utility for Privacy Protection
 * Masks sensitive information based on user tier and requester permissions
 */

export interface MaskedContactInfo {
  email: string | null;
  phone: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
}

/**
 * Masks an email address (e.g., "user@example.com" -> "us****@example.com")
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '';
  
  const [localPart, domain] = email.split('@');
  const visibleChars = Math.min(2, Math.max(1, Math.floor(localPart.length / 3)));
  const masked = localPart.substring(0, visibleChars) + '*'.repeat(Math.max(1, localPart.length - visibleChars));
  
  return `${masked}@${domain}`;
}

/**
 * Masks a phone number (e.g., "08123456789" -> "08****6789")
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '';
  
  const visible = phone.substring(0, 2);
  const last4 = phone.substring(phone.length - 4);
  const masked = '*'.repeat(phone.length - 6);
  
  return `${visible}${masked}${last4}`;
}

/**
 * Applies masking rules based on talent tier and requester status
 */
export function applyContactMasking(
  contactInfo: MaskedContactInfo,
  talentTier: 'free' | 'premium',
  requesterIsPremium: boolean
): MaskedContactInfo {
  // If talent is premium OR requester is premium, return unmasked contact info
  if (talentTier === 'premium' || requesterIsPremium) {
    return contactInfo;
  }
  
  // Otherwise, mask sensitive information
  return {
    email: contactInfo.email ? maskEmail(contactInfo.email) : null,
    phone: contactInfo.phone ? maskPhone(contactInfo.phone) : null,
    instagram: null, // Hide social media for free talents when requester is not premium
    tiktok: null,
    facebook: null,
  };
}

/**
 * Determines if a requester is premium or an admin
 */
export function isRequesterAuthorized(
  requesterTier?: 'free' | 'premium',
  requesterRole?: string
): boolean {
  return requesterTier === 'premium' || requesterRole === 'admin' || requesterRole === 'agency';
}

/**
 * Filters media/photos based on talent tier and requester permissions
 */
export function filterMediaByTier(
  media: any[],
  talentTier: 'free' | 'premium',
  requesterIsPremium: boolean
): any[] {
  // If talent is premium OR requester is premium, return all media
  if (talentTier === 'premium' || requesterIsPremium) {
    return media;
  }
  
  // Free talents: limit to 3 photos for non-premium requesters
  return media.slice(0, 3);
}
