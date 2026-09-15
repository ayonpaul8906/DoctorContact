import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import type {
  Doctor,
  DoctorRequest,
  DoctorLeave,
  DoctorQueue,
  DashboardStats,
  ClinicSearchResult,
  DoctorPatientRecord,
  DayOfWeek,
} from '../types';

// ============================================================
// 1. Doctor Dashboard Stats
// GET /dashboard/doctor
// ============================================================
export function useDoctorDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ['doctor', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard/doctor');
      return res.data?.data?.stats ?? res.data?.data ?? {};
    },
    staleTime: 15000,
  });
}

// ============================================================
// 2. Doctor Search Clinics
// GET /doctors/clinics/search?name={name}
// ============================================================
export function useSearchClinics(name?: string) {
  return useQuery<ClinicSearchResult[]>({
    queryKey: ['doctor', 'clinics', 'search', name ?? ''],
    queryFn: async () => {
      const res = await api.get('/doctors/clinics/search', {
        params: name ? { name } : {},
      });
      return res.data?.data?.clinics ?? [];
    },
    staleTime: 60000,
  });
}

// ============================================================
// 3. Received Requests (to determine accepted clinics)
// GET /doctors/requests/received
// ============================================================
export function useDoctorReceivedRequests() {
  return useQuery<DoctorRequest[]>({
    queryKey: ['doctor', 'requests', 'received'],
    queryFn: async () => {
      try {
        const res = await api.get('/doctors/requests/received');
        return res.data?.data?.requests ?? res.data?.requests ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

// ============================================================
// 4. Sent Requests (to determine accepted clinics)
// GET /doctors/requests/sent
// ============================================================
export function useDoctorSentRequests() {
  return useQuery<DoctorRequest[]>({
    queryKey: ['doctor', 'requests', 'sent'],
    queryFn: async () => {
      try {
        const res = await api.get('/doctors/requests/sent');
        return res.data?.data?.requests ?? res.data?.requests ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

// ============================================================
// 5. Doctor Live Queue
// GET /queue/:doctorId/:clinicId/:date/:scheduleId
// ============================================================
export function useDoctorQueue(
  doctorId: string,
  clinicId: string,
  date: string,
  scheduleId?: string
) {
  const queryClient = useQueryClient();
  const queryKey = ['doctor', 'queue', doctorId, clinicId, date, scheduleId];

  useEffect(() => {
    if (!doctorId || !clinicId) return;

    let activeSocket: any = null;
    let isMounted = true;

    async function setupSocket() {
      try {
        activeSocket = await getSocket();
        if (!isMounted) return;

        function join() {
          activeSocket.emit('joinQueue', { doctorId, clinicId });
        }

        function refetch() {
          queryClient.invalidateQueries({ queryKey });
          queryClient.invalidateQueries({ queryKey: ['doctor', 'dashboard'] });
        }

        if (!activeSocket.connected) {
          activeSocket.connect();
        } else {
          join();
        }

        activeSocket.on('connect', join);
        activeSocket.on('queueUpdate', refetch);
        activeSocket.on('tokenCalled', refetch);
        activeSocket.on('appointmentCompleted', refetch);
        activeSocket.on('doctorDelay', refetch);
      } catch (err) {
        if (__DEV__) console.warn('[QueueSocket] init error:', err);
      }
    }

    setupSocket();

    return () => {
      isMounted = false;
      if (activeSocket) {
        activeSocket.emit('leaveQueue', { doctorId, clinicId });
        activeSocket.off('queueUpdate');
        activeSocket.off('tokenCalled');
        activeSocket.off('appointmentCompleted');
        activeSocket.off('doctorDelay');
      }
    };
  }, [doctorId, clinicId, date, scheduleId, queryClient]);

  return useQuery<DoctorQueue>({
    queryKey,
    enabled: Boolean(doctorId && clinicId && date && scheduleId),
    queryFn: async () => {
      try {
        const url = scheduleId
          ? `/queue/${doctorId}/${clinicId}/${date}/${scheduleId}`
          : `/queue/${doctorId}/${clinicId}/${date}`;
        const res = await api.get(url);
        return (
          res.data?.data?.queue ??
          res.data?.data ?? {
            doctorId,
            clinicId,
            date,
            scheduleId,
            currentToken: 0,
            lastTokenIssued: 0,
            status: 'OPEN',
            tokens: [],
          }
        );
      } catch {
        return {
          doctorId,
          clinicId,
          date,
          scheduleId,
          currentToken: 0,
          lastTokenIssued: 0,
          status: 'CLOSED',
          tokens: [],
        };
      }
    },
    staleTime: 5000,
  });
}

// ============================================================
// 6. Queue Action Mutations
// ============================================================
function useQueueAction(actionPath: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      doctorId,
      clinicId,
      date,
      scheduleId,
      body,
    }: {
      doctorId: string;
      clinicId: string;
      date: string;
      scheduleId?: string;
      body?: Record<string, unknown>;
    }) => {
      const url = scheduleId
        ? `/queue/${doctorId}/${clinicId}/${date}/${scheduleId}/${actionPath}`
        : `/queue/${doctorId}/${clinicId}/${date}/${actionPath}`;
      const res =
        actionPath === 'emergency'
          ? await api.post(url, body ?? {})
          : await api.patch(url, body);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: [
          'doctor',
          'queue',
          variables.doctorId,
          variables.clinicId,
          variables.date,
          variables.scheduleId,
        ],
      });
      qc.invalidateQueries({
        queryKey: [
          'doctor',
          'queue',
          variables.doctorId,
          variables.clinicId,
          variables.date,
        ],
      });
      qc.invalidateQueries({ queryKey: ['doctor', 'dashboard'] });
    },
  });
}

export function useQueueNext() {
  return useQueueAction('next');
}

export function useQueuePrevious() {
  return useQueueAction('previous');
}

export function useQueueSkip() {
  return useQueueAction('skip');
}

export function useQueueRecall() {
  return useQueueAction('recall');
}

export function useQueuePause() {
  return useQueueAction('pause');
}

export function useQueueResume() {
  return useQueueAction('resume');
}

export function useQueueClose() {
  return useQueueAction('close');
}

export function useQueueReopen() {
  return useQueueAction('reopen');
}

export function useQueueEmergency() {
  return useQueueAction('emergency');
}

// ============================================================
// 7. Notify Delay
// POST /doctors/:doctorId/clinics/:clinicId/delay
// ============================================================
export function useNotifyDoctorDelay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      doctorId,
      clinicId,
      delayMinutes,
    }: {
      doctorId: string;
      clinicId: string;
      delayMinutes: number;
    }) => {
      const res = await api.post(
        `/doctors/${doctorId}/clinics/${clinicId}/delay`,
        { delayMinutes }
      );
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ['doctor', 'queue', variables.doctorId, variables.clinicId],
      });
    },
  });
}

