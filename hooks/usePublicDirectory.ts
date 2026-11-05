import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Doctor, Clinic } from '../types';

export interface PublicDoctor extends Doctor {
  rating?: number;
  reviewCount?: number;
  avatar?: string;
  profilePhoto?: string | null;
  image?: string | null;
  imageKey?: string;
  isAvailable?: boolean;
  medicalSystem?: string | null;
  specializations?: any[];
}

export interface PublicClinic extends Clinic {
  specialties?: string[];
  doctorsCount?: number;
  rating?: number;
  reviewCount?: number;
  image?: string | null;
  imageKey?: string;
  isAvailable?: boolean;
  whatsapp?: string;
  googleMapsUrl?: string;
  mapUrl?: string;
}

function unwrapDoctors(res: { data?: unknown }): PublicDoctor[] {
  const data = res.data as any;
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.doctors)) return data.doctors;
  if (data.data) {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.data.doctors)) return data.data.doctors;
  }
  return [];
}

function unwrapClinics(res: { data?: unknown }): PublicClinic[] {
  const data = res.data as any;
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.clinics)) return data.clinics;
  if (data.data) {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.data.clinics)) return data.data.clinics;
  }
  return [];
}

// ============================================================
// 1. FEATURED DOCTORS (Top Rated & Verified Specialists - 3 Doctors)
// ============================================================
export const FALLBACK_FEATURED_DOCTORS: PublicDoctor[] = [
  {
    id: 'feat-doc-1',
    specialization: 'Cardiologist',
    qualification: 'MBBS, MD (Cardiology), FACC',
    experience: 14,
    fee: 700,
    clinicId: 'clinic-1',
    rating: 4.9,
    reviewCount: 184,
    imageKey: 'doc1',
    user: {
      name: 'Dr. Sourav Ganguly',
      email: 'dr.sourav@doctorcontact.com',
      phone: '+919876543210',
    },
    clinic: {
      id: 'clinic-1',
      clinicName: 'Apollo Care Clinic',
      city: 'Dubrajpur',
      address: 'Station Road, Ward 4',
    },
  },
  {
    id: 'feat-doc-2',
    specialization: 'Dermatologist',
    qualification: 'MBBS, DDVL, MD (Dermatology)',
    experience: 9,
    fee: 550,
    clinicId: 'clinic-2',
    rating: 4.8,
    reviewCount: 142,
    imageKey: 'doc3',
    user: {
      name: 'Dr. Ananya Roy',
      email: 'dr.ananya@doctorcontact.com',
      phone: '+919876543211',
    },
    clinic: {
      id: 'clinic-2',
      clinicName: 'Skin & Cure Polyclinic',
      city: 'Suri',
      address: 'Main Bazaar Road',
    },
  },
  {
    id: 'feat-doc-3',
    specialization: 'Pediatrician',
    qualification: 'MBBS, DCH, MD (Pediatrics)',
    experience: 16,
    fee: 600,
    clinicId: 'clinic-3',
    rating: 4.9,
    reviewCount: 210,
    imageKey: 'doc4',
    user: {
      name: 'Dr. Rajesh Mukherjee',
      email: 'dr.rajesh@doctorcontact.com',
      phone: '+919876543212',
    },
    clinic: {
      id: 'clinic-3',
      clinicName: 'Mother & Child Hospital',
      city: 'Bolpur',
      address: 'Shantiniketan Bypass',
    },
  },
];

