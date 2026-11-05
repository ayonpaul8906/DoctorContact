import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface SearchLocation {
  id: string;
  nameEn: string;
  nameBn?: string;
  nameHi?: string;
  isActive?: boolean;
}

export const FALLBACK_LOCATIONS: SearchLocation[] = [
  { id: '1', nameEn: 'Dubrajpur', isActive: true },
  { id: '2', nameEn: 'Suri', isActive: true },
  { id: '3', nameEn: 'Bolpur', isActive: true },
  { id: '4', nameEn: 'Rampurhat', isActive: true },
  { id: '5', nameEn: 'Kolkata', isActive: true },
];

export function useSearchLocations() {
  return useQuery<SearchLocation[]>({
    queryKey: ['locations', 'search'],
    queryFn: async () => {
      try {
        const response = await api.get('/locations');
        const raw = response.data?.data || response.data || [];
        if (Array.isArray(raw) && raw.length > 0) {
          const activeOnly = raw.filter(
            (loc: any) =>
              loc.isActive !== false &&
              loc.nameEn?.toLowerCase() !== 'all cities'
          );
          return activeOnly;
        }
        return FALLBACK_LOCATIONS;
      } catch (error) {
        console.warn('Failed to fetch locations from backend API, using fallback locations:', error);
        return FALLBACK_LOCATIONS;
      }
    },
    staleTime: 1000 * 60 * 30,
  });
}
