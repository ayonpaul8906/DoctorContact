import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useClinicReceivedRequests,
  useClinicSentRequests,
  useRespondToDoctorRequest,
} from '../../hooks/useClinic';
import {
  GradientCard,
  Icon,
} from '../../components';
import type { SentDoctorRequest } from '../../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ClinicRequestsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');

  const {
    data: receivedRequests = [],
    isLoading: loadingReceived,
    refetch: refetchReceived,
    isRefetching: refetchingReceived,
  } = useClinicReceivedRequests();

  const {
    data: sentRequests = [],
    isLoading: loadingSent,
    refetch: refetchSent,
    isRefetching: refetchingSent,
  } = useClinicSentRequests();

  const respondMutation = useRespondToDoctorRequest();

  const handleRefresh = () => {
    refetchReceived();
    refetchSent();
  };

  const currentList = activeTab === 'received' ? receivedRequests : sentRequests;

  const filteredList = useMemo(() => {
    if (statusFilter === 'ALL') return currentList;
    return currentList.filter((r) => r.status?.toUpperCase() === statusFilter);
  }, [currentList, statusFilter]);

  const pendingReceivedCount = receivedRequests.filter(
    (r) => r.status?.toUpperCase() === 'PENDING'
  ).length;

  const handleRespond = (associationId: string, action: 'ACCEPT' | 'REJECT', docName: string) => {
    Alert.alert(
      action === 'ACCEPT' ? 'Accept Doctor' : 'Decline Request',
      `Are you sure you want to ${action.toLowerCase()} the connection request from Dr. ${docName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'ACCEPT' ? 'Accept' : 'Decline',
          style: action === 'ACCEPT' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await respondMutation.mutateAsync({ associationId, action });
              Alert.alert(
                action === 'ACCEPT' ? 'Doctor Connected' : 'Request Declined',
                `The doctor association request has been updated.`
              );
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Action failed.');
            }
          },
        },
      ]
    );
  };

  const isLoading = activeTab === 'received' ? loadingReceived : loadingSent;
  const isRefetching = refetchingReceived || refetchingSent;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Top Navigation Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Icon name="arrow-left" size={18} color={Colors.light.ink900} />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Doctor Requests</Text>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRefresh}
          activeOpacity={0.8}
        >
          <Icon name="refresh-cw" size={16} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.topContainer}>
        {/* 2. Banner */}
        <GradientCard variant="blue" style={styles.bannerCard}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerTop}>
              <View style={styles.bannerIconBox}>
                <Icon name="inbox" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.bannerTagline}>DOCTOR ASSOCIATION REQUESTS</Text>
              {pendingReceivedCount > 0 && (
                <View style={styles.pendingBadge}>
                  <Icon name="sparkles" size={10} color="#FFFFFF" />
                  <Text style={styles.pendingBadgeText}>{pendingReceivedCount} Pending</Text>
                </View>
              )}
            </View>

            <Text style={styles.bannerHeading}>Association Management</Text>
            <Text style={styles.bannerSub}>
              Review applications from doctors wishing to practice at your clinic, or track invitations sent to doctors.
            </Text>
          </View>
        </GradientCard>

        {/* 3. Received vs Sent Tabs */}
        <View style={styles.tabToggleRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'received' && styles.tabBtnActive]}
            onPress={() => setActiveTab('received')}
            activeOpacity={0.8}
          >
            <Icon
              name="inbox"
              size={14}
              color={activeTab === 'received' ? '#FFFFFF' : Colors.light.ink600}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'received' && styles.tabBtnTextActive,
              ]}
            >
              Incoming {pendingReceivedCount > 0 ? `(${pendingReceivedCount})` : `(${receivedRequests.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'sent' && styles.tabBtnActive]}
            onPress={() => setActiveTab('sent')}
            activeOpacity={0.8}
          >
            <Icon
              name="arrow-right"
              size={14}
              color={activeTab === 'sent' ? '#FFFFFF' : Colors.light.ink600}
            />
            <Text
              style={[styles.tabBtnText, activeTab === 'sent' && styles.tabBtnTextActive]}
            >
              Sent Requests ({sentRequests.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Status Filter Pills */}
        <View style={styles.filterPillsRow}>
          {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((st) => {
            const isSel = statusFilter === st;
            return (
              <TouchableOpacity
                key={st}
                style={[styles.filterPill, isSel && styles.filterPillActive]}
                onPress={() => setStatusFilter(st)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.filterPillText, isSel && styles.filterPillTextActive]}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 5. List Content */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>Loading connection requests...</Text>
        </View>
      ) : filteredList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="check-circle" size={28} color="#059669" />
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === 'received' ? 'All Caught Up!' : 'No Sent Requests'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'received'
              ? 'No pending incoming doctor association applications found matching the selected filter.'
              : 'No outgoing doctor connection requests found matching the selected filter.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={Colors.light.primary}
              colors={[Colors.light.primary]}
            />
          }
          renderItem={({ item }) => {
            const rawName = item.doctor?.user?.name || 'Doctor';
            const docName = rawName.startsWith('Dr.') ? rawName : `Dr. ${rawName}`;
            const initials = getInitials(item.doctor?.user?.name || 'Doctor');
            const isPending = item.status?.toUpperCase() === 'PENDING';
            const isAccepted = item.status?.toUpperCase() === 'ACCEPTED' || item.status?.toUpperCase() === 'APPROVED';
            const isRejected = item.status?.toUpperCase() === 'REJECTED';

            return (
              <GradientCard
                variant={isPending ? 'blue' : isAccepted ? 'green' : 'pink'}
                style={styles.reqCard}
              >
                <View style={styles.reqCardContent}>
                  {/* Doctor Info Row */}
                  <View style={styles.reqHeaderRow}>
                    <View style={styles.docAvatar}>
                      <Text style={styles.docAvatarText}>{initials}</Text>
                    </View>

                    <View style={styles.docNameCol}>
                      <View style={styles.nameBadgeRow}>
                        <Text style={styles.docName} numberOfLines={1}>
                          {docName}
                        </Text>
                        {isAccepted && (
                          <Icon name="shield-check" size={14} color="#047857" />
                        )}
                      </View>
                      <Text style={styles.docEmail} numberOfLines={1}>
                        {item.doctor?.user?.email || 'Registered Medical Professional'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isPending
                            ? '#FEF3C7'
                            : isAccepted
                            ? '#ECFDF5'
                            : '#FEF2F2',
                        },
                      ]}
                    >
                      <Icon
                        name={isPending ? 'clock' : isAccepted ? 'check-circle' : 'x-circle'}
                        size={11}
                        color={isPending ? '#B45309' : isAccepted ? '#047857' : '#BE123C'}
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color: isPending
                              ? '#B45309'
                              : isAccepted
                              ? '#047857'
                              : '#BE123C',
                          },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {/* Schedule Details Row */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Icon name="calendar-days" size={12} color={Colors.light.primary} />
                      <Text style={styles.detailVal}>
                        {item.dayOfWeek || 'All Days'}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Icon name="clock" size={12} color={Colors.light.primary} />
                      <Text style={styles.detailVal}>
                        {item.startTime && item.endTime
                          ? `${item.startTime} - ${item.endTime}`
                          : 'Standard Hours'}
                      </Text>
                    </View>

                    {item.fee != null && (
                      <View style={styles.feePill}>
                        <Text style={styles.feeLabel}>Fee:</Text>
                        <Text style={styles.feeVal}>₹{item.fee}</Text>
                      </View>
                    )}
                  </View>

                  {/* Actions for Received Pending */}
                  {activeTab === 'received' && isPending && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.declineBtn}
                        onPress={() => handleRespond(item.id, 'REJECT', rawName)}
                        disabled={respondMutation.isPending}
                        activeOpacity={0.8}
                      >
                        <Icon name="x" size={14} color="#DC2626" />
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleRespond(item.id, 'ACCEPT', rawName)}
                        disabled={respondMutation.isPending}
                        activeOpacity={0.85}
                      >
                        {respondMutation.isPending ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Icon name="check" size={14} color="#FFFFFF" />
                            <Text style={styles.acceptBtnText}>Accept Doctor</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </GradientCard>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: Colors.light.surfaceWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBarTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  bannerCard: {
    marginBottom: 0,
  },
  bannerContent: {
    padding: Spacing.four,
    gap: 2,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  bannerIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTagline: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.light.primary,
    letterSpacing: 0.5,
    flex: 1,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerHeading: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  bannerSub: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface100,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  tabBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
  },
  filterPillActive: {
    backgroundColor: Colors.light.primary,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  reqCard: {
    marginBottom: 0,
  },
  reqCardContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  reqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  docAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  docNameCol: {
    flex: 1,
    gap: 2,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  docEmail: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.two,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailVal: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  feePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    marginLeft: 'auto',
  },
  feeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink500,
  },
  feeVal: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 2,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  declineBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  acceptBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  centerStateText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    maxWidth: 280,
  },
});
