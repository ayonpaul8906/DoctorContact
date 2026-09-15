import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useCenterTests,
  useGlobalTests,
  useAddCenterTest,
  useUpdateCenterTest,
  useRemoveCenterTest,
  type CenterTest,
  type DiagnosticTest,
} from '../../hooks/useDiagnostic';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function CenterTestsScreen() {
  const {
    data: centerTests = [],
    isLoading: loadingCenter,
    refetch: refetchCenter,
    isRefetching,
  } = useCenterTests();

  const {
    data: globalTests = [],
    isLoading: loadingGlobal,
  } = useGlobalTests();

  const addTestMutation = useAddCenterTest();
  const updateTestMutation = useUpdateCenterTest();
  const removeTestMutation = useRemoveCenterTest();

  const [searchTerm, setSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<CenterTest | null>(null);

  // Add test form state
  const [selectedGlobalTestId, setSelectedGlobalTestId] = useState<string>('');
  const [newPrice, setNewPrice] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Edit test form state
  const [editPrice, setEditPrice] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);

  // Global tests not yet added to this lab
  const availableGlobalTests = useMemo(() => {
    const existingIds = new Set(centerTests.map((t) => t.testId));
    return globalTests.filter((gt) => !existingIds.has(gt.id));
  }, [globalTests, centerTests]);

  // Filtered center tests
  const filteredTests = useMemo(() => {
    if (!searchTerm.trim()) return centerTests;
    const term = searchTerm.toLowerCase();
    return centerTests.filter(
      (t) =>
        t.diagnosticTest?.name?.toLowerCase().includes(term) ||
        t.diagnosticTest?.description?.toLowerCase().includes(term)
    );
  }, [centerTests, searchTerm]);

  const handleOpenAdd = () => {
    setSelectedGlobalTestId(availableGlobalTests[0]?.id || '');
    setNewPrice('');
    setIsAvailable(true);
    setAddModalOpen(true);
  };

  const handleSaveAdd = async () => {
    if (!selectedGlobalTestId) {
      Alert.alert('Required', 'Please select a diagnostic test from the catalog.');
      return;
    }
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Required', 'Please enter a valid price.');
      return;
    }

    try {
      await addTestMutation.mutateAsync({
        testId: selectedGlobalTestId,
        price: priceNum,
        isAvailable,
      });
      setAddModalOpen(false);
      Alert.alert('Success', 'Diagnostic test added to your center catalog.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add test.');
    }
  };

  const handleOpenEdit = (test: CenterTest) => {
    setSelectedTest(test);
    setEditPrice(String(test.price ?? 0));
    setEditAvailable(test.isAvailable ?? true);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTest) return;
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Required', 'Please enter a valid price.');
      return;
    }

    try {
      await updateTestMutation.mutateAsync({
        testId: selectedTest.testId,
        payload: {
          price: priceNum,
          isAvailable: editAvailable,
        },
      });
      setEditModalOpen(false);
      setSelectedTest(null);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update test.');
    }
  };

  const handleToggleAvailability = async (test: CenterTest) => {
    try {
      await updateTestMutation.mutateAsync({
        testId: test.testId,
        payload: {
          isAvailable: !test.isAvailable,
        },
      });
    } catch (err: any) {
      Alert.alert('Error', 'Failed to toggle availability.');
    }
  };

  const handleRemoveTest = (test: CenterTest) => {
    Alert.alert(
      'Remove Test',
      `Are you sure you want to remove ${test.diagnosticTest?.name || 'this test'} from your offering?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTestMutation.mutateAsync(test.testId);
            } catch (err: any) {
              Alert.alert('Error', 'Failed to remove test.');
            }
          },
        },
      ]
    );
  };

  const isLoading = loadingCenter || loadingGlobal;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Diagnostic Tests & Pricing</Text>
          <Text style={styles.headerSubtitle}>
            Manage your pathology & radiology test catalog
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addTestBtn}
          onPress={handleOpenAdd}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addTestBtnText}>Add Test</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tests by name..."
            placeholderTextColor="#94A3B8"
            value={searchTerm}
            onChangeText={setSearchTerm}
            clearButtonMode="while-editing"
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Icon name="x" size={14} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Loading state */}
      {isLoading && (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading tests catalog...</Text>
        </View>
      )}

      {/* Test List */}
      {!isLoading && (
        <FlatList
          data={filteredTests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetchCenter}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Icon name="flask" size={30} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Tests Configured</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm
                  ? 'No tests found matching your search term.'
                  : 'Start adding diagnostic tests from the global catalogue with your laboratory rates.'}
              </Text>
              {!searchTerm && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={handleOpenAdd}
                >
                  <Text style={styles.emptyAddBtnText}>Add Your First Test</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isAvail = item.isAvailable !== false;
            return (
              <View style={styles.testCard}>
                <View style={styles.testCardHeader}>
                  <View style={styles.testIconBox}>
                    <Icon name="flask" size={18} color="#0F766E" />
                  </View>
                  <View style={styles.testInfo}>
                    <Text style={styles.testName} numberOfLines={1}>
                      {item.diagnosticTest?.name || 'Diagnostic Test'}
                    </Text>
                    {item.diagnosticTest?.description ? (
                      <Text style={styles.testDesc} numberOfLines={1}>
                        {item.diagnosticTest.description}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.testPriceWrap}>
                    <Text style={styles.testPrice}>₹{item.price}</Text>
                    <Text style={styles.testPriceLabel}>Lab Rate</Text>
                  </View>
                </View>

                <View style={styles.testCardFooter}>
                  <View style={styles.availabilityRow}>
                    <Switch
                      value={isAvail}
                      onValueChange={() => handleToggleAvailability(item)}
                      trackColor={{ false: '#E2E8F0', true: '#99F6E4' }}
                      thumbColor={isAvail ? '#0F766E' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.availText,
                        { color: isAvail ? '#0F766E' : '#64748B' },
                      ]}
                    >
                      {isAvail ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>

                  <View style={styles.actionBtnsRow}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => handleOpenEdit(item)}
                    >
                      <Icon name="sliders" size={14} color="#2563EB" />
                      <Text style={styles.editBtnText}>Edit Price</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleRemoveTest(item)}
                    >
                      <Icon name="trash-2" size={14} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ============================================================
          ADD TEST MODAL (Choose from Global Catalog)
      ============================================================ */}
      <Modal
        visible={addModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Test to Center</Text>
              <TouchableOpacity onPress={() => setAddModalOpen(false)}>
                <Icon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {availableGlobalTests.length === 0 ? (
                <View style={styles.noGlobalTestsBox}>
                  <Text style={styles.noGlobalTestsText}>
                    All tests from the global catalog are already added to your lab!
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Select Diagnostic Test</Text>
                  <View style={styles.pickerContainer}>
                    {availableGlobalTests.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[
                          styles.testSelectRow,
                          selectedGlobalTestId === t.id && styles.testSelectRowActive,
                        ]}
                        onPress={() => setSelectedGlobalTestId(t.id)}
                      >
                        <View style={styles.selectRadio}>
                          {selectedGlobalTestId === t.id && (
                            <View style={styles.selectRadioInner} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.testSelectName,
                              selectedGlobalTestId === t.id && styles.testSelectNameActive,
                            ]}
                          >
                            {t.name}
                          </Text>
                          {t.description && (
                            <Text style={styles.testSelectDesc} numberOfLines={1}>
                              {t.description}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Custom Price (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 450"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={newPrice}
                    onChangeText={setNewPrice}
                  />

                  <View style={styles.switchRow}>
                    <Text style={styles.fieldLabel}>Make Available Immediately</Text>
                    <Switch
                      value={isAvailable}
                      onValueChange={setIsAvailable}
                      trackColor={{ false: '#E2E8F0', true: '#99F6E4' }}
                      thumbColor={isAvailable ? '#0F766E' : '#94A3B8'}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      addTestMutation.isPending && { opacity: 0.7 },
                    ]}
                    onPress={handleSaveAdd}
                    disabled={addTestMutation.isPending}
                  >
                    {addTestMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon name="plus" size={16} color="#FFFFFF" />
                        <Text style={styles.submitBtnText}>Add Test to Catalog</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================
          EDIT TEST MODAL
      ============================================================ */}
      <Modal
        visible={editModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setEditModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {selectedTest?.diagnosticTest?.name}
              </Text>
              <TouchableOpacity onPress={() => setEditModalOpen(false)}>
                <Icon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Update Price (₹)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 500"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={editPrice}
                onChangeText={setEditPrice}
              />

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Test Availability</Text>
                <Switch
                  value={editAvailable}
                  onValueChange={setEditAvailable}
                  trackColor={{ false: '#E2E8F0', true: '#99F6E4' }}
                  thumbColor={editAvailable ? '#0F766E' : '#94A3B8'}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  updateTestMutation.isPending && { opacity: 0.7 },
                ]}
                onPress={handleSaveEdit}
                disabled={updateTestMutation.isPending}
              >
                {updateTestMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="save" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.two,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  addTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0F766E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addTestBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 90,
    gap: Spacing.three,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.six,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
  },
  emptyAddBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    marginTop: Spacing.two,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  testCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  testIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  testDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  testPriceWrap: {
    alignItems: 'flex-end',
  },
  testPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F766E',
  },
  testPriceLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  testCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  editBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalScroll: {
    marginTop: Spacing.three,
  },
  modalBody: {
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  pickerContainer: {
    gap: 6,
    marginBottom: Spacing.three,
    maxHeight: 200,
  },
  testSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  testSelectRowActive: {
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
  },
  selectRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F766E',
  },
  testSelectName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  testSelectNameActive: {
    color: '#0F766E',
  },
  testSelectDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: Spacing.three,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    marginBottom: Spacing.four,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  noGlobalTestsBox: {
    padding: Spacing.five,
    alignItems: 'center',
  },
  noGlobalTestsText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
