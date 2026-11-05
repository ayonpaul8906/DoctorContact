import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';
import { dismissSystemNotification } from '../lib/notifications';

export interface GlobalAnnouncement {
  id: string;
  title: string;
  message: string;
  type?: 'INFO' | 'URGENT' | 'UPDATE' | 'WARNING' | string;
  link?: string | null;
  isActive: boolean;
  createdAt: string;
}

const VIEWED_ANNOUNCEMENTS_KEY = 'dewasi_viewed_announcements_v1';

export function useGlobalAnnouncements() {
  const queryClient = useQueryClient();
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load seen announcement IDs from storage
  useEffect(() => {
    async function loadViewed() {
      try {
        const stored = await SecureStore.getItemAsync(VIEWED_ANNOUNCEMENTS_KEY);
        if (stored) {
          setViewedIds(JSON.parse(stored));
        }
      } catch {
        // Fallback or ignore in browser/unsupported environments
      } finally {
        setIsLoaded(true);
      }
    }
    loadViewed();
  }, []);

  const announcementsQuery = useQuery<GlobalAnnouncement[]>({
    queryKey: ['announcements', 'global'],
    queryFn: async () => {
      try {
        const res = await api.get('/announcements/global');
        const data = res.data?.data?.announcements || res.data?.data || [];
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.warn('Failed to fetch announcements:', err);
        return [];
      }
    },
    staleTime: 30_000,
  });

  const announcements = announcementsQuery.data ?? [];

  // Calculate unread count (announcements not yet in viewedIds)
  const unreadCount = announcements.filter((a) => !viewedIds.includes(a.id)).length;

  // Mark all announcements as seen/read (vanishes red badge and NEW tags)
  const markAllAsViewed = useCallback(async () => {
    if (announcements.length === 0) return;
    const allIds = Array.from(new Set([...viewedIds, ...announcements.map((a) => a.id)]));
    setViewedIds(allIds);
    try {
      await SecureStore.setItemAsync(VIEWED_ANNOUNCEMENTS_KEY, JSON.stringify(allIds));
    } catch {
      // Storage write error ignored
    }
    // Dismiss all active announcement notifications from the mobile notification shade
    for (const a of announcements) {
      dismissSystemNotification(`announcement_${a.id}`);
    }
  }, [announcements, viewedIds]);

  return {
    announcements,
    unreadCount: isLoaded ? unreadCount : 0,
    viewedIds,
    markAllAsViewed,
    isLoading: announcementsQuery.isLoading,
    refetch: announcementsQuery.refetch,
  };
}