// ============================================================
// 2. ALL DOCTORS (Wide Directory of Doctors Across All Specialties)
// ============================================================
export const FALLBACK_ALL_DOCTORS: PublicDoctor[] = [
  {
    id: 'all-doc-1',
    specialization: 'Neurologist',
    qualification: 'MBBS, DM (Neurology)',
    experience: 11,
    fee: 800,
    clinicId: 'clinic-1',
    rating: 4.9,
    reviewCount: 95,
    imageKey: 'hero',
    user: {
      name: 'Dr. Amitava Sen',
      email: 'dr.amitava@doctorcontact.com',
      phone: '+919876543220',
    },
    clinic: {
      id: 'clinic-1',
      clinicName: 'Neuro Health Care',
      city: 'Kolkata',
      address: 'Park Circus Avenue',
    },
  },
  {
    id: 'all-doc-2',
    specialization: 'Gynecologist',
    qualification: 'MBBS, DGO, MS (OBG)',
    experience: 10,
    fee: 500,
    clinicId: 'clinic-2',
    rating: 4.8,
    reviewCount: 130,
    imageKey: 'doc3',
    user: {
      name: 'Dr. Sneha Banerjee',
      email: 'dr.sneha@doctorcontact.com',
      phone: '+919876543221',
    },
    clinic: {
      id: 'clinic-2',
      clinicName: 'Apex Woman Care',
      city: 'Suri',
      address: 'Rabindra Pally',
    },
  },
  {
    id: 'all-doc-3',
    specialization: 'General Physician',
    qualification: 'MBBS, MD (Medicine)',
    experience: 8,
    fee: 400,
    clinicId: 'clinic-3',
    rating: 4.7,
    reviewCount: 160,
    imageKey: 'doc1',
    user: {
      name: 'Dr. Subhashis Ghosh',
      email: 'dr.subhashis@doctorcontact.com',
      phone: '+919876543222',
    },
    clinic: {
      id: 'clinic-3',
      clinicName: 'Dewasi Health Chamber',
      city: 'Dubrajpur',
      address: 'Cinema Hall Road',
    },
  },
  {
    id: 'all-doc-4',
    specialization: 'Dentist',
    qualification: 'BDS, MDS (Orthodontics)',
    experience: 7,
    fee: 450,
    clinicId: 'clinic-4',
    rating: 4.8,
    reviewCount: 88,
    imageKey: 'doc4',
    user: {
      name: 'Dr. Pooja Bhattacharya',
      email: 'dr.pooja@doctorcontact.com',
      phone: '+919876543223',
    },
    clinic: {
      id: 'clinic-4',
      clinicName: 'Smile Dental Clinic',
      city: 'Bolpur',
      address: 'Shantiniketan Road',
    },
  },
  {
    id: 'all-doc-5',
    specialization: 'ENT Specialist',
    qualification: 'MBBS, MS (ENT)',
    experience: 13,
    fee: 550,
    clinicId: 'clinic-5',
    rating: 4.8,
    reviewCount: 114,
    imageKey: 'hero',
    user: {
      name: 'Dr. Kaushik Paul',
      email: 'dr.kaushik@doctorcontact.com',
      phone: '+919876543224',
    },
    clinic: {
      id: 'clinic-5',
      clinicName: 'Care Polyclinic',
      city: 'Rampurhat',
      address: 'Main Market Area',
    },
  },
  {
    id: 'all-doc-6',
    specialization: 'Homeopathy',
    medicalSystem: 'HOMEOPATHY',
    qualification: 'BHMS, MD (Homeopathy)',
    experience: 15,
    fee: 350,
    clinicId: 'clinic-6',
    rating: 4.9,
    reviewCount: 205,
    imageKey: 'doc3',
    user: {
      name: 'Dr. Barnali Dutta',
      email: 'dr.barnali@doctorcontact.com',
      phone: '+919876543225',
    },
    clinic: {
      id: 'clinic-6',
      clinicName: 'Nature Care Clinic',
      city: 'Dubrajpur',
      address: 'Post Office Lane',
    },
  },
  {
    id: 'all-doc-7',
    specialization: 'Ayurveda Specialist',
    medicalSystem: 'AYURVEDA',
    qualification: 'BAMS, MD (Ayurveda), Panchakarma',
    experience: 12,
    fee: 400,
    clinicId: 'clinic-1',
    rating: 4.9,
    reviewCount: 178,
    imageKey: 'hero',
    user: {
      name: 'Dr. Debabrata Roy',
      email: 'dr.debabrata@doctorcontact.com',
      phone: '+919876543226',
    },
    clinic: {
      id: 'clinic-1',
      clinicName: 'AyurVeda Wellness Chamber',
      city: 'Dubrajpur',
      address: 'Station Road, Near Bus Stand',
    },
  },
  {
    id: 'all-doc-8',
    specialization: 'Ayurvedic Physician',
    medicalSystem: 'AYURVEDA',
    qualification: 'BAMS (Ayurvedic Medicine)',
    experience: 8,
    fee: 350,
    clinicId: 'clinic-2',
    rating: 4.8,
    reviewCount: 112,
    imageKey: 'doc1',
    user: {
      name: 'Dr. Priya Sharma',
      email: 'dr.priya@doctorcontact.com',
      phone: '+919876543227',
    },
    clinic: {
      id: 'clinic-2',
      clinicName: 'Shree Ram Polyclinic',
      city: 'Suri',
      address: 'Rabindra Pally Main Road',
    },
  },
];

