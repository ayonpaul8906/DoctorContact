import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AppNotification } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import {
  dismissSystemNotification,
  dismissAllSystemNotifications,
} from '../lib/notifications';

export interface NotificationsResponse {
  items: AppNotification[];
  total: number;
  unread: number;
  page: number;
  limit: number;
}

export function useUnreadNotificationCount() {
  const { user } = useAuth();
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count');
      return data?.data?.count ?? 0;
    },
    enabled: !!user,
    staleTime: 15000,
  });
}

export function useMyNotifications(enabled = true) {
  const { user } = useAuth();
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/me');
      return data?.data ?? { items: [], total: 0, unread: 0, page: 1, limit: 20 };
    },
    enabled: enabled && !!user,
    staleTime: 15000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data?.data?.notification as AppNotification;
    },
    onSuccess: (_, id) => {
      dismissSystemNotification(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/notifications/read-all');
      return data;
    },
    onSuccess: () => {
      dismissAllSystemNotifications();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
