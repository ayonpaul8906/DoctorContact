import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from './Icon';
import { uploadProfilePhoto } from '../lib/api';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface DoctorProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPhotoUrl?: string | null;
}

export function DoctorProfilePhotoModal({
  isOpen,
  onClose,
  onSuccess,
  currentPhotoUrl,
}: DoctorProfilePhotoModalProps) {
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClose = () => {
    if (isUploading) return;
    setSelectedImage(null);
    onClose();
  };

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo gallery to select a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          name: asset.fileName || 'profile.jpg',
          type: asset.mimeType || 'image/jpeg',
        });
      }
    } catch {
      Alert.alert('Error', 'Unable to pick image from gallery.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow camera access to take a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          name: asset.fileName || 'camera.jpg',
          type: asset.mimeType || 'image/jpeg',
        });
      }
    } catch {
      Alert.alert('Error', 'Unable to take photo with camera.');
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('Selection Required', 'Please select or capture a profile photo first.');
      return;
    }

    setIsUploading(true);
    try {
      await uploadProfilePhoto(selectedImage);
      Alert.alert('Success', 'Profile photo updated successfully!');
      setSelectedImage(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Upload photo error:', err);
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to update profile photo.';
      Alert.alert('Upload Failed', msg);
    } finally {
      setIsUploading(false);
    }
  };

  const previewUri = selectedImage?.uri || currentPhotoUrl || null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Icon name="image" size={16} color="#4338CA" />
              </View>
              <Text style={styles.modalTitle}>Update Profile Photo</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isUploading}
              style={styles.closeBtn}
            >
              <Icon name="x" size={18} color={Colors.light.ink400} />
            </TouchableOpacity>
          </View>

          {/* Preview Container */}
          <View style={styles.previewContainer}>
            {previewUri ? (
              <View style={styles.previewRing}>
                <Image
                  source={{ uri: previewUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={styles.emptyPreviewBox}>
                <Icon name="camera" size={32} color={Colors.light.ink400} />
                <Text style={styles.emptyPreviewText}>No photo selected</Text>
              </View>
            )}
          </View>

          {/* Action Chooser: Camera vs Gallery */}
          <View style={styles.chooseButtonsRow}>
            <TouchableOpacity
              style={styles.chooseBtn}
              onPress={handleTakePhoto}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <Icon name="camera" size={16} color={Colors.light.primary} />
              <Text style={styles.chooseBtnText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chooseBtn}
              onPress={handlePickFromGallery}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <Icon name="image" size={16} color={Colors.light.primary} />
              <Text style={styles.chooseBtnText}>From Gallery</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.recommendText}>
            Recommended: Square photo (500x500px). Maximum file size: 5MB.
          </Text>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              disabled={isUploading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!selectedImage || isUploading) && styles.saveBtnDisabled,
              ]}
              onPress={handleUpload}
              disabled={!selectedImage || isUploading}
              activeOpacity={0.85}
            >
              {isUploading ? (
                <View style={styles.btnLoadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Uploading...</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Save Photo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.five,
    gap: Spacing.four,
    ...Shadows.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radius.full,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  previewRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#EEF2FF',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    ...Shadows.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  emptyPreviewBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.light.surface200,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  emptyPreviewText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink400,
  },
  chooseButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chooseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chooseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  recommendText: {
    fontSize: 11,
    color: Colors.light.ink400,
    textAlign: 'center',
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: 4,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
    backgroundColor: '#4F46E5',
    ...Shadows.sm,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
