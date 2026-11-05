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
  useAdminDiagnosticCenters,
  useApproveDiagnosticCenter,
  useRevokeDiagnosticCenter,
  useCreateDiagnosticCenter,
  type AdminDiagnosticCenter,
  type CreateDiagnosticCenterInput,
} from '../../hooks/useAdmin';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

type FilterTab = 'ALL' | 'APPROVED' | 'PENDING';

export default function AdminDiagnosticsScreen() {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState<CreateDiagnosticCenterInput>({
    name: '',
    email: '',
    password: '',
    phone: '',
    centerName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const {
    data: centers = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useAdminDiagnosticCenters();

  const approveMutation = useApproveDiagnosticCenter();
  const revokeMutation = useRevokeDiagnosticCenter();
  const createMutation = useCreateDiagnosticCenter();

  const filteredCenters = useMemo(() => {
    return centers.filter((c) => {
      if (activeTab === 'APPROVED' && !c.isApproved) return false;
      if (activeTab === 'PENDING' && c.isApproved) return false;

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
  }, [centers, activeTab, search]);

  const approvedCount = useMemo(() => centers.filter((c) => c.isApproved).length, [centers]);
  const pendingCount = useMemo(() => centers.filter((c) => !c.isApproved).length, [centers]);

  const handleApprove = (center: AdminDiagnosticCenter) => {
    Alert.alert(
      'Approve Center',
      `Authorize "${center.name}" for public pathology test listings?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approveMutation.mutateAsync(center.id);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to approve center.');
            }
          },
        },
      ]
    );
  };

  const handleRevoke = (center: AdminDiagnosticCenter) => {
    Alert.alert(
      'Revoke Center Approval',
      `Revoke public test authorization for "${center.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeMutation.mutateAsync(center.id);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to revoke center approval.');
            }
          },
        },
      ]
    );
  };

  const handleCreateSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.centerName.trim()) {
      Alert.alert('Validation Error', 'Center Name, Manager Name, Email, and Password are required.');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      Alert.alert('Success', 'Diagnostic Center registered and approved successfully!');
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        centerName: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to register diagnostic center.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>Diagnostic Centers</Text>
          <Text style={styles.subtitle}>Partner pathology labs and diagnostic facilities</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Lab</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'ALL' && styles.tabItemActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
            All ({centers.length})
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
          placeholder="Search lab by name, city, phone..."
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

      {/* Centers List */}
      <FlatList
        data={filteredCenters}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => { refetch(); }}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <Text style={styles.loadingText}>Loading diagnostic labs...</Text>
            </View>
          ) : (
            <View style={styles.centerBox}>
              <Icon name="activity" size={36} color={Colors.light.ink300} />
              <Text style={styles.emptyTitle}>No Diagnostic Centers</Text>
              <Text style={styles.emptySubtitle}>
                {search ? 'Try adjusting your search query.' : 'No diagnostic centers found in this filter tab.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarCircle}>
                <Icon name="activity" size={20} color="#7C3AED" />
              </View>

              <View style={styles.centerInfo}>
                <Text style={styles.centerName} numberOfLines={1}>
                  {item.name}
                </Text>
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

            {item.address ? (
              <Text style={styles.addressText} numberOfLines={2}>
                {item.address}
              </Text>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
              {item.phone ? (
                <View style={styles.phoneRow}>
                  <Icon name="phone" size={12} color={Colors.light.ink500} />
                  <Text style={styles.phoneText}>{item.phone}</Text>
                </View>
              ) : <View />}

              {/* Actions */}
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

      {/* Add Diagnostic Center Modal */}
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
                <Text style={styles.modalTitle}>Register Diagnostic Lab</Text>
                <Text style={styles.modalSubtitle}>Pathology and imaging facility partner onboarding</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseBtn}
              >
                <Icon name="x" size={20} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Diagnostic Center / Lab Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. LifeCare Diagnostic Center"
                value={formData.centerName}
                onChangeText={(v) => setFormData({ ...formData, centerName: v })}
              />

              <Text style={styles.inputLabel}>Manager / In-Charge Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Amitava Ghosh"
                value={formData.name}
                onChangeText={(v) => setFormData({ ...formData, name: v })}
              />

              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="lab@domain.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(v) => setFormData({ ...formData, email: v })}
              />

              <Text style={styles.inputLabel}>Account Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                secureTextEntry
                value={formData.password}
                onChangeText={(v) => setFormData({ ...formData, password: v })}
              />

              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9830022334"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(v) => setFormData({ ...formData, phone: v })}
              />

              <Text style={styles.inputLabel}>Lab Physical Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Floor, building, street..."
                value={formData.address}
                onChangeText={(v) => setFormData({ ...formData, address: v })}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Kolkata"
                    value={formData.city}
                    onChangeText={(v) => setFormData({ ...formData, city: v })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Pincode</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="700029"
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
                    <Text style={styles.submitBtnText}>Create Diagnostic Facility</Text>
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
    backgroundColor: '#7C3AED',
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
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
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
    backgroundColor: '#FDF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
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
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
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
    color: Colors.light.ink500,
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
    backgroundColor: '#7C3AED',
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
