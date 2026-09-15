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
  createdAt: string;
}

export interface AdminClinic {
  id: string;
  name: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  isApproved: boolean;
  doctorCount?: number;
  createdAt?: string;
}

export interface AdminDoctor {
  id: string;
  name: string;
  email?: string;
  specialization?: string;
  qualification?: string;
  isVerified: boolean;
  clinic?: string;
  clinicName?: string;
  createdAt?: string;
}

export interface AdminDiagnosticCenter {
  id: string;
  name: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  isApproved?: boolean;
  createdAt?: string;
}

// ============================================================
// 1. Admin Stats
// ============================================================

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/stats');
        return (
          res.data?.data?.stats ??
          res.data?.stats ??
          res.data ?? {
            totalUsers: 0,
            totalPatients: 0,
            totalDoctors: 0,
            verifiedDoctors: 0,
            unverifiedDoctors: 0,
            totalClinics: 0,
            approvedClinics: 0,
            pendingClinics: 0,
            totalDiagnosticCenters: 0,
          }
        );
      } catch {
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

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/users');
        return res.data?.data?.users ?? res.data?.users ?? res.data ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

// ============================================================
// 3. Admin Clinics
// ============================================================

export function useAdminClinics() {
  return useQuery<AdminClinic[]>({
    queryKey: ['admin', 'clinics'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/clinics');
        return res.data?.data?.clinics ?? res.data?.clinics ?? res.data ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

// ============================================================
// 4. Admin Doctors
// ============================================================

export function useAdminDoctors() {
  return useQuery<AdminDoctor[]>({
    queryKey: ['admin', 'doctors'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/doctors');
        return res.data?.data?.doctors ?? res.data?.doctors ?? res.data ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
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
        return (
          res.data?.data?.diagnosticCenters ??
          res.data?.diagnosticCenters ??
          res.data ?? []
        );
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

// ============================================================
// 6. Verify Doctor
// ============================================================

export function useVerifyDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doctorId: string) => {
      const res = await api.put(`/admin/doctors/${doctorId}/verify`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// ============================================================
// 7. Approve Clinic
// ============================================================

export function useApproveClinics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (clinicId: string) => {
      const res = await api.put(`/admin/clinics/${clinicId}/approve`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'clinics'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export const useApproveClinic = useApproveClinics;
