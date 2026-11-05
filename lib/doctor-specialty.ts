/**
 * Doctor Specialty & Medical System Helpers for Doctor Contact Mobile.
 * Extracts backend specializations and provides system-aligned badges and smart search.
 */

import type { IconName } from '../components/Icon';

export interface MedicalSystemInfo {
  system: 'Allopathy' | 'Ayurveda' | 'Homeopathy' | 'Dental';
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: IconName;
}

/**
 * Resolves the doctor's clinical specialty/specialization directly from backend fields.
 * Inspects `specializations` relation array, `specialization` string column, and fallbacks.
 */
export function getDoctorSpecialty(doctor: any): string {
  if (!doctor) return 'General Specialist';

  // 1. Array of specializations from backend relation (DoctorSpecialization[])
  if (Array.isArray(doctor.specializations) && doctor.specializations.length > 0) {
    const names = doctor.specializations
      .map((s: any) => s.specialization?.name || s.name)
      .filter(Boolean);
    if (names.length > 0) {
      return names.join(', ');
    }
  }

  // 2. Direct string from backend `specialization` column
  if (
    doctor.specialization &&
    typeof doctor.specialization === 'string' &&
    doctor.specialization.trim()
  ) {
    return doctor.specialization.trim();
  }

  // 3. Alternative backend fields
  if (doctor.specialty && typeof doctor.specialty === 'string') {
    return doctor.specialty.trim();
  }
  if (doctor.department && typeof doctor.department === 'string') {
    return doctor.department.trim();
  }
  if (doctor.qualification && typeof doctor.qualification === 'string') {
    const qual = doctor.qualification.trim();
    if (qual.toLowerCase().includes('bams')) return 'Ayurvedic Consultant';
    if (qual.toLowerCase().includes('bhms')) return 'Homeopathic Physician';
    if (qual.toLowerCase().includes('bds')) return 'Dental Surgeon';
    return qual;
  }

  return 'General Specialist';
}

/**
 * Resolves the doctor's medical system (Allopathy, Ayurveda, Homeopathy, Dental)
 * with dedicated branding colors matching the web app.
 */
export function getDoctorMedicalSystem(doctor: any): MedicalSystemInfo {
  const rawSystem = String(doctor?.medicalSystem || '').toUpperCase();
  const specText = (
    String(doctor?.specialization || '') +
    ' ' +
    String(doctor?.qualification || '') +
    ' ' +
    (Array.isArray(doctor?.specializations)
      ? doctor.specializations
          .map((s: any) => s.specialization?.name || s.name || '')
          .join(' ')
      : '')
  ).toLowerCase();

  // 1. Ayurveda check
  if (
    rawSystem === 'AYURVEDA' ||
    specText.includes('ayurved') ||
    specText.includes('bams') ||
    specText.includes('panchakarma') ||
    specText.includes('vaidya')
  ) {
    return {
      system: 'Ayurveda',
      label: 'Ayurveda',
      bgColor: '#FEF3C7', // Amber 100
      borderColor: '#FDE68A', // Amber 200
      textColor: '#B45309', // Amber 700
      icon: 'sparkles',
    };
  }

  // 2. Homeopathy check
  if (
    rawSystem === 'HOMEOPATHY' ||
    specText.includes('homeo') ||
    specText.includes('homoeo') ||
    specText.includes('bhms')
  ) {
    return {
      system: 'Homeopathy',
      label: 'Homeopathy',
      bgColor: '#EFF6FF', // Blue 50
      borderColor: '#BFDBFE', // Blue 200
      textColor: '#1D4ED8', // Blue 700
      icon: 'activity',
    };
  }

  // 3. Dental check
  if (
    specText.includes('dent') ||
    specText.includes('bds') ||
    specText.includes('mds') ||
    specText.includes('orthodont')
  ) {
    return {
      system: 'Dental',
      label: 'Dental',
      bgColor: '#F0FDF4', // Green 50
      borderColor: '#BBF7D0', // Green 200
      textColor: '#15803D', // Green 700
      icon: 'sparkles',
    };
  }

  // 4. Default: Allopathy
  return {
    system: 'Allopathy',
    label: 'Allopathy',
    bgColor: '#CCFBF1', // Teal 100
    borderColor: '#99F6E4', // Teal 200
    textColor: '#0F766E', // Teal 700
    icon: 'stethoscope',
  };
}

/**
 * Checks whether a doctor matches a given search query across:
 * - Speciality / Specialization string & array
 * - Medical System (Allopathy, Ayurveda, Homeopathy, Dental) & synonyms
 * - Doctor Name (English, Bengali, Hindi)
 * - Qualifications (MBBS, MD, BAMS, BHMS, BDS, etc.)
 * - Clinic Name, Address, and City
 */
export function matchesDoctorSpecialtySearch(doctor: any, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const docName = String(doctor?.user?.name || doctor?.name || '').toLowerCase();
  const spec = getDoctorSpecialty(doctor).toLowerCase();
  const systemInfo = getDoctorMedicalSystem(doctor);
  const sysName = systemInfo.label.toLowerCase();
  const qual = String(doctor?.qualification || '').toLowerCase();
  const clinicName = String(doctor?.clinic?.clinicName || doctor?.clinicName || '').toLowerCase();
  const city = String(doctor?.clinic?.city || doctor?.city || '').toLowerCase();

  // 1. Direct keyword matching
  if (
    docName.includes(q) ||
    spec.includes(q) ||
    sysName.includes(q) ||
    qual.includes(q) ||
    clinicName.includes(q) ||
    city.includes(q)
  ) {
    return true;
  }

  // 2. Ayurveda & Ayurvedic synonyms matching
  if (q.includes('ayur') || q === 'bams' || q === 'panchakarma') {
    return systemInfo.system === 'Ayurveda';
  }

  // 3. Homeopathy & Homeopathic synonyms matching
  if (q.includes('homeo') || q.includes('homoeo') || q === 'bhms') {
    return systemInfo.system === 'Homeopathy';
  }

  // 4. Allopathy & Allopathic synonyms matching
  if (q.includes('allopath') || q === 'mbbs') {
    return systemInfo.system === 'Allopathy';
  }

  // 5. Dental matching
  if (q.includes('dent') || q === 'bds') {
    return systemInfo.system === 'Dental';
  }

  return false;
}