// ============================================================
// 3. FEATURED CLINICS (Top Chambers with Verified Facilities)
// ============================================================
export const FALLBACK_FEATURED_CLINICS: PublicClinic[] = [
  {
    id: 'feat-clinic-1',
    clinicName: 'Dewasi Health Center',
    city: 'Dubrajpur',
    address: 'Cinema Hall Road, Near Bus Stand',
    phone: '+919800011122',
    rating: 4.8,
    reviewCount: 210,
    doctorsCount: 8,
    imageKey: 'clinic1',
    specialties: ['Cardiology', 'General Medicine', 'Pediatrics'],
  },
  {
    id: 'feat-clinic-2',
    clinicName: 'City Polyclinic & Diagnostics',
    city: 'Suri',
    address: 'Rabindra Pally, Hospital Road',
    phone: '+919800022233',
    rating: 4.7,
    reviewCount: 145,
    doctorsCount: 12,
    imageKey: 'clinic2',
    specialties: ['Orthopedics', 'Dermatology', 'Pathology'],
  },
  {
    id: 'feat-clinic-3',
    clinicName: 'Santiniketan Medicare',
    city: 'Bolpur',
    address: 'Bolpur Station Road',
    phone: '+919800033344',
    rating: 4.9,
    reviewCount: 180,
    doctorsCount: 6,
    imageKey: 'clinic3',
    specialties: ['Ayurveda', 'Homeopathy', 'Dentistry'],
  },
  {
    id: 'feat-clinic-4',
    clinicName: 'Rampurhat Medical Center',
    city: 'Rampurhat',
    address: 'Court Road, Ward 2',
    phone: '+919800044455',
    rating: 4.8,
    reviewCount: 160,
    doctorsCount: 14,
    imageKey: 'clinic4',
    specialties: ['Cardiology', 'ENT', 'Gynecology'],
  },
];

// ============================================================
// 4. ALL CLINICS (Comprehensive Directory of Chambers)
// ============================================================
export const FALLBACK_ALL_CLINICS: PublicClinic[] = [
  {
    id: 'all-clinic-1',
    clinicName: 'LifeLine Care Chamber',
    city: 'Dubrajpur',
    address: 'Station Bazaar, Ward 3',
    phone: '+919800055566',
    rating: 4.6,
    reviewCount: 92,
    doctorsCount: 5,
    imageKey: 'clinic4',
    specialties: ['General Medicine', 'Homeopathy'],
  },
  {
    id: 'all-clinic-2',
    clinicName: 'Birbhum Mother & Child Clinic',
    city: 'Suri',
    address: 'College Road, Opp. Hospital',
    phone: '+919800066677',
    rating: 4.8,
    reviewCount: 110,
    doctorsCount: 9,
    imageKey: 'clinic3',
    specialties: ['Pediatrics', 'Gynecology'],
  },
  {
    id: 'all-clinic-3',
    clinicName: 'Apex Diagnostic & Polyclinic',
    city: 'Bolpur',
    address: 'Sriniketan Junction',
    phone: '+919800077788',
    rating: 4.7,
    reviewCount: 135,
    doctorsCount: 7,
    imageKey: 'clinic2',
    specialties: ['Pathology', 'Cardiology', 'Orthopedics'],
  },
  {
    id: 'all-clinic-4',
    clinicName: 'Arogya Wellness Hub',
    city: 'Rampurhat',
    address: 'Dakbangla More',
    phone: '+919800088899',
    rating: 4.9,
    reviewCount: 75,
    doctorsCount: 4,
    imageKey: 'clinic1',
    specialties: ['Ayurveda', 'Panchakarma'],
  },
  {
    id: 'all-clinic-5',
    clinicName: 'Suri Central Chambers',
    city: 'Suri',
    address: 'District Library Road',
    phone: '+919800099900',
    rating: 4.8,
    reviewCount: 198,
    doctorsCount: 11,
    imageKey: 'clinic3d',
    specialties: ['Neurology', 'Dermatology', 'Dentistry'],
  },
];

