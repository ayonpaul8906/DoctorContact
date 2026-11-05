/**
 * Formatter and sanitization utilities for Doctor Contact Mobile
 */

/**
 * Cleans bilingual doctor names like "Dr. Biswajit De | ডাঃ বিশ্বজিৎ দে |"
 * Extracts solely the English name cleanly.
 */
export function formatDoctorName(name?: string): string {
  if (!name) return 'Doctor';
  let clean = name.trim();
  if (clean.includes('|')) {
    const parts = clean
      .split('|')
      .map((p) => p.trim())
      .filter(Boolean);
    // Prefer the first (English) part
    if (parts.length > 0 && parts[0]) {
      clean = parts[0];
    }
  }
  // Remove extra trailing pipes or slashes
  clean = clean.replace(/^[|/\s]+|[|/\s]+$/g, '').trim();
  return clean || 'Doctor';
}

/**
 * Normalizes phone numbers for WhatsApp (wa.me)
 * Strips non-digits and ensures 10-digit Indian numbers have country code 91
 */
export function normalizeWhatsAppNumber(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/[^0-9]/g, '');
  if (digits.length < 10) return null;
  // If 10 digits (standard Indian mobile), prepend 91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Generates a professional pre-filled WhatsApp message URL for a doctor
 */
export function getDoctorWhatsAppUrl(
  phone: string,
  doctorName?: string,
  clinicName?: string
): string | null {
  const waNumber = normalizeWhatsAppNumber(phone);
  if (!waNumber) return null;

  const cleanDocName = formatDoctorName(doctorName);
  const text = clinicName
    ? `Hello ${cleanDocName}, I found your profile on Doctor Contact for ${clinicName}. I would like to inquire about consultation timings and appointment availability.`
    : `Hello ${cleanDocName}, I found your profile on Doctor Contact. I would like to inquire about consultation timings and appointment availability.`;

  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates a professional pre-filled WhatsApp message URL for a clinic
 */
export function getClinicWhatsAppUrl(
  phone: string,
  clinicName?: string,
  doctorName?: string
): string | null {
  const waNumber = normalizeWhatsAppNumber(phone);
  if (!waNumber) return null;

  const cleanClinic = (clinicName || 'Clinic').trim();
  const text = doctorName
    ? `Hello ${cleanClinic}, I found your clinic on Doctor Contact. I would like to inquire about Dr. ${formatDoctorName(
        doctorName
      )}'s chamber consultation timings and appointment availability.`
    : `Hello ${cleanClinic}, I found your clinic on Doctor Contact. I would like to inquire about doctor consultation timings and healthcare services.`;

  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates a professional pre-filled WhatsApp message URL for a diagnostic lab
 */
export function getLabWhatsAppUrl(
  phone: string,
  centerName?: string,
  testName?: string
): string | null {
  const waNumber = normalizeWhatsAppNumber(phone);
  if (!waNumber) return null;

  const cleanCenter = (centerName || 'Diagnostic Center').trim();
  const text = testName
    ? `Hello ${cleanCenter}, I found your center on Doctor Contact. I would like to inquire about ${testName} test availability, timings, and sample collection.`
    : `Hello ${cleanCenter}, I found your diagnostic laboratory on Doctor Contact. I would like to inquire about diagnostic test availability, pricing, and home sample collection.`;

  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates a professional pre-filled WhatsApp message URL for emergency ambulance
 */
export function getAmbulanceWhatsAppUrl(
  phone: string,
  ambulanceType?: string,
  location?: string
): string | null {
  const waNumber = normalizeWhatsAppNumber(phone);
  if (!waNumber) return null;

  const type = ambulanceType || 'Ambulance';
  const text = location
    ? `EMERGENCY AMBULANCE REQUEST: Hello, I need immediate assistance for a ${type} service in/near ${location}. Please let me know current availability.`
    : `EMERGENCY AMBULANCE REQUEST: Hello, I need immediate assistance for a ${type} service. Please share availability and dispatch time.`;

  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
}