// ============================================================
// 8. Doctor Patients List
// GET /doctors/patients
// ============================================================
export type PatientsQueryParams = {
  search?: string;
  clinicId?: string;
  page?: number;
  limit?: number;
};

export type PatientsApiResponse = {
  patients: DoctorPatientRecord[];
  total: number;
  page: number;
  limit: number;
};

export function useDoctorPatients(params?: PatientsQueryParams) {
  return useQuery<PatientsApiResponse>({
    queryKey: [
      'doctor',
      'patients',
      params?.search ?? '',
      params?.clinicId ?? '',
      params?.page ?? 1,
      params?.limit ?? 10,
    ],
    queryFn: async () => {
      try {
        const res = await api.get('/doctors/patients', { params });
        return (
          res.data?.data ?? {
            patients: [],
            total: 0,
            page: params?.page ?? 1,
            limit: params?.limit ?? 10,
          }
        );
      } catch {
        return {
          patients: [],
          total: 0,
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
        };
      }
    },
    staleTime: 30000,
  });
}

// ============================================================
// 9. Doctor Schedule & Leaves
// GET /doctors/:doctorId/clinics/:clinicId/leave
// POST /doctors/:doctorId/clinics/:clinicId/leave
// DELETE /doctors/:doctorId/clinics/:clinicId/leave?date={date}
// PATCH /doctors/:doctorId/clinics/:clinicId/consultation-time
// ============================================================
export function useDoctorLeaves(doctorId: string, clinicId: string) {
  return useQuery<DoctorLeave[]>({
    queryKey: ['doctor', 'leaves', doctorId, clinicId],
    queryFn: async () => {
      try {
        const res = await api.get(`/doctors/${doctorId}/clinics/${clinicId}/leave`);
        return res.data?.data?.leaves ?? res.data?.leaves ?? [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(doctorId && clinicId),
    staleTime: 30000,
  });
}

export function useMarkDoctorLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      doctorId,
      clinicId,
      date,
      reason,
    }: {
      doctorId: string;
      clinicId: string;
      date: string;
      reason?: string;
    }) => {
      const payload: { date: string; reason?: string } = { date };
      if (reason) payload.reason = reason;
      const res = await api.post(
        `/doctors/${doctorId}/clinics/${clinicId}/leave`,
        payload
      );
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ['doctor', 'leaves', variables.doctorId, variables.clinicId],
      });
    },
  });
}