// ============================================================
// HOOKS
// ============================================================

export function usePublicFeaturedDoctors() {
  return useQuery<PublicDoctor[]>({
    queryKey: ['public', 'doctors', 'featured'],
    queryFn: async () => {
      try {
        const res = await api.get('/doctors/featured');
        const list = unwrapDoctors(res);
        return list.length > 0 ? list : FALLBACK_FEATURED_DOCTORS;
      } catch {
        return FALLBACK_FEATURED_DOCTORS;
      }
    },
    staleTime: 60_000,
  });
}

export function usePublicAllDoctors() {
  return useQuery<PublicDoctor[]>({
    queryKey: ['public', 'doctors', 'all'],
    queryFn: async () => {
      try {
        const res = await api.get('/doctors');
        const list = unwrapDoctors(res);
        return list.length > 0 ? list : FALLBACK_ALL_DOCTORS;
      } catch {
        return FALLBACK_ALL_DOCTORS;
      }
    },
    staleTime: 60_000,
  });
}

export function usePublicFeaturedClinics() {
  return useQuery<PublicClinic[]>({
    queryKey: ['public', 'clinics', 'featured'],
    queryFn: async () => {
      try {
        const res = await api.get('/clinic/featured');
        const list = unwrapClinics(res);
        return list.length > 0 ? list : FALLBACK_FEATURED_CLINICS;
      } catch {
        return FALLBACK_FEATURED_CLINICS;
      }
    },
    staleTime: 60_000,
  });
}

export function usePublicAllClinics() {
  return useQuery<PublicClinic[]>({
    queryKey: ['public', 'clinics', 'all'],
    queryFn: async () => {
      try {
        const res = await api.get('/clinic');
        const list = unwrapClinics(res);
        return list.length > 0 ? list : FALLBACK_ALL_CLINICS;
      } catch {
        return FALLBACK_ALL_CLINICS;
      }
    },
    staleTime: 60_000,
  });
}

// ============================================================
// 5. DIAGNOSTIC CENTERS / LABS
// ============================================================
export interface PublicDiagnosticCenter {
  id: string;
  centerName: string;
  address?: string;
  city?: string;
  phone?: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  email?: string;
  licenseNumber?: string;
  hasHomeService?: boolean;
  rating?: number;
  reviewCount?: number;
  logo?: string | null;
  image?: string | null;
  testsCount?: number;
  centerTests?: {
    id: string;
    price: number;
    isAvailable: boolean;
    diagnosticTest?: {
      id: string;
      name: string;
      description?: string | null;
    };
  }[];
}

