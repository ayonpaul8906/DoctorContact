import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Followup, FollowupStatus } from '../types';

export interface ScheduleFollowupInput {
  patientId: string;
  doctorId: string;
  clinicId: string;
  appointmentId?: string | null;
  followUpDate: string; // YYYY-MM-DD
  notes?: string;
}

/**
 * Fetch scheduled follow-ups for a clinic with optional status or doctor filtering.
 */
export function useClinicFollowups(
  clinicId: string | undefined,
  filters: { doctorId?: string; status?: FollowupStatus | ''; upcomingOnly?: boolean } = {}
) {
  return useQuery<Followup[]>({
    queryKey: ['followups', 'clinic', clinicId, filters],
    enabled: !!clinicId,
    queryFn: async () => {
      try {
        const cleanParams = Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '' && v != null)
        );
        const { data } = await api.get(`/followups/clinic/${clinicId}`, { params: cleanParams });
        return data?.data?.followups ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 15000,
  });
}

/**
 * Schedule a new patient follow-up.
 */
export function useScheduleFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ScheduleFollowupInput) => {
      const { data } = await api.post('/followups', input);
      return data?.data?.followup as Followup;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['followups'] });
    },
  });
}

/**
 * Cancel a scheduled follow-up.
 */
export function useCancelFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (followupId: string) => {
      const { data } = await api.patch(`/followups/${followupId}/cancel`);
      return data?.data?.followup as Followup;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['followups'] });
    },
  });
}

/**
 * Mark a follow-up as completed.
 */
export function useCompleteFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (followupId: string) => {
      const { data } = await api.patch(`/followups/${followupId}/complete`);
      return data?.data?.followup as Followup;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['followups'] });
    },
  });
}
