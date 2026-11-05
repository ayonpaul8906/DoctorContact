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
  useAdminDoctors,
  useVerifyDoctor,
  useCreateDoctor,
  useSetFeaturedDoctor,
  useToggleDoctorAvailability,
  type AdminDoctor,
  type CreateDoctorInput,
} from '../../hooks/useAdmin';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

type FilterTab = 'ALL' | 'UNVERIFIED' | 'VERIFIED' | 'FEATURED';

export default function AdminDoctorsScreen() {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for creating doctor
  const [formData, setFormData] = useState<CreateDoctorInput>({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialization: '',
    qualification: '',
    experience: undefined,
    fee: undefined,
    clinicId: undefined,
  });

  const {
    data: doctors = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useAdminDoctors();

  const verifyMutation = useVerifyDoctor();
  const createMutation = useCreateDoctor();
  const featureMutation = useSetFeaturedDoctor();
  const availabilityMutation = useToggleDoctorAvailability();

  // Filter doctors by active tab & search query
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      if (activeTab === 'UNVERIFIED' && doc.isVerified) return false;
      if (activeTab === 'VERIFIED' && !doc.isVerified) return false;
      if (activeTab === 'FEATURED' && !doc.isFeatured) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          doc.name.toLowerCase().includes(q) ||
          (doc.specialization && doc.specialization.toLowerCase().includes(q)) ||
          (doc.clinicName && doc.clinicName.toLowerCase().includes(q)) ||
          (doc.phone && doc.phone.includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [doctors, activeTab, search]);

  const unverifiedCount = useMemo(() => doctors.filter((d) => !d.isVerified).length, [doctors]);
  const verifiedCount = useMemo(() => doctors.filter((d) => d.isVerified).length, [doctors]);
  const featuredCount = useMemo(() => doctors.filter((d) => d.isFeatured).length, [doctors]);

  const handleVerify = (doctor: AdminDoctor) => {
    Alert.alert(
      'Verify Doctor License',
      `Verify credentials and authorize "${doctor.name}" for public consultations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async () => {
            try {
              await verifyMutation.mutateAsync(doctor.id);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to verify doctor.');
            }
          },
        },
      ]
    );
  };

  const handleToggleFeatured = async (doctor: AdminDoctor) => {
    try {
      await featureMutation.mutateAsync({
        doctorId: doctor.id,
        isFeatured: !doctor.isFeatured,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update featured status.');
    }
  };

  const handleToggleAvailability = async (doctor: AdminDoctor) => {
    try {
      await availabilityMutation.mutateAsync({
        doctorId: doctor.id,
        isAvailable: !doctor.isAvailableToday,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update availability.');
    }
  };

  const handleCreateSubmit = async () => {
    if (!formData.name.trim() || !formData.password.trim()) {
      Alert.alert('Validation Error', 'Doctor Name and Password are required.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...formData,
        experience: formData.experience ? Number(formData.experience) : undefined,
        fee: formData.fee ? Number(formData.fee) : undefined,
      });
      Alert.alert('Success', 'Doctor created and added to the registry!');
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        specialization: '',
        qualification: '',
        experience: undefined,
        fee: undefined,
        clinicId: undefined,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to register doctor.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>Doctors Directory</Text>
          <Text style={styles.subtitle}>Credentials, verifications & chamber rosters</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Doctor</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'ALL' && styles.tabItemActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
            All ({doctors.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'UNVERIFIED' && styles.tabItemActive]}
          onPress={() => setActiveTab('UNVERIFIED')}
        >
          <Text style={[styles.tabText, activeTab === 'UNVERIFIED' && styles.tabTextActive]}>
            Pending ({unverifiedCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'VERIFIED' && styles.tabItemActive]}
          onPress={() => setActiveTab('VERIFIED')}
        >
          <Text style={[styles.tabText, activeTab === 'VERIFIED' && styles.tabTextActive]}>
            Verified ({verifiedCount})
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
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Icon name="search" size={16} color={Colors.light.ink400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by doctor name, specialty, clinic..."
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

      {/* Doctors List */}
      <FlatList
        data={filteredDoctors}
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
              <Text style={styles.loadingText}>Loading doctors...</Text>
            </View>
          ) : (
            <View style={styles.centerBox}>
              <Icon name="stethoscope" size={36} color={Colors.light.ink300} />
              <Text style={styles.emptyTitle}>No Doctors Found</Text>
              <Text style={styles.emptySubtitle}>
                {search ? 'Try adjusting your search query.' : 'No doctors match the selected filter.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {item.name?.replace('Dr. ', '')?.charAt(0)?.toUpperCase() || 'D'}
                </Text>
              </View>

              <View style={styles.doctorInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.doctorName} numberOfLines={1}>
                    {item.name}
                  </Text>

                  {/* Featured Star Toggle */}
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

                {item.specialization ? (
                  <View style={styles.specBadge}>
                    <Text style={styles.specBadgeText}>{item.specialization}</Text>
                  </View>
                ) : null}
              </View>

              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  item.isVerified ? styles.statusVerified : styles.statusUnverified,
                ]}
              >
                <Icon
                  name={item.isVerified ? 'check-circle' : 'clock'}
                  size={10}
                  color={item.isVerified ? '#15803D' : '#B45309'}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    item.isVerified ? styles.statusTextVerified : styles.statusTextUnverified,
                  ]}
                >
                  {item.isVerified ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>

            {/* Chamber affiliation */}
            {item.clinicName ? (
              <View style={styles.clinicRow}>
                <Icon name="building" size={12} color={Colors.light.ink500} />
                <Text style={styles.clinicText} numberOfLines={1}>
                  {item.clinicName}
                </Text>
              </View>
            ) : null}

            {/* Qualifications / Experience / Fee */}
            <View style={styles.detailsRow}>
              {item.qualification ? (
                <View style={styles.detailItem}>
                  <Icon name="award" size={11} color={Colors.light.ink500} />
                  <Text style={styles.detailText}>{item.qualification}</Text>
                </View>
              ) : null}
              {item.experience ? (
                <View style={styles.detailItem}>
                  <Icon name="clock" size={11} color={Colors.light.ink500} />
                  <Text style={styles.detailText}>{item.experience} yrs exp</Text>
                </View>
              ) : null}
              {item.fee ? (
                <View style={styles.detailItem}>
                  <Text style={styles.feeText}>₹{item.fee}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.divider} />

            {/* Action Buttons Footer */}
            <View style={styles.cardFooter}>
              {/* Availability Toggle Button */}
              <TouchableOpacity
                style={[
                  styles.availBtn,
                  item.isAvailableToday ? styles.availBtnActive : styles.availBtnInactive,
                ]}
                onPress={() => handleToggleAvailability(item)}
                disabled={availabilityMutation.isPending}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.availDot,
                    item.isAvailableToday ? styles.availDotActive : styles.availDotInactive,
                  ]}
                />
                <Text
                  style={[
                    styles.availBtnText,
                    item.isAvailableToday ? styles.availBtnTextActive : styles.availBtnTextInactive,
                  ]}
                >
                  {item.isAvailableToday ? 'Available Today' : 'Unavailable'}
                </Text>
              </TouchableOpacity>

              {/* Verify Action Button */}
              {!item.isVerified && (
                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={() => handleVerify(item)}
                  disabled={verifyMutation.isPending}
                  activeOpacity={0.8}
                >
                  <Icon name="check" size={13} color="#FFFFFF" />
                  <Text style={styles.verifyBtnText}>Verify Doctor</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      {/* Add Doctor Modal */}
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
                <Text style={styles.modalTitle}>Onboard Medical Practitioner</Text>
                <Text style={styles.modalSubtitle}>Register doctor profile and credentials</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseBtn}
              >
                <Icon name="x" size={20} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Doctor Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dr. Soumya Sen"
                value={formData.name}
                onChangeText={(v) => setFormData({ ...formData, name: v })}
              />

              <Text style={styles.inputLabel}>Medical Specialty</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Cardiologist, Dermatologist, General Physician"
                value={formData.specialization}
                onChangeText={(v) => setFormData({ ...formData, specialization: v })}
              />

              <Text style={styles.inputLabel}>Qualifications</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. MBBS, MD, FRCP"
                value={formData.qualification}
                onChangeText={(v) => setFormData({ ...formData, qualification: v })}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Experience (Yrs)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 10"
                    keyboardType="numeric"
                    value={formData.experience ? String(formData.experience) : ''}
                    onChangeText={(v) => setFormData({ ...formData, experience: v ? Number(v) : undefined })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Consultation Fee (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 500"
                    keyboardType="numeric"
                    value={formData.fee ? String(formData.fee) : ''}
                    onChangeText={(v) => setFormData({ ...formData, fee: v ? Number(v) : undefined })}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="doctor@hospital.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(v) => setFormData({ ...formData, email: v })}
              />

              <Text style={styles.inputLabel}>Mobile Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9830098765"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(v) => setFormData({ ...formData, phone: v })}
              />

              <Text style={styles.inputLabel}>Account Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                secureTextEntry
                value={formData.password}
                onChangeText={(v) => setFormData({ ...formData, password: v })}
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
                    <Icon name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Add Doctor to Registry</Text>
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
    backgroundColor: Colors.light.primary,
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
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
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
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0891B2',
  },
  doctorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  starBtn: {
    padding: 2,
    marginLeft: 6,
  },
  specBadge: {
    backgroundColor: '#F0FDFA',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    marginTop: 3,
  },
  specBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D9488',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusVerified: {
    backgroundColor: '#DCFCE7',
  },
  statusUnverified: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextVerified: {
    color: '#15803D',
  },
  statusTextUnverified: {
    color: '#B45309',
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  clinicText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  feeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
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
  availBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  availBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  availBtnInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  availDotActive: {
    backgroundColor: '#16A34A',
  },
  availDotInactive: {
    backgroundColor: '#94A3B8',
  },
  availBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  availBtnTextActive: {
    color: '#15803D',
  },
  availBtnTextInactive: {
    color: '#64748B',
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  verifyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: Colors.light.primary,
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
