import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  Clinic,
  ClinicDoctor,
  ClinicReceptionist,
  WorkingHour,
  ClinicHoliday,
  SentDoctorRequest,
  DailyDashboard,
  PeriodReport,
  GrowthReport,
  AppNotification,
  Appointment,
  BookReceptionAppointmentInput,
} from '../types';

// ============================================================
// 1. Clinic Profile & Settings
// ============================================================

export function useClinicProfile() {
  return useQuery<Clinic>({
    queryKey: ['clinic', 'profile'],
    queryFn: async () => {
      const res = await api.get('/clinic/profile');
      return res.data?.data?.clinic ?? res.data?.clinic;
    },
    staleTime: 30000,
  });
}

export function useUpdateClinicProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      clinicName: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
    }) => {
      const res = await api.patch('/clinic/profile', payload);
      return res.data?.data?.clinic;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic', 'profile'] });
    },
  });
}

export function useToggleOnlineConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await api.patch('/clinic/online-consultation', { enabled });
      return res.data?.data?.clinic;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic', 'profile'] });
    },
  });
}

export function useToggleAutoFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await api.patch('/clinic/auto-followup', { enabled });
      return res.data?.data?.clinic;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic', 'profile'] });
    },
  });
}

export function useUploadClinicLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: { uri: string; name?: string; type?: string }) => {
      const formData = new FormData();
      formData.append('photo', {
        uri: photo.uri,
        name: photo.name || 'clinic-logo.jpg',
        type: photo.type || 'image/jpeg',
      } as any);

      const res = await api.post('/clinic/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.data?.clinic;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic', 'profile'] });
    },
  });
}

// ============================================================
// 2. Clinic Daily Dashboard & Live Analytics
// ============================================================

export function useDailyDashboard(date?: string) {
  return useQuery<DailyDashboard>({
    queryKey: ['clinic', 'analytics', 'daily', date ?? 'today'],
    queryFn: async () => {
      try {
        const res = await api.get('/analytics/daily-dashboard', {
          params: date ? { date } : {},
        });
        return (
          res.data?.data?.dashboard ??
          res.data?.dashboard ?? {
            clinicName: '',
            date: date || new Date().toISOString().split('T')[0],
            totalPatients: 0,
            totalAppointments: 0,
            newPatients: 0,
            returningPatients: 0,
            statusBreakdown: {},
            doctorWise: {},
            queueSummary: [],
          }
        );
      } catch {
        return {
          clinicName: '',
          date: date || new Date().toISOString().split('T')[0],
          totalPatients: 0,
          totalAppointments: 0,
          newPatients: 0,
          returningPatients: 0,
          statusBreakdown: {},
          doctorWise: {},
          queueSummary: [],
        };
      }
    },
    staleTime: 15000,
  });
}

// ============================================================
// 3. Clinic Associated Doctors
// ============================================================

export function useClinicDoctors() {
  return useQuery<ClinicDoctor[]>({
    queryKey: ['clinic', 'doctors'],
    queryFn: async () => {
      try {
        const res = await api.get('/clinic/doctors');
        return res.data?.data?.doctors ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

export function useAddDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      specialization?: string;
      qualification?: string;
      experience?: number;
      fee?: number;
      startTime?: string;
    }) => {
      const res = await api.post('/clinic/doctors', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic', 'doctors'] });
      qc.invalidateQueries({ queryKey: ['clinic', 'analytics'] });
    },
  });
}

export function useEditDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      doctorId,
      ...payload
    }: {
      doctorId: string;
      startTime?: string;
      specialization?: string;
      qualification?: string;
      experience?: number;
      fee?: number;
      queueMode?: 'LIVE' | 'PRIVATE' | 'TIME_SLOT';
    }) => {
      const res = await api.patch(`/clinic/doctors/${doctorId}`, payload);
      return res.data?.data?.doctor;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic', 'doctors'] });
    },
  });
}

// ============================================================
// 4. Receptionists & Staff Management
// ============================================================

