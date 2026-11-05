import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { useGlobalAnnouncements, type GlobalAnnouncement } from '../hooks/useAnnouncements';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface AnnouncementsModalProps {
  visible: boolean;
  onClose: () => void;
}

function getAnnouncementBadge(type?: string): {
  label: string;
  bgColor: string;
  textColor: string;
} {
  switch ((type || '').toUpperCase()) {
    case 'URGENT':
    case 'CRITICAL':
    case 'ALERT':
      return { label: 'URGENT', bgColor: '#FEE2E2', textColor: '#DC2626' };
    case 'WARNING':
      return { label: 'NOTICE', bgColor: '#FEF3C7', textColor: '#D97706' };
    case 'UPDATE':
      return { label: 'UPDATE', bgColor: '#E0E7FF', textColor: '#4F46E5' };
    case 'EVENT':
      return { label: 'EVENT', bgColor: '#ECFDF5', textColor: '#059669' };
    default:
      return { label: 'ANNOUNCEMENT', bgColor: '#F0FDFA', textColor: '#0D9488' };
  }
}

function formatAnnouncementTime(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export function AnnouncementsModal({ visible, onClose }: AnnouncementsModalProps) {
  const { announcements, isLoading, refetch, markAllAsViewed, viewedIds } =
    useGlobalAnnouncements();

  // Vanish the red count and NEW tag immediately when user opens the modal
  useEffect(() => {
    if (visible && announcements.length > 0) {
      markAllAsViewed();
    }
  }, [visible, announcements.length, markAllAsViewed]);

  const handleOpenLink = (url?: string | null) => {
    if (url && url.startsWith('http')) {
      Linking.openURL(url).catch(() => {});
    }
  };

  const renderItem = ({ item }: { item: GlobalAnnouncement }) => {
    const badge = getAnnouncementBadge(item.type);
    const timeFormatted = formatAnnouncementTime(item.createdAt);
    const isNew = !viewedIds.includes(item.id);

    return (
      <View style={[styles.announcementCard, isNew && styles.announcementCardNew]}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.typeBadge, { backgroundColor: badge.bgColor }]}>
            <Text style={[styles.typeBadgeText, { color: badge.textColor }]}>{badge.label}</Text>
          </View>

          {isNew && (
            <View style={styles.newTagPill}>
              <Text style={styles.newTagText}>NEW</Text>
            </View>
          )}

          <Text style={styles.timeText}>{timeFormatted}</Text>
        </View>

        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.messageText}>{item.message}</Text>

        {item.link ? (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleOpenLink(item.link)}
            activeOpacity={0.8}
          >
            <Text style={styles.linkButtonText}>Learn More</Text>
            <Icon name="arrow-right" size={13} color="#0D9488" />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <View style={styles.megaphoneIconCircle}>
              <Icon name="megaphone" size={18} color="#0D9488" />
            </View>
            <View>
              <Text style={styles.modalTitle}>Platform Notices</Text>
              <Text style={styles.modalSubtitle}>Official news, alerts & platform updates</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Icon name="x" size={18} color={Colors.light.ink700} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text style={styles.loadingText}>Fetching announcements...</Text>
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="megaphone" size={32} color={Colors.light.ink300} />
            </View>
            <Text style={styles.emptyTitle}>No Active Announcements</Text>
            <Text style={styles.emptySubtitle}>
              You are completely up to date. Important hospital, system, or platform notices will appear here.
            </Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()} activeOpacity={0.8}>
              <Text style={styles.refreshBtnText}>Check for Updates</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={announcements}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  megaphoneIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.light.ink500,
    fontWeight: '600',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  refreshBtn: {
    marginTop: Spacing.three,
    backgroundColor: '#0D9488',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.two,
    ...Shadows.sm,
  },
  announcementCardNew: {
    borderColor: '#99F6E4',
    backgroundColor: '#FDFFFF',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  newTagPill: {
    backgroundColor: '#EF4444',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  newTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 11,
    color: Colors.light.ink400,
    marginLeft: 'auto',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  messageText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  linkButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
});
