export interface ProjectRole {
  id: string;
  name: string; // e.g. "Main Character: Sarah"
  description: string;
  gender: 'male' | 'female' | 'any';
  ageRange: { min: number; max: number };
  requirements: string[];
}

export interface Project {
  id: string;
  title: string;
  clientName: string;
  description: string;
  moodboardUrl?: string;
  shootingDates: { start: string; end: string };
  payment: { amount: number; currency: string; type: 'fixed' | 'hourly' };
  status: 'open' | 'closed';
  roles: ProjectRole[];
  matchScore?: number; // Injected by match-score API
  mismatchReason?: string; // E.g. "Role Mismatch: Gender/Age"
}
