import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useSuperAdminAnnouncements,
  useCreateAnnouncement,
  useToggleAnnouncement,
  useDeleteAnnouncement,
  type SuperAdminAnnouncement,
  type AnnouncementType,
} from '../../hooks/useSuperAdmin';
import { Icon, type IconName } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

type FilterTab = 'ALL' | 'ACTIVE' | 'PAUSED';

const ANNOUNCEMENT_TYPES: { type: AnnouncementType; label: string; icon: IconName; color: string; bg: string }[] = [
  { type: 'GENERAL', label: 'General Notice', icon: 'info', color: '#2563EB', bg: '#EFF6FF' },
  { type: 'EMERGENCY', label: 'Emergency Alert', icon: 'alert-triangle', color: '#DC2626', bg: '#FEF2F2' },
  { type: 'MAINTENANCE', label: 'Maintenance', icon: 'settings', color: '#D97706', bg: '#FEF3C7' },
  { type: 'HOLIDAY', label: 'Holiday Notice', icon: 'calendar', color: '#7C3AED', bg: '#FDF4FF' },
  { type: 'CLINIC_CLOSED', label: 'Chamber Closed', icon: 'x-circle', color: '#EA580C', bg: '#FFF7ED' },
  { type: 'DOCTOR_ABSENT', label: 'Doctor On Leave', icon: 'user-x', color: '#E11D48', bg: '#FFE4E6' },
];

function getTypeConfig(type: string) {
  return ANNOUNCEMENT_TYPES.find((t) => t.type === type) || ANNOUNCEMENT_TYPES[0];
}

