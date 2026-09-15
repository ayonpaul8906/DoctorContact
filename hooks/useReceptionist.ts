import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  Doctor,
  CreateGuestPatientInput,
  BookReceptionAppointmentInput,
  PatientSearchResult,
  DiagnosticCenterLookup,
  SentReferral,
  Appointment,
} from '../types';

// ============================================================
// Receptionist Portal Hooks
//
// Matches backend routes:
//   GET  /receptionist/my-doctors
//   GET  /patient/search
//   POST /patient/guest
//   POST /appointments/book/reception
//   GET  /diagnostic-centers/search
//   POST /test-referrals
//   GET  /test-referrals/sent
//   PATCH /clinic/staff/change-password
//   PATCH /users/me
// ============================================================

function normalizeAssignedDoctor(raw: unknown): Doctor | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  // Already standard Doctor shape
  const objUser = obj.user as Record<string, unknown> | undefined;
  if (objUser?.name && obj.clinic) {
    return obj as unknown as Doctor;
  }

  // Association/junction shape: { doctor: {...}, clinic: {...} }
  if (obj.doctor && typeof obj.doctor === 'object') {
    const doc = obj.doctor as Record<string, unknown>;
    const clinic = obj.clinic as Record<string, unknown> | undefined;
    const docUser = doc.user as Record<string, unknown> | undefined;
    return {
      id: (doc.id ?? obj.doctorId) as string,
      specialization: (doc.specialization ?? null) as string | null,
      qualification: (doc.qualification ?? null) as string | null,
      experience: (doc.experience ?? null) as number | null,
      fee: (doc.fee ?? null) as number | null,
      clinicId: (clinic?.id ?? obj.clinicId ?? '') as string,
      isAvailable: doc.isAvailable as boolean | undefined,
      user: {
        id: (docUser?.id ?? doc.userId ?? doc.id) as string,
        name: (docUser?.name ?? doc.name ?? 'Doctor') as string,
        email: docUser?.email as string | undefined,
        phone: docUser?.phone as string | null | undefined,
        isActive: docUser?.isActive as boolean | undefined,
      },
      clinic: {
        id: (clinic?.id ?? obj.clinicId ?? '') as string,
        clinicName: (clinic?.clinicName ?? obj.clinicName ?? '') as string,
        city: (clinic?.city ?? obj.city ?? null) as string | null,
        address: (clinic?.address ?? obj.address ?? null) as string | null,
      },
    };
  }

  // Flat shape
  if (obj.doctorName || obj.name) {
    return {
      id: (obj.doctorId ?? obj.id) as string,
      specialization: (obj.specialization ?? null) as string | null,
      qualification: (obj.qualification ?? null) as string | null,
      experience: (obj.experience ?? null) as number | null,
      fee: (obj.fee ?? null) as number | null,
      clinicId: (obj.clinicId ?? '') as string,
      isAvailable: obj.isAvailable as boolean | undefined,
      user: {
        id: (obj.userId ?? obj.id) as string,
        name: (obj.doctorName ?? obj.name) as string,
        email: obj.email as string | undefined,
        phone: obj.phone as string | null | undefined,
        isActive: obj.isActive as boolean | undefined,
      },
      clinic: {
        id: (obj.clinicId ?? '') as string,
        clinicName: (obj.clinicName ?? '') as string,
        city: (obj.city ?? null) as string | null,
        address: (obj.address ?? null) as string | null,
      },
    };
  }

  return null;
}

export function useMyAssignedDoctors() {
  return useQuery<Doctor[]>({
    queryKey: ['receptionist', 'my-doctors'],
    queryFn: async () => {
      try {
        const res = await api.get('/receptionist/my-doctors');
        const data = res.data?.data;

        const rawList: unknown[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.doctors)
            ? data.doctors
            : Array.isArray(data?.assignedDoctors)
              ? data.assignedDoctors
              : Array.isArray(res.data?.doctors)
                ? res.data.doctors
                : [];

        return rawList
          .map((raw) => normalizeAssignedDoctor(raw))
          .filter((d): d is Doctor => d !== null);
      } catch (err) {
        if (__DEV__) console.warn('[useMyAssignedDoctors] fetch error:', err);
        return [];
      }
    },
    staleTime: 15000,
  });
}

// ------------------------------------------------------------
// Patient search & guest registration
// ------------------------------------------------------------

export function useSearchPatientByPhone() {
  return useMutation<PatientSearchResult | null, Error, string>({
    mutationFn: async (phone: string) => {
      const res = await api.get('/patient/search', { params: { phone: phone.trim() } });
      const patient = res.data?.data?.patient ?? res.data?.data ?? null;
      return patient as PatientSearchResult | null;
    },
  });
}

export function useCreateGuestPatient() {
  const qc = useQueryClient();
  return useMutation<PatientSearchResult, Error, CreateGuestPatientInput>({
    mutationFn: async (payload: CreateGuestPatientInput) => {
      const res = await api.post('/patient/guest', payload);
      const patient = res.data?.data?.patient ?? res.data?.data;
      return patient as PatientSearchResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receptionist'] });
    },
  });
}

// ------------------------------------------------------------
// Reception booking
// ------------------------------------------------------------

export function useBookReceptionAppointment() {
  const qc = useQueryClient();
  return useMutation<Appointment, Error, BookReceptionAppointmentInput>({
    mutationFn: async (payload: BookReceptionAppointmentInput) => {
      const res = await api.post('/appointments/book/reception', payload);
      const appt = res.data?.data?.appointment ?? res.data?.data;
      return appt as Appointment;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ['doctor', 'queue', variables.doctorId, variables.clinicId, variables.date],
      });
      qc.invalidateQueries({ queryKey: ['appointments', 'clinic'] });
    },
  });
}

// ------------------------------------------------------------
// Diagnostic Centers & Referrals
// ------------------------------------------------------------

export function useSearchDiagnosticCenters() {
  return useMutation<DiagnosticCenterLookup[], Error, string>({
    mutationFn: async (name: string) => {
      try {
        const { data } = await api.get('/diagnostic-centers/search', {
          params: { name: name.trim() },
        });
        return (data?.data?.centers ?? data?.data ?? []) as DiagnosticCenterLookup[];
      } catch {
        return [];
      }
    },
  });
}

export function useCreateReferral() {
  const qc = useQueryClient();
  return useMutation<
    any,
    Error,
    {
      patientId: string;
      diagnosticCenterId: string;
      testNames: string[];
      notes?: string;
      appointmentId?: string;
    }
  >({
    mutationFn: async (payload) => {
      const res = await api.post('/test-referrals', payload);
      return res.data?.data?.referral ?? res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referrals', 'sent'] });
      qc.invalidateQueries({ queryKey: ['referrals'] });
    },
  });
}

export function useSentReferrals() {
  return useQuery<SentReferral[]>({
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

// ------------------------------------------------------------
// Profile & Credentials
// ------------------------------------------------------------

export function useChangeReceptionistPassword() {
  return useMutation<any, Error, { userId: string; newPassword: string }>({
    mutationFn: async (payload) => {
      const res = await api.patch('/clinic/staff/change-password', payload);
      return res.data;
    },
  });
}

export function useUpdateReceptionistProfile() {
  const qc = useQueryClient();
  return useMutation<any, Error, { name?: string; phone?: string; email?: string }>({
    mutationFn: async (payload) => {
      try {
        const res = await api.patch('/users/me', payload);
        return res.data?.data?.user ?? res.data?.data;
      } catch {
        try {
          const res = await api.patch('/auth/me', payload);
          return res.data?.data?.user ?? res.data?.data;
        } catch {
          return payload;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
