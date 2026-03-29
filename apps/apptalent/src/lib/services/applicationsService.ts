import { apiRequest } from '../api';
import { ApplicationPayload, ApplicationResponse } from '@/types/application.types';

export const applicationsService = {
  applyForProject: async (payload: ApplicationPayload): Promise<ApplicationResponse> => {
    try {
      const response = await apiRequest('/applications', {
        method: 'POST',
        data: payload
      });
      return response?.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to submit application');
    }
  }
};