export function useCancelDoctorLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      doctorId,
      clinicId,
      date,
    }: {
      doctorId: string;
      clinicId: string;
      date: string;
    }) => {
      const res = await api.delete(
        `/doctors/${doctorId}/clinics/${clinicId}/leave`,
        { params: { date } }
      );
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ['doctor', 'leaves', variables.doctorId, variables.clinicId],
      });
    },
  });
}

export function useUpdateConsultationTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      doctorId,
      clinicId,
      avgConsultationMinutes,
    }: {
      doctorId: string;
      clinicId: string;
      avgConsultationMinutes: number;
    }) => {
      const res = await api.patch(
        `/doctors/${doctorId}/clinics/${clinicId}/consultation-time`,
        { avgConsultationMinutes }
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', 'dashboard'] });
    },
  });
}

// ============================================================
// 10. Doctor Prescriptions
// GET /doctors/prescriptions
// POST /doctors/prescriptions
// ============================================================
export function useDoctorPrescriptions(params?: {
  patientId?: string;
  clinicId?: string;
}) {
  return useQuery<import('../types').DoctorPrescription[]>({
    queryKey: [
      'doctor',
      'prescriptions',
      params?.patientId ?? '',
      params?.clinicId ?? '',
    ],
    queryFn: async () => {
      try {
        const res = await api.get('/doctors/prescriptions', { params });
        return res.data?.data?.prescriptions ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

export function useCreateDoctorPrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      patientId: string;
      clinicId: string;
      diagnosis: string;
      items: {
        medicineName: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string | null;
      }[];
      notes?: string | null;
    }) => {
      const res = await api.post('/doctors/prescriptions', payload);
      return res.data.data.prescription as import('../types').DoctorPrescription;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', 'prescriptions'] });
    },
  });
}

// ============================================================
// 11. Doctor Requests (Incoming & Outgoing Clinic Connections)
// PATCH /doctors/requests/:associationId/respond
// POST /doctors/clinic-requests
// PATCH /doctors/associations/:associationId/cancel
// ============================================================
export function useRespondDoctorRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      associationId,
      action,
    }: {
      associationId: string;
      action: 'ACCEPT' | 'REJECT';
    }) => {
      const res = await api.patch(
        `/doctors/requests/${associationId}/respond`,
        { action }
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', 'requests'] });
      qc.invalidateQueries({ queryKey: ['doctor', 'dashboard'] });
    },
  });
}

