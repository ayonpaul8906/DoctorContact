import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// ============================================================
// Types
// ============================================================

export interface AdminStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  verifiedDoctors: number;
  unverifiedDoctors: number;
  totalClinics: number;
  approvedClinics: number;
  pendingClinics: number;
  totalDiagnosticCenters: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminClinic {
  id: string;
  name: string;
  clinicName?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  isApproved: boolean;
  isFeatured?: boolean;
  featuredOrder?: number;
  doctorCount?: number;
  createdAt?: string;
  user?: {
    id: string;
    email: string;
    phone?: string;
  };
}

export interface AdminDoctor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  fee?: number;
  isVerified: boolean;
  isFeatured?: boolean;
  featuredOrder?: number;
  isAvailableToday?: boolean;
  clinicId?: string;
  clinic?: {
    id: string;
    name: string;
    clinicName?: string;
  };
  clinicName?: string;
  createdAt?: string;
}

export interface AdminDiagnosticCenter {
  id: string;
  name: string;
  centerName?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  isApproved: boolean;
  createdAt?: string;
}

export interface PlatformSettings {
  bookingWindowMinutes?: number;
  maintenanceMode?: boolean;
}

export interface AdminBooking {
  id: string;
  patientName: string;
  doctorName: string;
  clinicName?: string;
  status: string;
  date: string;
  createdAt: string;
  patientPhone?: string;
  queueNumber?: number;
}

export interface CreateClinicInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  clinicName: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface CreateDoctorInput {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  clinicId?: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  fee?: number;
}

export interface CreateAdminInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface CreateDiagnosticCenterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  centerName: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

// ============================================================
// 1. Admin Platform Stats
// ============================================================

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/stats');
        const stats = res.data?.data?.stats ?? res.data?.stats ?? res.data?.data ?? res.data;
        return {
          totalUsers: Number(stats?.totalUsers || 0),
          totalPatients: Number(stats?.totalPatients || 0),
          totalDoctors: Number(stats?.totalDoctors || 0),
          verifiedDoctors: Number(stats?.verifiedDoctors || 0),
          unverifiedDoctors: Number(stats?.unverifiedDoctors || 0),
          totalClinics: Number(stats?.totalClinics || 0),
          approvedClinics: Number(stats?.approvedClinics || 0),
          pendingClinics: Number(stats?.pendingClinics || 0),
          totalDiagnosticCenters: Number(stats?.totalDiagnosticCenters || 0),
        };
      } catch (err) {
        console.warn('[Admin] Failed to load stats:', err);
        return {
          totalUsers: 0,
          totalPatients: 0,
          totalDoctors: 0,
          verifiedDoctors: 0,
          unverifiedDoctors: 0,
          totalClinics: 0,
          approvedClinics: 0,
          pendingClinics: 0,
          totalDiagnosticCenters: 0,
        };
      }
    },
    staleTime: 30000,
  });
}

// ============================================================
// 2. Admin Users
// ============================================================

