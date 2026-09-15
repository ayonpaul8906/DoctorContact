/**
 * Super Admin API hooks for the Doctor Contact mobile app.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SuperAdminStats {
  totalUsers: number;
  totalDoctors: number;
  totalClinics: number;
  totalDiagnosticCenters: number;
  totalBookings: number;
  totalAppointments: number;
  totalPatients: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  isActive: boolean;
}

export interface SuperAdminClinic {
  id: string;
  name: string;
  city: string;
  phone?: string;
  isApproved: boolean;
  isFeatured?: boolean;
  doctorCount?: number;
  createdAt: string;
}

export interface SuperAdminDoctor {
  id: string;
  name: string;
  specialization?: string;
  isVerified: boolean;
  isFeatured?: boolean;
  clinicName?: string;
  createdAt: string;
}

export interface SuperAdminBooking {
  id: string;
  patientName: string;
  doctorName: string;
  clinicName?: string;
  status: string;
  date: string;
  createdAt: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

const KEYS = {
  stats: ['superAdmin', 'stats'] as const,
  announcements: ['superAdmin', 'announcements'] as const,
  users: ['superAdmin', 'users'] as const,
  clinics: ['superAdmin', 'clinics'] as const,
  doctors: ['superAdmin', 'doctors'] as const,
  bookings: ['superAdmin', 'bookings'] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSuperAdminStats() {
  return useQuery<SuperAdminStats>({
    queryKey: KEYS.stats,
    queryFn: async () => {
      const res = await api.get('/super-admin/stats');
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useSuperAdminAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: KEYS.announcements,
    queryFn: async () => {
      const res = await api.get('/super-admin/announcements');
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAnnouncementInput) => {
      const res = await api.post('/super-admin/announcements', input);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.announcements });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/super-admin/announcements/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.announcements });
    },
  });
}

export function useSuperAdminUsers() {
  return useQuery<any[]>({
    queryKey: KEYS.users,
    queryFn: async () => {
      const res = await api.get('/super-admin/users');
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useSuperAdminClinics() {
  return useQuery<SuperAdminClinic[]>({
    queryKey: KEYS.clinics,
    queryFn: async () => {
      const res = await api.get('/super-admin/clinics');
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useSuperAdminDoctors() {
  return useQuery<SuperAdminDoctor[]>({
    queryKey: KEYS.doctors,
    queryFn: async () => {
      const res = await api.get('/super-admin/doctors');
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useSuperAdminBookings() {
  return useQuery<SuperAdminBooking[]>({
    queryKey: KEYS.bookings,
    queryFn: async () => {
      const res = await api.get('/super-admin/bookings');
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useToggleFeaturedDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ doctorId, featured }: { doctorId: string; featured: boolean }) => {
      const res = await api.put(`/super-admin/doctors/${doctorId}/featured`, { featured });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.doctors });
    },
  });
}

export function useToggleFeaturedClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clinicId, featured }: { clinicId: string; featured: boolean }) => {
      const res = await api.put(`/super-admin/clinics/${clinicId}/featured`, { featured });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.clinics });
    },
  });
}