export const FALLBACK_DIAGNOSTIC_CENTERS: PublicDiagnosticCenter[] = [
  {
    id: 'lab-1',
    centerName: 'Apex Diagnostic & Imaging Hub',
    city: 'Dubrajpur',
    address: 'Station Road, Near Bus Stand',
    phone: '+919800011223',
    hasHomeService: true,
    rating: 4.8,
    reviewCount: 164,
    testsCount: 42,
    centerTests: [
      { id: 't1', price: 350, isAvailable: true, diagnosticTest: { id: 'd1', name: 'Complete Blood Count (CBC)' } },
      { id: 't2', price: 650, isAvailable: true, diagnosticTest: { id: 'd2', name: 'Lipid Profile & Cholesterol' } },
      { id: 't3', price: 500, isAvailable: true, diagnosticTest: { id: 'd3', name: 'Thyroid Panel (T3, T4, TSH)' } },
      { id: 't4', price: 1200, isAvailable: true, diagnosticTest: { id: 'd4', name: 'Full Body Health Screening' } },
    ],
  },
  {
    id: 'lab-2',
    centerName: 'Suri Central Pathology Laboratory',
    city: 'Suri',
    address: 'Hospital More, Opp. Sadar Hospital',
    phone: '+919800022334',
    hasHomeService: true,
    rating: 4.9,
    reviewCount: 220,
    testsCount: 56,
    centerTests: [
      { id: 't5', price: 400, isAvailable: true, diagnosticTest: { id: 'd5', name: 'Liver Function Test (LFT)' } },
      { id: 't6', price: 450, isAvailable: true, diagnosticTest: { id: 'd6', name: 'Kidney Function Test (KFT)' } },
      { id: 't7', price: 300, isAvailable: true, diagnosticTest: { id: 'd7', name: 'Blood Glucose (Fasting & PP)' } },
      { id: 't8', price: 900, isAvailable: true, diagnosticTest: { id: 'd8', name: 'HbA1c Glycated Hemoglobin' } },
    ],
  },
  {
    id: 'lab-3',
    centerName: 'Care Diagnostic & Scan Center',
    city: 'Bolpur',
    address: 'Shantiniketan Road, Ward 7',
    phone: '+919800033445',
    hasHomeService: false,
    rating: 4.7,
    reviewCount: 98,
    testsCount: 38,
    centerTests: [
      { id: 't9', price: 800, isAvailable: true, diagnosticTest: { id: 'd9', name: 'USG Whole Abdomen' } },
      { id: 't10', price: 450, isAvailable: true, diagnosticTest: { id: 'd10', name: 'Chest X-Ray Digital' } },
      { id: 't11', price: 350, isAvailable: true, diagnosticTest: { id: 'd11', name: '12-Lead ECG Test' } },
    ],
  },
  {
    id: 'lab-4',
    centerName: 'Birbhum LifeCare Diagnostics',
    city: 'Rampurhat',
    address: 'Railway Station Road',
    phone: '+919800044556',
    hasHomeService: true,
    rating: 4.8,
    reviewCount: 145,
    testsCount: 48,
    centerTests: [
      { id: 't12', price: 950, isAvailable: true, diagnosticTest: { id: 'd12', name: 'Vitamin D3 & B12 Combo' } },
      { id: 't13', price: 250, isAvailable: true, diagnosticTest: { id: 'd13', name: 'Urine Routine & Microscopic' } },
      { id: 't14', price: 1500, isAvailable: true, diagnosticTest: { id: 'd14', name: 'Executive Master Health Checkup' } },
    ],
  },
];

function unwrapDiagnosticCenters(res: { data?: unknown }): PublicDiagnosticCenter[] {
  const data = res.data as any;
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.centers)) return data.centers;
  if (data.data) {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.data.centers)) return data.data.centers;
  }
  return [];
}

export function usePublicDiagnosticCenters() {
  return useQuery<PublicDiagnosticCenter[]>({
    queryKey: ['public', 'diagnostic-centers', 'all'],
    queryFn: async () => {
      try {
        const res = await api.get('/diagnostic-centers/all');
        const list = unwrapDiagnosticCenters(res);
        return list.length > 0 ? list : FALLBACK_DIAGNOSTIC_CENTERS;
      } catch {
        return FALLBACK_DIAGNOSTIC_CENTERS;
      }
    },
    staleTime: 60_000,
  });
}

