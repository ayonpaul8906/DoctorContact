import { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth-context';
import { getSocket, disconnectSocket } from '../lib/socket';
import {
  postSystemNotification,
  checkAndDeliverNewNotifications,
} from '../lib/notifications';
import type { Socket } from 'socket.io-client';

export function useAppointmentRealtime() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      disconnectSocket();
      setIsConnected(false);
      return;
    }

    let isMounted = true;
    const userId = user.id;

    async function initSocket() {
      try {
        const socket = await getSocket();
        if (!isMounted) return;
        socketRef.current = socket;

        function handleConnect() {
          if (isMounted) {
            setIsConnected(true);
            socket.emit('joinUser', userId);
          }
        }

        function handleDisconnect() {
          if (isMounted) {
            setIsConnected(false);
          }
        }

        function handleNewNotification(notification?: any) {
          if (notification && notification.id) {
            postSystemNotification(notification);
          }
          // Immediately invalidate and refetch appointments and notifications cache
          queryClient.invalidateQueries({ queryKey: ['appointments', 'me'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }

        function handleNewAnnouncement(announcement?: any) {
          if (announcement && announcement.id) {
            postSystemNotification({
              id: `announcement_${announcement.id}`,
              title: announcement.title ? `📢 ${announcement.title}` : '📢 New Announcement',
              message: announcement.message || '',
              type: 'ANNOUNCEMENT',
              meta: { announcementId: announcement.id, type: 'announcement', link: announcement.link },
            });
          }
          queryClient.invalidateQueries({ queryKey: ['announcements'] });
        }

        // Attach verified event listeners with named callbacks
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('newNotification', handleNewNotification);
        socket.on('new_announcement', handleNewAnnouncement);

        if (!socket.connected) {
          socket.connect();
        } else {
          setIsConnected(true);
          socket.emit('joinUser', userId);
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[useAppointmentRealtime] Socket init error:', err);
        }
      }
    }

    initSocket();

    // Handle AppState foreground resync
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          queryClient.invalidateQueries({ queryKey: ['appointments', 'me'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          checkAndDeliverNewNotifications();
          if (socketRef.current && !socketRef.current.connected) {
            socketRef.current.connect();
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
      if (socketRef.current) {
        socketRef.current.emit('leaveUser', userId);
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('newNotification');
        socketRef.current.off('new_announcement');
      }
    };
  }, [isAuthenticated, user?.id, queryClient]);

  return { isConnected };
}