export function useAdminUsers(params: { role?: string; page?: number; limit?: number } = {}) {
  return useQuery<{ users: AdminUser[]; total: number }>({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/users', { params });
        const data = res.data?.data ?? res.data;
        const rawUsers = data?.users ?? data ?? [];
        const users: AdminUser[] = (Array.isArray(rawUsers) ? rawUsers : []).map((u: any) => ({
          id: u.id,
          name: u.name || 'Unnamed User',
          email: u.email || '',
          role: u.role || 'PATIENT',
          phone: u.phone || '',
          isActive: u.isActive !== false,
          createdAt: u.createdAt || new Date().toISOString(),
        }));
        return {
          users,
          total: Number(data?.total ?? users.length),
        };
      } catch (err) {
        console.warn('[Admin] Failed to load users:', err);
        return { users: [], total: 0 };
      }
    },
    staleTime: 30000,
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const res = await api.patch(`/admin/users/${userId}/status`, { isActive });
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAdminInput) => {
      const res = await api.post('/admin/admins', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// ============================================================
// 3. Admin Clinics
// ============================================================

export function useAdminClinics(params: { isApproved?: boolean; page?: number; limit?: number } = {}) {
  return useQuery<{ clinics: AdminClinic[]; total: number }>({
    queryKey: ['admin', 'clinics', params],
    queryFn: async () => {
      try {
        const queryParams: Record<string, any> = {};
        if (params.isApproved !== undefined) queryParams.isApproved = params.isApproved;
        if (params.page) queryParams.page = params.page;
        if (params.limit) queryParams.limit = params.limit;

        const res = await api.get('/admin/clinics', { params: queryParams });
        const data = res.data?.data ?? res.data;
        const rawClinics = data?.clinics ?? data ?? [];
        const clinics: AdminClinic[] = (Array.isArray(rawClinics) ? rawClinics : []).map((c: any) => ({
          id: c.id,
          name: c.clinicName || c.name || 'Unnamed Clinic',
          clinicName: c.clinicName || c.name,
          city: c.city || '',
          state: c.state || '',
          address: c.address || '',
          phone: c.phone || c.user?.phone || '',
          whatsapp: c.whatsapp || '',
          isApproved: Boolean(c.isApproved),
          isFeatured: Boolean(c.isFeatured),
          featuredOrder: c.featuredOrder ?? 0,
          doctorCount: Number(c.doctorCount ?? c.doctors?.length ?? 0),
          createdAt: c.createdAt || new Date().toISOString(),
          user: c.user,
        }));
        return {
          clinics,
          total: Number(data?.total ?? clinics.length),
        };
      } catch (err) {
        console.warn('[Admin] Failed to load clinics:', err);
        return { clinics: [], total: 0 };
      }
    },
    staleTime: 30000,
  });
}

export function useCreateClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateClinicInput) => {
      const res = await api.post('/admin/clinics', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'clinics'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useApproveClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (clinicId: string) => {
      const res = await api.patch(`/admin/clinics/${clinicId}/approve`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'clinics'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useRevokeClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (clinicId: string) => {
      const res = await api.patch(`/admin/clinics/${clinicId}/revoke`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'clinics'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useSetFeaturedClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clinicId, isFeatured, featuredOrder }: { clinicId: string; isFeatured: boolean; featuredOrder?: number }) => {
      const res = await api.patch(`/clinic/${clinicId}/featured`, {
        isFeatured,
        featuredOrder: featuredOrder ?? 0,
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'clinics'] });
    },
  });
}

// ============================================================
// 4. Admin Doctors
// ============================================================

export function useAdminDoctors(options: { unverifiedOnly?: boolean } = {}) {
  return useQuery<AdminDoctor[]>({
    queryKey: ['admin', 'doctors', options],
    queryFn: async () => {
      try {
        if (options.unverifiedOnly) {
          const res = await api.get('/admin/doctors/unverified');
          const data = res.data?.data?.doctors ?? res.data?.doctors ?? res.data?.data ?? res.data ?? [];
          return (Array.isArray(data) ? data : []).map(formatDoctor);
        }

        // Fetch all doctors from public/admin doctors endpoint
        const res = await api.get('/doctors?limit=100');
        const data = res.data?.data?.doctors ?? res.data?.doctors ?? res.data?.data ?? res.data ?? [];
        return (Array.isArray(data) ? data : []).map(formatDoctor);
      } catch (err) {
        console.warn('[Admin] Failed to load doctors:', err);
        return [];
      }
    },
    staleTime: 30000,
  });
}

function formatDoctor(d: any): AdminDoctor {
  return {
    id: d.id,
    name: d.name || 'Dr. Unknown',
    email: d.email || d.user?.email || '',
    phone: d.phone || d.user?.phone || '',
    specialization: d.specialization || d.speciality || 'General Medicine',
    qualification: d.qualification || d.qualifications || '',
    experience: d.experience ? Number(d.experience) : undefined,
    fee: d.fee ? Number(d.fee) : undefined,
    isVerified: Boolean(d.isVerified),
    isFeatured: Boolean(d.isFeatured),
    featuredOrder: d.featuredOrder ?? 0,
    isAvailableToday: d.isAvailableToday !== false,
    clinicId: d.clinicId || d.clinic?.id,
    clinic: d.clinic,
    clinicName: d.clinic?.clinicName || d.clinic?.name || d.clinicName || '',
    createdAt: d.createdAt || new Date().toISOString(),
  };
}

export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDoctorInput) => {
      const res = await api.post('/admin/doctors', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useVerifyDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doctorId: string) => {
      const res = await api.patch(`/admin/doctors/${doctorId}/verify`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useSetFeaturedDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ doctorId, isFeatured, featuredOrder }: { doctorId: string; isFeatured: boolean; featuredOrder?: number }) => {
      const res = await api.patch(`/admin/doctors/${doctorId}/featured`, {
        isFeatured,
        featuredOrder: featuredOrder ?? 0,
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
    },
  });
}