export function useDoctorSendClinicRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      clinicId: string;
      fee?: number;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
    }) => {
      const body: Record<string, unknown> = {
        clinicId: payload.clinicId,
        dayOfWeek: payload.dayOfWeek,
        startTime: payload.startTime,
        endTime: payload.endTime,
      };
      if (payload.fee !== undefined) body.fee = payload.fee;
      const res = await api.post('/doctors/clinic-requests', body);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', 'requests', 'sent'] });
    },
  });
}

export function useCancelAssociation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (associationId: string) => {
      const res = await api.patch(
        `/doctors/associations/${associationId}/cancel`
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', 'requests'] });
    },
  });
}

// ============================================================
// 12. Test Referrals
// GET /test-referrals/sent
// POST /test-referrals
// GET /patient/search?phone={phone}
// GET /diagnostic-centers/search?name={name}
// ============================================================
export function useSentReferrals() {
  return useQuery<import('../types').SentReferral[]>({
    queryKey: ['referrals', 'sent'],
    queryFn: async () => {
      try {
        const res = await api.get('/test-referrals/sent');
        return (
          res.data?.data?.referrals ??
          res.data?.data ??
          res.data?.referrals ??
          []
        );
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

export function useCreateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      patientId: string;
      diagnosticCenterId: string;
      testNames: string[];
      notes?: string;
      appointmentId?: string;
    }) => {
      const res = await api.post('/test-referrals', payload);
      return res.data?.data?.referral ?? res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referrals', 'sent'] });
    },
  });
}

export function useSearchPatientByPhone() {
  return useMutation({
    mutationFn: async (phone: string) => {
      try {
        const { data } = await api.get('/patient/search', {
          params: { phone },
        });
        return (data?.data?.patient ?? data?.data ?? null) as
          | import('../types').PatientLookup
          | null;
      } catch {
        return null;
      }
    },
  });
}

export function useSearchDiagnosticCenters() {
  return useMutation({
    mutationFn: async (name: string) => {
      try {
        const { data } = await api.get('/diagnostic-centers/search', {
          params: { name },
        });
        return (data?.data?.centers ?? data?.data ?? []) as
          | import('../types').DiagnosticCenterLookup[];
      } catch {
        return [];
      }
    },
  });
}

// ============================================================
// 13. Doctor Earnings
// GET /doctors/earnings?period={period}&clinicId={clinicId}
// ============================================================
export function useDoctorEarnings(params?: {
  period?: string;
  startDate?: string;
  endDate?: string;
  clinicId?: string;
}) {
  return useQuery<import('../types').DoctorEarningsSummary>({
    queryKey: [
      'doctor',
      'earnings',
      params?.period ?? 'monthly',
      params?.clinicId ?? '',
    ],
    queryFn: async () => {
      try {
        const res = await api.get('/doctors/earnings', { params });
        return (
          res.data?.data?.earnings ?? {
            period: (params?.period as any) ?? 'monthly',
            totalEarnings: 0,
            totalConsultations: 0,
            clinicBreakdown: [],
          }
        );
      } catch {
        return {
          period: (params?.period as any) ?? 'monthly',
          totalEarnings: 0,
          totalConsultations: 0,
          clinicBreakdown: [],
        };
      }
    },
    staleTime: 60000,
  });
}

// ============================================================
// 14. Notifications
// GET /notifications/me
// GET /notifications/unread-count
// PATCH /notifications/:id/read
// PATCH /notifications/read-all
// ============================================================
export function useDoctorNotifications() {
  return useQuery<import('../types').AppNotification[]>({
    queryKey: ['notifications', 'me'],
    queryFn: async () => {
      try {
        const res = await api.get('/notifications/me');
        return res.data?.data?.items ?? res.data?.data ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 15000,
  });
}

export function useDoctorUnreadNotificationCount() {
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        return res.data?.data?.count ?? 0;
      } catch {
        return 0;
      }
    },
    staleTime: 15000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

