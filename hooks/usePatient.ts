import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Appointment, PatientProfile, Followup, Referral, BookingStatus } from '../types';
import { api } from '../lib/api';

export function useMyAppointments() {
  return useQuery<Appointment[]>({
    queryKey: ['appointments', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/appointments/me');
      return data?.data?.appointments ?? [];
    },
    staleTime: 30000,
  });
}

/**
 * Fetch a single appointment with triple-tier resilience:
 * 1. Checks ['appointments', 'me'] cache first (instant)
 * 2. Fetches fresh /appointments/me if missing
 * 3. Fallbacks to /appointments/:id/live for real-time ticket data
 */
export function useAppointmentDetails(appointmentId?: string) {
  const queryClient = useQueryClient();
  const rawId = Array.isArray(appointmentId) ? appointmentId[0] : appointmentId;
  const normalizedId = rawId ? decodeURIComponent(String(rawId)).trim() : '';

  return useQuery<Appointment | null>({
    queryKey: ['appointment', normalizedId],
    queryFn: async () => {
      if (!normalizedId) return null;

      // 1. Look in existing query cache for ['appointments', 'me']
      const cachedList = queryClient.getQueryData<Appointment[]>(['appointments', 'me']);
      const foundInCache = cachedList?.find(
        (a) => String(a.id).trim().toLowerCase() === normalizedId.toLowerCase()
      );
      if (foundInCache) return foundInCache;

      // 2. Fetch fresh list from /appointments/me and update cache
      try {
        const { data } = await api.get('/appointments/me');
        const list: Appointment[] = data?.data?.appointments ?? [];
        queryClient.setQueryData(['appointments', 'me'], list);
        const matched = list.find(
          (a) => String(a.id).trim().toLowerCase() === normalizedId.toLowerCase()
        );
        if (matched) return matched;
      } catch (err) {
        if (__DEV__) console.warn('Failed to fetch /appointments/me:', err);
      }

      // 3. Directly fetch live queue view from /appointments/:id/live
      try {
        const liveRes = await api.get(`/appointments/${normalizedId}/live`);
        const liveData = liveRes.data?.data || liveRes.data;
        if (liveData) {
          const directAppt: Appointment = {
            id: normalizedId,
            token: liveData.token ?? liveData.yourToken ?? 1,
            status: liveData.status ?? 'WAITING',
            date: liveData.date || new Date().toISOString(),
            queueMode: liveData.queueMode ?? 'LIVE',
            doctor: {
              id: liveData.doctorId || '',
              user: { name: liveData.doctorName || 'Doctor' },
            } as any,
            clinic: {
              id: liveData.clinicId || '',
              clinicName: liveData.clinicName || 'Clinic',
            } as any,
            queue: {
              id: liveData.queueId || '',
              currentToken: liveData.currentToken,
              status: liveData.queueStatus,
              schedule: liveData.session,
            } as any,
            session: liveData.session,
            patientsAhead: liveData.patientsAhead,
            isYourTurn: liveData.isYourTurn,
            estimatedWaitMinutes: liveData.estimatedWaitMinutes,
            estimatedWaitLabel: liveData.estimatedWaitLabel,
          } as unknown as Appointment;
          return directAppt;
        }
      } catch (err) {
        if (__DEV__) console.warn('Failed to fetch /appointments/:id/live:', err);
      }

      return null;
    },
    enabled: Boolean(normalizedId),
    staleTime: 5000,
  });
}

export function useMyBookingStatus() {
  return useQuery<BookingStatus>({
    queryKey: ['appointments', 'booking-status'],
    queryFn: async () => {
      const { data } = await api.get('/appointments/me/booking-status');
      return data?.data;
    },
    staleTime: 30000,
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ appointmentId, reason }: { appointmentId: string; reason?: string }) => {
      const { data } = await api.patch(`/appointments/${appointmentId}/cancel`, { reason });
      return data?.data?.appointment as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'booking-status'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useMyFollowups() {
  return useQuery<Followup[]>({
    queryKey: ['followups', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/followups/me');
      return data?.data?.followups ?? [];
    },
    staleTime: 30000,
  });
}

export function useMyReferrals() {
  return useQuery<Referral[]>({
    queryKey: ['referrals', 'me'],
    queryFn: async () => {
      const res = await api.get('/test-referrals/me');
      return res?.data?.data?.referrals ?? [];
    },
    staleTime: 30000,
  });
}

export function useMyPatientProfile() {
  return useQuery<PatientProfile>({
    queryKey: ['patient', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/patient/me');
      return data?.data?.patient;
    },
    staleTime: 60000,
  });
}

export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.patch('/patient/me', payload);
      return data?.data?.patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', 'me'] });
    },
  });
}

