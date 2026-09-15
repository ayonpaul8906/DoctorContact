import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Doctor, Appointment, DoctorScheduleSlot } from '../types';
import { api } from '../lib/api';

export interface BookAppointmentPayload {
  doctorId: string;
  clinicId: string;
  scheduleId?: string;
  date: string; // ISO string with date & time
}

export function useDoctorSearch(
  query: string = '',
  city?: string,
  filters?: { liveNow?: boolean; availableToday?: boolean }
) {
  return useQuery<Doctor[]>({
    queryKey: [
      'doctors',
      'search',
      query,
      city ?? '',
      filters?.liveNow,
      filters?.availableToday,
    ],
    queryFn: async () => {
      try {
        const res = await api.get('/doctors/advanced-search', {
          params: {
            query: query.trim() || undefined,
            city: city?.trim() || undefined,
            liveNow: filters?.liveNow ? 'true' : undefined,
            availableToday: filters?.availableToday ? 'true' : undefined,
          },
        });
        return res.data?.data?.doctors || res.data?.data || [];
      } catch {
        // Fallback to basic search endpoint
        const params: Record<string, string> = {};
        if (query.trim()) params.doctorName = query.trim();
        if (city && city.trim()) params.city = city.trim();
        const { data } = await api.get('/appointments/doctors/search', { params });
        return data?.data?.doctors ?? [];
      }
    },
    staleTime: 60000,
  });
}

// Fetch doctor's sessions/schedules at a specific clinic (supports date filter)
export function useDoctorSchedules(
  doctorId: string | undefined,
  clinicId: string | undefined,
  date?: string
) {
  return useQuery<DoctorScheduleSlot[]>({
    queryKey: ['doctors', doctorId, 'clinics', clinicId, 'schedules', date ?? ''],
    enabled: Boolean(doctorId && clinicId),
    queryFn: async () => {
      try {
        const { data } = await api.get(
          `/doctors/${doctorId}/clinics/${clinicId}/schedules`,
          { params: date ? { date } : undefined }
        );
        return data?.data?.schedules ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation<Appointment, Error, BookAppointmentPayload>({
    mutationFn: async (payload: BookAppointmentPayload) => {
      const { data } = await api.post('/appointments/book/online', payload);
      return data?.data?.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'me'] });
    },
  });
}