export function useToggleDoctorAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ doctorId, isAvailable }: { doctorId: string; isAvailable: boolean }) => {
      const res = await api.patch(`/doctors/${doctorId}/available`, { isAvailable });
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
    },
  });
}

// ============================================================
// 5. Admin Diagnostic Centers
// ============================================================

export function useAdminDiagnosticCenters() {
  return useQuery<AdminDiagnosticCenter[]>({
    queryKey: ['admin', 'diagnostic-centers'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/diagnostic-centers');
        const data = res.data?.data?.centers ?? res.data?.centers ?? res.data?.data ?? res.data ?? [];
        return (Array.isArray(data) ? data : []).map((c: any) => ({
          id: c.id,
          name: c.centerName || c.name || 'Diagnostic Lab',
          centerName: c.centerName || c.name,
          city: c.city || '',
          state: c.state || '',
          address: c.address || '',
          phone: c.phone || '',
          isApproved: Boolean(c.isApproved),
          createdAt: c.createdAt || new Date().toISOString(),
        }));
      } catch (err) {
        console.warn('[Admin] Failed to load diagnostic centers:', err);
        return [];
      }
    },
    staleTime: 30000,
  });
}

export function useCreateDiagnosticCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDiagnosticCenterInput) => {
      const res = await api.post('/admin/diagnostic-centers', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'diagnostic-centers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useApproveDiagnosticCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (centerId: string) => {
      const res = await api.patch(`/admin/diagnostic-centers/${centerId}/approve`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'diagnostic-centers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useRevokeDiagnosticCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (centerId: string) => {
      const res = await api.patch(`/admin/diagnostic-centers/${centerId}/revoke`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'diagnostic-centers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// ============================================================
// 6. Platform Settings & Global Bookings
// ============================================================

export function usePlatformSettings() {
  return useQuery<PlatformSettings>({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/settings');
        return res.data?.data?.settings ?? res.data?.settings ?? res.data?.data ?? { bookingWindowMinutes: 30 };
      } catch (err) {
        console.warn('[Admin] Failed to load settings:', err);
        return { bookingWindowMinutes: 30 };
      }
    },
    staleTime: 60000,
  });
}

export function useUpdatePlatformSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { bookingWindowMinutes?: number }) => {
      const res = await api.patch('/admin/settings', payload);
      return res.data?.data?.settings ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });
}

export function useAdminBookings(params: { clinicId?: string; status?: string; page?: number; limit?: number } = {}) {
  return useQuery<{ items: AdminBooking[]; total: number }>({
    queryKey: ['admin', 'bookings', params],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/bookings', { params });
        const data = res.data?.data ?? res.data;
        const rawItems = data?.items ?? data ?? [];
        const items: AdminBooking[] = (Array.isArray(rawItems) ? rawItems : []).map((b: any) => ({
          id: b.id,
          patientName: b.patientName || b.patient?.name || 'Patient',
          doctorName: b.doctorName || b.doctor?.name || 'Doctor',
          clinicName: b.clinicName || b.clinic?.name || '',
          status: b.status || 'CONFIRMED',
          date: b.date || b.appointmentDate || b.createdAt,
          createdAt: b.createdAt || new Date().toISOString(),
          patientPhone: b.patientPhone || b.patient?.phone,
          queueNumber: b.queueNumber,
        }));
        return {
          items,
          total: Number(data?.total ?? items.length),
        };
      } catch (err) {
        console.warn('[Admin] Failed to load bookings:', err);
        return { items: [], total: 0 };
      }
    },
    staleTime: 30000,
  });
}

// Aliases for compatibility
export const useApproveClinics = useApproveClinic;
