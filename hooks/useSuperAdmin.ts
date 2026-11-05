/**
 * Super Admin API hooks for the Doctor Contact mobile app.
 * Fully integrated with live backend endpoints.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  useAdminUsers,
  useAdminClinics,
  useAdminDoctors,
  useAdminBookings,
  useSetFeaturedClinic,
  useSetFeaturedDoctor,
} from './useAdmin';
export * from './useAdmin';

// ─── Announcement Types ────────────────────────────────────────────────────────

export type AnnouncementType =
  | 'GENERAL'
  | 'EMERGENCY'
  | 'MAINTENANCE'
  | 'HOLIDAY'
  | 'CLINIC_CLOSED'
  | 'DOCTOR_ABSENT';

export interface SuperAdminAnnouncement {
  id: string;
  type: AnnouncementType;
  title: string;
  message: string;
  isActive: boolean;
  clinicId?: string | null;
  doctorId?: string | null;
  createdByUserId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAnnouncementInput {
  type?: AnnouncementType;
  title: string;
  message: string;
}

// ─── Super Admin Stats Hook (calls real /admin/stats) ───────────────────────────

export function useSuperAdminStats() {
  return useQuery({
    queryKey: ['superAdmin', 'stats'],
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
          totalBookings: Number(stats?.totalBookings || 0),
          totalAppointments: Number(stats?.totalAppointments || 0),
        };
      } catch (err) {
        console.warn('[SuperAdmin] Failed to load stats:', err);
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
          totalBookings: 0,
          totalAppointments: 0,
        };
      }
    },
    staleTime: 30000,
  });
}

// ─── Announcements Hooks (calls real /announcements/admin) ─────────────────────

export function useSuperAdminAnnouncements() {
  return useQuery<SuperAdminAnnouncement[]>({
    queryKey: ['superAdmin', 'announcements'],
    queryFn: async () => {
      try {
        const res = await api.get('/announcements/admin');
        const data = res.data?.data?.announcements ?? res.data?.announcements ?? res.data?.data ?? res.data ?? [];
        return (Array.isArray(data) ? data : []).map((a: any) => ({
          id: a.id,
          type: a.type || 'GENERAL',
          title: a.title || 'Notice',
          message: a.message || a.content || '',
          isActive: a.isActive !== false,
          clinicId: a.clinicId,
          doctorId: a.doctorId,
          createdByUserId: a.createdByUserId,
          createdAt: a.createdAt || new Date().toISOString(),
          updatedAt: a.updatedAt,
        }));
      } catch (err) {
        console.warn('[SuperAdmin] Failed to load announcements:', err);
        return [];
      }
    },
    staleTime: 30000,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAnnouncementInput) => {
      const payload = {
        type: input.type || 'GENERAL',
        title: input.title,
        message: input.message,
      };
      const res = await api.post('/announcements/admin', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superAdmin', 'announcements'] });
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useToggleAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      // Backend supports PATCH /announcements/admin/:id/deactivate or toggle
      const res = await api.patch(`/announcements/admin/${id}/deactivate`, { isActive }).catch(() => {
        return api.patch(`/announcements/admin/${id}`, { isActive });
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superAdmin', 'announcements'] });
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/announcements/admin/${id}`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superAdmin', 'announcements'] });
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

// ─── Aliases for Super Admin Screens ──────────────────────────────────────────

export {
  useAdminUsers as useSuperAdminUsers,
  useAdminClinics as useSuperAdminClinics,
  useAdminDoctors as useSuperAdminDoctors,
  useAdminBookings as useSuperAdminBookings,
  useSetFeaturedClinic as useToggleFeaturedClinic,
  useSetFeaturedDoctor as useToggleFeaturedDoctor,
};
