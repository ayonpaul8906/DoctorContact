import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useSuperAdminAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
} from '../../hooks/useSuperAdmin';
import { ScreenHeader, EmptyState, Icon } from '../../components';
import { Colors, Spacing, Radius, Typography } from '../../theme';

export default function SuperAdminAnnouncementsScreen() {
  const { data: announcements, isLoading, isError, refetch, isRefetching } =
    useSuperAdminAnnouncements();
  const { mutateAsync: createAnnouncement, isPending: isCreating } = useCreateAnnouncement();
  const { mutateAsync: deleteAnnouncement } = useDeleteAnnouncement();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validation', 'Please provide a title and content for the announcement.');
      return;
    }

    try {
      await createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        isActive,
      });
      setModalVisible(false);
      setTitle('');
      setContent('');
    } catch {
      Alert.alert('Error', 'Failed to publish announcement.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Announcement', 'Are you sure you want to remove this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAnnouncement(id);
          } catch {
            Alert.alert('Error', 'Failed to delete announcement.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={announcements ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#D97706"
            colors={['#D97706']}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Platform Broadcasts"
              subtitle="Global notices and emergency alerts for all users"
              badgeText="Super Admin"
              actionLabel="+ New Notice"
              onActionPress={() => setModalVisible(true)}
            />

            {!isLoading && (
              <Text style={styles.countText}>
                {(announcements ?? []).length} active notice{announcements?.length !== 1 ? 's' : ''}
              </Text>
            )}

            {isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color="#D97706" />
                <Text style={styles.stateText}>Loading announcements...</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !isLoading && !isError ? (
            <EmptyState
              title="No Broadcasts"
              description="No platform announcements posted yet. Tap '+ New Notice' to post one."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Icon name="megaphone" size={16} color="#B45309" />
              </View>
              <View style={styles.headerTitle}>
                <Text style={styles.announcementTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.dateText}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={styles.deleteBtn}
              >
                <Icon name="trash-2" size={16} color={Colors.light.danger} />
              </TouchableOpacity>
            </View>

            <Text style={styles.announcementBody}>{item.content}</Text>
          </View>
        )}
      />

      {/* New Announcement Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Platform Announcement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={20} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.fieldLabel}>Announcement Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Scheduled System Upgrade"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.fieldLabel}>Announcement Content</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Details of the announcement displayed to patients and staff..."
                multiline
                numberOfLines={4}
                value={content}
                onChangeText={setContent}
              />

              <TouchableOpacity
                style={styles.postBtn}
                onPress={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.postBtnText}>Broadcast Notice</Text>
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
    backgroundColor: '#FBFBFC',
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: 80,
  },
  countText: {
    fontSize: 12,
    color: Colors.light.ink500,
    marginBottom: Spacing.two,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  dateText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  deleteBtn: {
    padding: 6,
  },
  announcementBody: {
    fontSize: 13,
    color: Colors.light.ink700,
    lineHeight: 18,
  },
  centerState: {
    padding: Spacing.four,
    alignItems: 'center',
  },
  stateText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  modalForm: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    padding: 10,
    fontSize: 13,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  postBtn: {
    backgroundColor: '#D97706',
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  postBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