export default function SuperAdminAnnouncementsScreen() {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [selectedType, setSelectedType] = useState<AnnouncementType>('GENERAL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const {
    data: announcements = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useSuperAdminAnnouncements();

  const createMutation = useCreateAnnouncement();
  const toggleMutation = useToggleAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      if (activeTab === 'ACTIVE' && !a.isActive) return false;
      if (activeTab === 'PAUSED' && a.isActive) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          a.title.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [announcements, activeTab, search]);

  const activeCount = useMemo(() => announcements.filter((a) => a.isActive).length, [announcements]);
  const pausedCount = useMemo(() => announcements.filter((a) => !a.isActive).length, [announcements]);

  const handleToggle = async (a: SuperAdminAnnouncement) => {
    try {
      await toggleMutation.mutateAsync({
        id: a.id,
        isActive: !a.isActive,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to toggle announcement.');
    }
  };

  const handleDelete = (a: SuperAdminAnnouncement) => {
    Alert.alert(
      'Delete Announcement',
      `Permanently delete "${a.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(a.id);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete announcement.');
            }
          },
        },
      ]
    );
  };

  const handleCreateSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Validation Error', 'Announcement Title and Message are required.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        type: selectedType,
        title: title.trim(),
        message: message.trim(),
      });
      Alert.alert('Success', 'Announcement broadcasted to all users and mobile devices!');
      setShowAddModal(false);
      setTitle('');
      setMessage('');
      setSelectedType('GENERAL');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to broadcast announcement.');
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>Broadcast Notices</Text>
          <Text style={styles.subtitle}>Send instant platform alerts & mobile status notices</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Icon name="megaphone" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Broadcast</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'ALL' && styles.tabItemActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
            All ({announcements.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'ACTIVE' && styles.tabItemActive]}
          onPress={() => setActiveTab('ACTIVE')}
        >
          <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>
            Active ({activeCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'PAUSED' && styles.tabItemActive]}
          onPress={() => setActiveTab('PAUSED')}
        >
          <Text style={[styles.tabText, activeTab === 'PAUSED' && styles.tabTextActive]}>
            Paused ({pausedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Icon name="search" size={16} color={Colors.light.ink400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search announcements by title or content..."
          placeholderTextColor={Colors.light.ink400}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="x" size={16} color={Colors.light.ink400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Announcements List */}
      <FlatList
        data={filteredAnnouncements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => { refetch(); }}
            tintColor="#D97706"
            colors={['#D97706']}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color="#D97706" />
              <Text style={styles.loadingText}>Loading broadcast notices...</Text>
            </View>
          ) : (
            <View style={styles.centerBox}>
              <Icon name="megaphone" size={36} color={Colors.light.ink300} />
              <Text style={styles.emptyTitle}>No Announcements</Text>
              <Text style={styles.emptySubtitle}>
                {search ? 'No notices match your search.' : 'No announcements published yet.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const typeConfig = getTypeConfig(item.type);

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.typeIconBox, { backgroundColor: typeConfig.bg }]}>
                  <Icon name={typeConfig.icon} size={18} color={typeConfig.color} />
                </View>

                <View style={styles.noticeInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.noticeTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        item.isActive ? styles.statusActive : styles.statusPaused,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          item.isActive ? styles.statusTextActive : styles.statusTextPaused,
                        ]}
                      >
                        {item.isActive ? 'Active' : 'Paused'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.typePill, { backgroundColor: typeConfig.bg }]}>
                    <Text style={[styles.typePillText, { color: typeConfig.color }]}>
                      {typeConfig.label}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.noticeBody}>{item.message}</Text>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>Published {formatDate(item.createdAt)}</Text>

                <View style={styles.actionBtnGroup}>
                  {/* Pause / Resume Button */}
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      item.isActive ? styles.toggleBtnPause : styles.toggleBtnResume,
                    ]}
                    onPress={() => handleToggle(item)}
                    disabled={toggleMutation.isPending}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={item.isActive ? 'pause' : 'play'}
                      size={12}
                      color={item.isActive ? '#D97706' : '#059669'}
                    />
                    <Text
                      style={[
                        styles.toggleBtnText,
                        item.isActive ? styles.toggleTextPause : styles.toggleTextResume,
                      ]}
                    >
                      {item.isActive ? 'Pause' : 'Resume'}
                    </Text>
                  </TouchableOpacity>

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item)}
                    disabled={deleteMutation.isPending}
                    activeOpacity={0.8}
                  >
                    <Icon name="trash-2" size={13} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Broadcast Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Broadcast Announcement</Text>
                <Text style={styles.modalSubtitle}>Push notifications & real-time socket delivery</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseBtn}
              >
                <Icon name="x" size={20} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Notice Classification</Text>
              <View style={styles.typeOptionsGrid}>
                {ANNOUNCEMENT_TYPES.map((t) => {
                  const isSelected = selectedType === t.type;
                  return (
                    <TouchableOpacity
                      key={t.type}
                      style={[
                        styles.typeSelectTile,
                        isSelected && { borderColor: t.color, backgroundColor: t.bg },
                      ]}
                      onPress={() => setSelectedType(t.type)}
                      activeOpacity={0.8}
                    >
                      <Icon name={t.icon} size={16} color={isSelected ? t.color : Colors.light.ink500} />
                      <Text
                        style={[
                          styles.typeSelectText,
                          isSelected && { color: t.color, fontWeight: '700' },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Announcement Headline *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Platform Upgrades Scheduled for Midnight"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Detailed Notice Message *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Provide details about the notice, affected clinics or doctors, dates, and instructions for patients..."
                multiline
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateSubmit}
                disabled={createMutation.isPending}
                activeOpacity={0.8}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="megaphone" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Broadcast Notice Platform-Wide</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitleGroup: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.extrabold,
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#B45309',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabItemActive: {
    backgroundColor: '#B45309',
    borderColor: '#B45309',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  typeIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusPaused: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextPaused: {
    color: '#B45309',
  },
  typePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    marginTop: 4,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  noticeBody: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  toggleBtnPause: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  toggleBtnResume: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  toggleTextPause: {
    color: '#D97706',
  },
  toggleTextResume: {
    color: '#059669',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#FEF2F2',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#D97706',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalScroll: {
    padding: 16,
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  typeOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  typeSelectTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeSelectText: {
    fontSize: 11,
    color: '#334155',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 10,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B45309',
    borderRadius: Radius.md,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 32,
    ...Shadows.sm,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