export function useClinicReceptionists() {
  return useQuery<ClinicReceptionist[]>({
    queryKey: ['clinic', 'receptionists'],
    queryFn: async () => {
      try {
        const res = await api.get('/clinic/receptionists');
        return res.data?.data?.receptionists ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

export function useAddReceptionist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      const res = await api.post('/clinic/receptionists', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic', 'receptionists'] });
    },
  });
}

export function useAssignDoctorsToReceptionist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { receptionistId: string; doctorIds: string[] }) => {
      const res = await api.post('/clinic/receptionists/assign-doctors', payload);
      return res.data?.data?.assignments;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic', 'receptionists'] });
    },
  });
}

export function useChangeStaffPassword() {
  return useMutation({
    mutationFn: async (payload: { userId: string; newPassword: string }) => {
      const res = await api.patch('/clinic/staff/change-password', payload);
      return res.data;
    },
  });
}

// ============================================================
// 5. Working Hours & Holidays
// ============================================================

export function useWorkingHours() {
  return useQuery<WorkingHour[]>({
    queryKey: ['clinic', 'working-hours'],
    queryFn: async () => {
      try {
        const res = await api.get('/clinic/working-hours');
        return res.data?.data?.workingHours ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

export function useSetWorkingHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workingHours: WorkingHour[]) => {
      const res = await api.post('/clinic/working-hours', { workingHours });
      return res.data?.data?.workingHours;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic', 'working-hours'] });
    },
  });
}

export function useHolidays() {
  return useQuery<ClinicHoliday[]>({
    queryKey: ['clinic', 'holidays'],
    queryFn: async () => {
      try {
        const res = await api.get('/clinic/holidays');
        return res.data?.data?.holidays ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

export function useAddHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { date: string; reason?: string }) => {
      const res = await api.post('/clinic/holidays', payload);
      return res.data?.data?.holiday;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic', 'holidays'] });
    },
  });
}

export function useRemoveHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (holidayId: string) => {
      const res = await api.delete(`/clinic/holidays/${holidayId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic', 'holidays'] });
    },
  });
}

// ============================================================
// 6. Doctor Connection Requests (Received & Sent)
// ============================================================

export function useClinicReceivedRequests() {
  return useQuery<SentDoctorRequest[]>({
    queryKey: ['clinic', 'requests', 'received'],
    queryFn: async () => {
      try {
        const res = await api.get('/clinic/requests/received');
        return res.data?.data?.requests ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

export function useClinicSentRequests() {
  return useQuery<SentDoctorRequest[]>({
    queryKey: ['clinic', 'requests', 'sent'],
    queryFn: async () => {
      try {
        const res = await api.get('/doctors/requests/sent');
        return res.data?.data?.requests ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

export function useRespondToDoctorRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      associationId,
      action,
    }: {
      associationId: string;
      action: 'ACCEPT' | 'REJECT';
    }) => {
      const res = await api.patch(`/clinic/requests/${associationId}/respond`, {
        action,
      });
      return res.data?.data?.association;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic', 'doctors'] });
      qc.invalidateQueries({ queryKey: ['clinic', 'requests'] });
      qc.invalidateQueries({ queryKey: ['clinic', 'analytics'] });
    },
  });
}

// ============================================================
// 7. Period Reports & Growth Analytics
// ============================================================

export function usePeriodReport(
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  params?: {
    date?: string;
    month?: string;
    year?: string;
    startDate?: string;
    endDate?: string;
    doctorId?: string;
  }
) {
  return useQuery<PeriodReport>({
    queryKey: ['clinic', 'reports', period, params],
    queryFn: async () => {
      try {
        const res = await api.get(`/reports/${period}`, {
          params: { ...params, format: 'json' },
        });
        return (
          res.data?.data?.report ?? {
            clinicName: '',
            totalAppointments: 0,
            byStatus: {},
            bySource: {},
            byDoctor: {},
            estimatedRevenue: 0,
          }
        );
      } catch {
        return {
          clinicName: '',
          totalAppointments: 0,
          byStatus: {},
          bySource: {},
          byDoctor: {},
          estimatedRevenue: 0,
        };
      }
    },
    staleTime: 30000,
  });
}

export function useGrowthReport(
  granularity: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
  params?: { startDate?: string; endDate?: string }
) {
  return useQuery<GrowthReport>({
    queryKey: ['clinic', 'analytics', 'growth', granularity, params],
    queryFn: async () => {
      try {
        const res = await api.get('/analytics/growth', {
          params: { granularity, ...params },
        });
        return (
          res.data?.data?.analytics ?? {
            clinicName: '',
            granularity,
            startDate: '',
            endDate: '',
            trend: [],
            summary: {
              currentPeriodPatients: 0,
              previousPeriodPatients: 0,
              growthRatePercent: 0,
            },
          }
        );
      } catch {
        return {
          clinicName: '',
          granularity,
          startDate: '',
          endDate: '',
          trend: [],
          summary: {
            currentPeriodPatients: 0,
            previousPeriodPatients: 0,
            growthRatePercent: 0,
          },
        };
      }
    },
    staleTime: 30000,
  });
}

// ============================================================
// 8. Clinic Realtime Notifications
// ============================================================

export function useClinicNotifications() {
  return useQuery<AppNotification[]>({
    queryKey: ['notifications', 'clinic'],
    queryFn: async () => {
      try {
        const res = await api.get('/notifications/me');
        return res.data?.data?.notifications ?? res.data?.notifications ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 15000,
  });
}

export function useClinicUnreadNotificationCount() {
  return useQuery<number>({
    queryKey: ['notifications', 'clinic', 'unread-count'],
    queryFn: async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        return res.data?.data?.count ?? res.data?.count ?? 0;
      } catch {
        return 0;
      }
    },
    staleTime: 15000,
  });
}

export function useMarkClinicNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await api.patch(`/notifications/${notificationId}/read`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllClinicNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.patch('/notifications/read-all');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ============================================================
// 12. Clinic Appointments Management & Reception Booking
// ============================================================

export function useClinicAppointments(filters?: {
  doctorId?: string;
  status?: string;
  date?: string;
  patientId?: string;
}) {
  return useQuery<Appointment[]>({
    queryKey: ['appointments', 'clinic', filters],
    queryFn: async () => {
      try {
        const { data } = await api.get('/appointments/clinic', { params: filters });
        return data?.data?.appointments ?? data?.appointments ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 10000,
  });
}

export function useBookReceptionAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BookReceptionAppointmentInput) => {
      const res = await api.post('/appointments/book/reception', payload);
      return res.data?.data?.appointment ?? res.data?.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['appointments', 'clinic'] });
      qc.invalidateQueries({ queryKey: ['dailyDashboard'] });
      qc.invalidateQueries({
        queryKey: ['doctor', 'queue', variables.doctorId, variables.clinicId, variables.date],
      });
      qc.invalidateQueries({
        queryKey: ['doctor', 'queue', variables.doctorId, variables.clinicId],
      });
    },
  });
}

export function useCancelClinicAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      appointmentId,
      reason,
    }: {
      appointmentId: string;
      reason?: string;
    }) => {
      const { data } = await api.patch(`/appointments/${appointmentId}/cancel`, { reason });
      return data?.data?.appointment ?? data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments', 'clinic'] });
      qc.invalidateQueries({ queryKey: ['dailyDashboard'] });
      qc.invalidateQueries({ queryKey: ['doctor', 'queue'] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: string;
    }) => {
      const { data } = await api.patch(`/appointments/${appointmentId}/status`, { status });
      return data?.data?.appointment ?? data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments', 'clinic'] });
      qc.invalidateQueries({ queryKey: ['dailyDashboard'] });
      qc.invalidateQueries({ queryKey: ['doctor', 'queue'] });
    },
  });
}

