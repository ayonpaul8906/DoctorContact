import { Config } from '../lib/config';

/**
 * Resolves an image URL against the backend API host if it is a relative path.
 * If already an absolute URL (http, https, data:), returns as is.
 */
export function getImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '';
  }

  const trimmed = url.trim();

  // Already absolute or base64 data uri
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file://')
  ) {
    return trimmed;
  }

  // Base URL from Config
  const host = Config.SOCKET_URL || 'https://api.doctorcontact.in';
  const cleanHost = host.endsWith('/') ? host.slice(0, -1) : host;
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return `${cleanHost}${cleanPath}`;
}
