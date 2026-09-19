/**
 * Mobile Environment & Network Configuration.
 * Centralized resolution of API and Socket URLs with platform fallbacks.
 */

function getDevApiUrl(): string {
  return `https://api.doctorcontact.in/api/v1`;
}

function getDevSocketUrl(): string {
  return `https://api.doctorcontact.in`;
}

export const Config = {
  API_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    getDevApiUrl(),
  SOCKET_URL:
    process.env.EXPO_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    getDevSocketUrl(),
  APP_NAME: 'Doctor Contact',
  TOKEN_KEY: 'dewasi_access_token',
  REFRESH_TOKEN_KEY: 'dewasi_refresh_token',
  USER_KEY: 'dewasi_auth_user',
} as const;
