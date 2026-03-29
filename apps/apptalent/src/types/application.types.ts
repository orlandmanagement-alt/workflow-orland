export interface ApplicationPayload {
  projectId: string;
  roleId: string;
  coverLetter?: string;
  mediaUrl?: string; // Self-tape link
}

export interface ApplicationResponse {
  id: string;
  status: 'pending' | 'shortlisted' | 'rejected' | 'approved';
  createdAt: string;
}
