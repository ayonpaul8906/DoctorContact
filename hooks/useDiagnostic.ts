/**
 * Diagnostic Center, Diagnostic Staff API hooks.
 * Fully aligned with backend endpoints and webapp contracts.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReferralStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface DiagnosticCenterStats {
  PENDING: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  CANCELLED: number;
  TOTAL: number;
}

export interface DiagnosticCenterProfile {
  id: string;
  userId?: string;
  centerName: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  googleMapsUrl?: string | null;
  authorizationNote?: string | null;
  hasHomeService?: boolean;
  isApproved?: boolean;
  isOnline?: boolean;
  logo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiagnosticStaffMember {
  id: string;
  userId?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    createdAt?: string;
  };
}

export interface DiagnosticTest {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface CenterTest {
  id: string;
  diagnosticCenterId: string;
  testId: string;
  price: number;
  isAvailable: boolean;
  diagnosticTest: DiagnosticTest;
}

export interface WorkingHour {
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface ReferralPatient {
  id?: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  age?: number | null;
  gender?: string | null;
  user?: {
    name?: string;
    phone?: string | null;
    email?: string | null;
  } | null;
}

export interface Referral {
  id: string;
  patientId: string;
  appointmentId?: string | null;
  diagnosticCenterId: string;
  testNames: string[];
  notes?: string | null;
  status: ReferralStatus;
  resultNotes?: string | null;
  referringClinicId?: string | null;
  createdByRole?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  patient?: ReferralPatient | null;
  referringClinic?: {
    id?: string;
    clinicName?: string;
  } | null;
  diagnosticCenter?: {
    id?: string;
    centerName?: string;
    city?: string | null;
    address?: string | null;
    phone?: string | null;
  } | null;
}

export interface DiagnosticStaffProfile {
  id: string;
  diagnosticCenterId: string;
  user?: {
    id?: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
  };
  diagnosticCenter?: {
    id?: string;
    centerName?: string;
    city?: string | null;
    address?: string | null;
    phone?: string | null;
    logo?: string | null;
  };
}

export interface UpdateDiagnosticCenterProfileInput {
  centerName: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  authorizationNote?: string;
  hasHomeService?: boolean;
}

export interface CreateDiagnosticStaffInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface ChangeDiagnosticStaffPasswordInput {
  userId: string;
  newPassword: string;
}

export interface AddCenterTestInput {
  testId: string;
  price: number;
  isAvailable?: boolean;
}

export interface UpdateCenterTestInput {
  price?: number;
  isAvailable?: boolean;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const DC_KEYS = {
  profile: ['diagnostic-center', 'profile'] as const,
  staff: ['diagnostic-center', 'staff'] as const,
  centerTests: ['diagnostic-center', 'center-tests'] as const,
  globalTests: ['diagnostic-center', 'global-tests'] as const,
  workingHours: ['diagnostic-center', 'working-hours'] as const,
  referrals: (params?: any) => ['diagnostic-center', 'referrals', params] as const,
  referralDetail: (id?: string) => ['diagnostic-center', 'referral', id] as const,
  stats: ['referrals', 'stats'] as const,
  staffProfile: ['diagnostic-staff', 'profile'] as const,
};

// ─── Diagnostic Center Hooks ──────────────────────────────────────────────────

export function useDiagnosticCenterProfile() {
  return useQuery<DiagnosticCenterProfile>({
    queryKey: DC_KEYS.profile,
    queryFn: async () => {
      const res = await api.get('/diagnostic-centers/profile');
      return res.data?.data?.center ?? res.data?.data;
    },
    staleTime: 30_000,
  });
}

export function useUpdateDiagnosticCenterProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateDiagnosticCenterProfileInput) => {
      const res = await api.patch('/diagnostic-centers/profile', payload);
      return res.data?.data?.center ?? res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DC_KEYS.profile });
    },
  });
}

export function useUploadCenterLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photoFile: { uri: string; name?: string; type?: string }) => {
      const formData = new FormData();
      formData.append('photo', {
        uri: photoFile.uri,
        name: photoFile.name || 'logo.jpg',
        type: photoFile.type || 'image/jpeg',
      } as any);

      const res = await api.post('/diagnostic-centers/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.data?.center ?? res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DC_KEYS.profile });
    },
  });
}

// ─── Center Tests Management Hooks ────────────────────────────────────────────

export function useCenterTests() {
  return useQuery<CenterTest[]>({
    queryKey: DC_KEYS.centerTests,
    queryFn: async () => {
      const res = await api.get('/diagnostic-centers/tests');
      return res.data?.data?.tests ?? res.data?.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useGlobalTests() {
  return useQuery<DiagnosticTest[]>({
    queryKey: DC_KEYS.globalTests,
    queryFn: async () => {
      const res = await api.get('/diagnostic-centers/global-tests');
      return res.data?.data?.tests ?? res.data?.data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useAddCenterTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddCenterTestInput) => {
      const res = await api.post('/diagnostic-centers/tests', payload);
      return res.data?.data?.test ?? res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DC_KEYS.centerTests });
    },
  });
}

export function useUpdateCenterTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ testId, payload }: { testId: string; payload: UpdateCenterTestInput }) => {
      const res = await api.patch(`/diagnostic-centers/tests/${testId}`, payload);
      return res.data?.data?.test ?? res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DC_KEYS.centerTests });
    },
  });
}

export function useRemoveCenterTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (testId: string) => {
      const res = await api.delete(`/diagnostic-centers/tests/${testId}`);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DC_KEYS.centerTests });
    },
  });
}

// ─── Center Working Hours Hooks ───────────────────────────────────────────────

export function useCenterWorkingHours() {
  return useQuery<WorkingHour[]>({
    queryKey: DC_KEYS.workingHours,
    queryFn: async () => {
      const res = await api.get('/diagnostic-centers/working-hours');
      return res.data?.data?.hours ?? res.data?.data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useUpdateCenterWorkingHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hoursData: WorkingHour[]) => {
      const res = await api.put('/diagnostic-centers/working-hours', { hours: hoursData });
      return res.data?.data?.hours ?? res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DC_KEYS.workingHours });
      qc.invalidateQueries({ queryKey: DC_KEYS.profile });
    },
  });
}

// ─── Staff Management Hooks ───────────────────────────────────────────────────

export function useDiagnosticCenterStaff() {
  return useQuery<DiagnosticStaffMember[]>({
    queryKey: DC_KEYS.staff,
    queryFn: async () => {
      const res = await api.get('/diagnostic-centers/staff');
      return res.data?.data?.staff ?? res.data?.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useAddDiagnosticStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDiagnosticStaffInput) => {
      const res = await api.post('/diagnostic-centers/staff', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DC_KEYS.staff });
    },
  });
}

export function useChangeDiagnosticStaffPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ChangeDiagnosticStaffPasswordInput) => {
      const res = await api.patch('/diagnostic-centers/staff/change-password', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DC_KEYS.staff });
    },
  });
}

// ─── Referrals & Referral Stats Hooks ─────────────────────────────────────────

export function useCenterStats() {
  return useQuery<DiagnosticCenterStats>({
    queryKey: DC_KEYS.stats,
    queryFn: async () => {
      const res = await api.get('/test-referrals/stats');
      return (
        res.data?.data?.stats ??
        res.data?.data ?? {
          PENDING: 0,
          IN_PROGRESS: 0,
          COMPLETED: 0,
          CANCELLED: 0,
          TOTAL: 0,
        }
      );
    },
    staleTime: 15_000,
  });
}

export function useIncomingReferrals(filters: { status?: ReferralStatus; page?: number; limit?: number } = {}) {
  return useQuery<Referral[]>({
    queryKey: DC_KEYS.referrals(filters),
    queryFn: async () => {
      const res = await api.get('/test-referrals/incoming', { params: filters });
      return res.data?.data?.referrals ?? res.data?.data ?? [];
    },
    staleTime: 15_000,
  });
}

export function useReferralDetails(id?: string) {
  return useQuery<Referral>({
    queryKey: DC_KEYS.referralDetail(id),
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/test-referrals/${id}`);
      return res.data?.data?.referral ?? res.data?.data;
    },
  });
}

export function useUpdateReferralStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      resultNotes,
    }: {
      id: string;
      status: ReferralStatus;
      resultNotes?: string;
    }) => {
      const res = await api.patch(`/test-referrals/${id}/status`, { status, resultNotes });
      return res.data?.data?.referral ?? res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diagnostic-center', 'referrals'] });
      qc.invalidateQueries({ queryKey: DC_KEYS.stats });
    },
  });
}

// ─── Diagnostic Staff Portal Hooks ────────────────────────────────────────────

export function useDiagnosticStaffProfile() {
  return useQuery<DiagnosticStaffProfile>({
    queryKey: DC_KEYS.staffProfile,
    queryFn: async () => {
      const res = await api.get('/diagnostic-centers/staff/me');
      return res.data?.data?.profile ?? res.data?.data;
    },
    staleTime: 30_000,
  });
}

export function useUpdateStaffProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name?: string; phone?: string }) => {
      const res = await api.patch('/users/profile', payload);
      return res.data?.data?.user ?? res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DC_KEYS.staffProfile });
    },
  });
}

// Compatibility exports
export const useDiagnosticReferrals = useIncomingReferrals;
export const useDiagnosticStaff = useDiagnosticCenterStaff;
export const useDiagnosticCenterStats = useCenterStats;
export const useDiagnosticStaffStats = useCenterStats;
export const useDiagnosticStaffTests = (status?: string) =>
  useIncomingReferrals(status && status !== 'all' ? { status: status as ReferralStatus } : {});
export const useUpdateTestStatus = useUpdateReferralStatus;
export const useChangeDiagnosticCenterStaffPassword = useChangeDiagnosticStaffPassword;
