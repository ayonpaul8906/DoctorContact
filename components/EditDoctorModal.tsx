import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useEditDoctor } from '../hooks/useClinic';
import { Icon } from './Icon';
import type { ClinicDoctor } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface EditDoctorModalProps {
  doctor: ClinicDoctor | null;
  onClose: () => void;
}

export function EditDoctorModal({ doctor, onClose }: EditDoctorModalProps) {
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [fee, setFee] = useState('');
  const [startTime, setStartTime] = useState('');
  const [queueMode, setQueueMode] = useState<'LIVE' | 'PRIVATE' | 'TIME_SLOT'>('LIVE');

  useEffect(() => {
    if (doctor) {
      setSpecialization(doctor.specialization || '');
      setQualification(doctor.qualification || '');
      setExperience(doctor.experience != null ? String(doctor.experience) : '');
      setFee(doctor.fee != null ? String(doctor.fee) : '');
      setStartTime(doctor.startTime || '');
      setQueueMode(doctor.queueMode || 'LIVE');
    }
  }, [doctor]);

  const editDoctorMutation = useEditDoctor();

  const handleSave = async () => {
    if (!doctor) return;

    try {
      await editDoctorMutation.mutateAsync({
        doctorId: doctor.id,
        specialization: specialization.trim() || undefined,
        qualification: qualification.trim() || undefined,
        experience: experience ? parseInt(experience, 10) : undefined,
        fee: fee ? parseInt(fee, 10) : undefined,
        startTime: startTime.trim() || undefined,
        queueMode,
      });

      onClose();
      Alert.alert('Doctor Updated', 'Doctor profile and practice parameters have been updated.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to update doctor.');
    }
  };

  return (
    <Modal visible={Boolean(doctor)} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Edit Doctor Parameters</Text>
              <Text style={styles.modalSub}>Dr. {doctor?.user?.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="x" size={18} color={Colors.light.ink600} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              <View style={styles.rowTwo}>
                <View style={styles.flex1}>
                  <Text style={styles.formLabel}>Specialization</Text>
                  <TextInput
                    style={styles.formInput}
                    value={specialization}
                    onChangeText={setSpecialization}
                    placeholder="e.g. Cardiologist"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <View style={styles.flex1}>
                  <Text style={styles.formLabel}>Qualification</Text>
                  <TextInput
                    style={styles.formInput}
                    value={qualification}
                    onChangeText={setQualification}
                    placeholder="MBBS, MD"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>
              </View>

              <View style={styles.rowTwo}>
                <View style={styles.flex1}>
                  <Text style={styles.formLabel}>Experience (Yrs)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={experience}
                    onChangeText={setExperience}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <View style={styles.flex1}>
                  <Text style={styles.formLabel}>Consultation Fee (₹)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={fee}
                    onChangeText={setFee}
                    keyboardType="numeric"
                    placeholder="500"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Consultation Start Time</Text>
                <TextInput
                  style={styles.formInput}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00 AM"
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>

              {/* Queue Mode selector */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Queue Mode</Text>
                <View style={styles.queueModeRow}>
                  {(['LIVE', 'TIME_SLOT', 'PRIVATE'] as const).map((mode) => {
                    const isSel = queueMode === mode;
                    return (
                      <TouchableOpacity
                        key={mode}
                        style={[styles.modeChip, isSel && styles.modeChipActive]}
                        onPress={() => setQueueMode(mode)}
                      >
                        <Text style={[styles.modeChipText, isSel && styles.modeChipTextActive]}>
                          {mode === 'LIVE' ? 'Live Queue' : mode === 'TIME_SLOT' ? 'Time Slot' : 'Private'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSave}
                disabled={editDoctorMutation.isPending}
                activeOpacity={0.85}
              >
                {editDoctorMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Parameters</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.five,
    maxHeight: '90%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
    paddingBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  modalSub: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    marginTop: Spacing.two,
  },
  formContainer: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  formGroup: {
    gap: 4,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
    gap: 4,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
    textTransform: 'uppercase',
  },
  formInput: {
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  queueModeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
    alignItems: 'center',
  },
  modeChipActive: {
    backgroundColor: Colors.light.primary,
  },
  modeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  modeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Shadows.sm,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
