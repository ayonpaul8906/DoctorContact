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
  useAdminClinics,
  useApproveClinic,
  useRevokeClinic,
  useCreateClinic,
  useSetFeaturedClinic,
  type AdminClinic,
  type CreateClinicInput,
} from '../../hooks/useAdmin';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

type FilterTab = 'ALL' | 'FEATURED' | 'APPROVED' | 'PENDING';

export default function SuperAdminClinicsScreen() {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for Add Clinic Modal
  const [formData, setFormData] = useState<CreateClinicInput>({
    name: '',
    email: '',
    password: '',
    phone: '',
    clinicName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useAdminClinics({
    limit: 100,
  });

  const approveMutation = useApproveClinic();
  const revokeMutation = useRevokeClinic();
  const createMutation = useCreateClinic();
  const featureMutation = useSetFeaturedClinic();

  const clinics = data?.clinics ?? [];

  // Filter by tab & search query
  const filteredClinics = useMemo(() => {
    return clinics.filter((c) => {
      // Tab filter
      if (activeTab === 'FEATURED' && !c.isFeatured) return false;
      if (activeTab === 'APPROVED' && !c.isApproved) return false;
      if (activeTab === 'PENDING' && c.isApproved) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          c.name.toLowerCase().includes(q) ||
          (c.city && c.city.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [clinics, activeTab, search]);

  const featuredCount = useMemo(() => clinics.filter((c) => c.isFeatured).length, [clinics]);
  const approvedCount = useMemo(() => clinics.filter((c) => c.isApproved).length, [clinics]);
  const pendingCount = useMemo(() => clinics.filter((c) => !c.isApproved).length, [clinics]);

  const handleApprove = (clinic: AdminClinic) => {
    Alert.alert(
      'Approve Clinic',
      `Authorize "${clinic.name}" for live patient appointments and queue operations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approveMutation.mutateAsync(clinic.id);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to approve clinic.');
            }
          },
        },
      ]
    );
  };

  const handleRevoke = (clinic: AdminClinic) => {
    Alert.alert(
      'Revoke Clinic Approval',
      `Revoke booking authorization for "${clinic.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeMutation.mutateAsync(clinic.id);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to revoke approval.');
            }
          },
        },
      ]
    );
  };

  const handleToggleFeatured = async (clinic: AdminClinic) => {
    try {
      await featureMutation.mutateAsync({
        clinicId: clinic.id,
        isFeatured: !clinic.isFeatured,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update featured status.');
    }
  };

  const handleCreateSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.clinicName.trim()) {
      Alert.alert('Validation Error', 'Owner Name, Email, Password, and Clinic Name are required.');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      Alert.alert('Success', 'Clinic onboarded and authorized successfully!');
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        clinicName: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to onboard clinic.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>Clinics Governance</Text>
          <Text style={styles.subtitle}>Super Admin facility controls & badges</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Clinic</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'ALL' && styles.tabItemActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
            All ({clinics.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'FEATURED' && styles.tabItemActive]}
          onPress={() => setActiveTab('FEATURED')}
        >
          <Text style={[styles.tabText, activeTab === 'FEATURED' && styles.tabTextActive]}>
            Featured ({featuredCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'APPROVED' && styles.tabItemActive]}
          onPress={() => setActiveTab('APPROVED')}
        >
          <Text style={[styles.tabText, activeTab === 'APPROVED' && styles.tabTextActive]}>
            Approved ({approvedCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'PENDING' && styles.tabItemActive]}
          onPress={() => setActiveTab('PENDING')}
        >
          <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Icon name="search" size={16} color={Colors.light.ink400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by clinic name, city, phone..."
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

      {/* Clinics List */}
      <FlatList
        data={filteredClinics}
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
              <Text style={styles.loadingText}>Loading clinics registry...</Text>
            </View>
          ) : (
            <View style={styles.centerBox}>
              <Icon name="building" size={36} color={Colors.light.ink300} />
              <Text style={styles.emptyTitle}>No Clinics Found</Text>
              <Text style={styles.emptySubtitle}>
                {search ? 'No facilities match your search.' : 'No clinics match this filter.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Card Top */}
            <View style={styles.cardHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {item.name?.charAt(0)?.toUpperCase() || 'C'}
                </Text>
              </View>

              <View style={styles.clinicDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.clinicName} numberOfLines={1}>
                    {item.name}
                  </Text>

                  {/* Star Toggle for Featured */}
                  <TouchableOpacity
                    onPress={() => handleToggleFeatured(item)}
                    disabled={featureMutation.isPending}
                    style={styles.starBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon
                      name="star"
                      size={18}
                      color={item.isFeatured ? '#EAB308' : '#CBD5E1'}
                    />
                  </TouchableOpacity>
                </View>

                {item.city ? (
                  <View style={styles.locationRow}>
                    <Icon name="map-pin" size={12} color={Colors.light.ink500} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {item.city}{item.state ? `, ${item.state}` : ''}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  item.isApproved ? styles.statusApproved : styles.statusPending,
                ]}
              >
                <Icon
                  name={item.isApproved ? 'check-circle' : 'clock'}
                  size={10}
                  color={item.isApproved ? '#15803D' : '#B45309'}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    item.isApproved ? styles.statusTextApproved : styles.statusTextPending,
                  ]}
                >
                  {item.isApproved ? 'Approved' : 'Pending'}
                </Text>
              </View>
            </View>

            {/* Address */}
            {item.address ? (
              <Text style={styles.addressText} numberOfLines={2}>
                {item.address}
              </Text>
            ) : null}

            <View style={styles.divider} />

            {/* Bottom Row */}
            <View style={styles.cardFooter}>
              <View style={styles.metaRow}>
                {item.phone ? (
                  <View style={styles.metaItem}>
                    <Icon name="phone" size={12} color={Colors.light.ink500} />
                    <Text style={styles.metaText}>{item.phone}</Text>
                  </View>
                ) : null}
                <View style={styles.metaItem}>
                  <Icon name="stethoscope" size={12} color={Colors.light.ink500} />
                  <Text style={styles.metaText}>{item.doctorCount ?? 0} Doctor{item.doctorCount !== 1 ? 's' : ''}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                {!item.isApproved ? (
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(item)}
                    disabled={approveMutation.isPending}
                    activeOpacity={0.8}
                  >
                    <Icon name="check" size={13} color="#FFFFFF" />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.revokeBtn}
                    onPress={() => handleRevoke(item)}
                    disabled={revokeMutation.isPending}
                    activeOpacity={0.8}
                  >
                    <Icon name="x-circle" size={13} color="#DC2626" />
                    <Text style={styles.revokeBtnText}>Revoke</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      />

      {/* Add Clinic Modal */}
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
                <Text style={styles.modalTitle}>Onboard Healthcare Facility</Text>
                <Text style={styles.modalSubtitle}>Direct Super Admin clinic authorization</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseBtn}
              >
                <Icon name="x" size={20} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Clinic / Chamber Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Apollo Polyclinic"
                value={formData.clinicName}
                onChangeText={(v) => setFormData({ ...formData, clinicName: v })}
              />

              <Text style={styles.inputLabel}>Administrator / Doctor In-Charge *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dr. Alok Bannerjee"
                value={formData.name}
                onChangeText={(v) => setFormData({ ...formData, name: v })}
              />

              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="clinic@domain.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(v) => setFormData({ ...formData, email: v })}
              />

              <Text style={styles.inputLabel}>Account Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                secureTextEntry
                value={formData.password}
                onChangeText={(v) => setFormData({ ...formData, password: v })}
              />

              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9830012345"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(v) => setFormData({ ...formData, phone: v })}
              />

              <Text style={styles.inputLabel}>Chamber Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Street address, building number..."
                value={formData.address}
                onChangeText={(v) => setFormData({ ...formData, address: v })}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Siliguri"
                    value={formData.city}
                    onChangeText={(v) => setFormData({ ...formData, city: v })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Pincode</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="734001"
                    keyboardType="numeric"
                    value={formData.pincode}
                    onChangeText={(v) => setFormData({ ...formData, pincode: v })}
                  />
                </View>
              </View>

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
                    <Icon name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Onboard & Authorize Clinic</Text>
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
    gap: 4,
    backgroundColor: '#D97706',
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
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D97706',
  },
  clinicDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  clinicName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  starBtn: {
    padding: 2,
    marginLeft: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextApproved: {
    color: '#15803D',
  },
  statusTextPending: {
    color: '#B45309',
  },
  addressText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 16,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  approveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  revokeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
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
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
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
