import React, { useState } from 'react';
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
import { useAddDoctor } from '../hooks/useClinic';
import { api } from '../lib/api';
import { Icon } from './Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDoctorModal({ isOpen, onClose }: AddDoctorModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [fee, setFee] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isExistingDoctor, setIsExistingDoctor] = useState(false);

  const addDoctorMutation = useAddDoctor();

  const handleEmailBlur = async () => {
    if (!email || !email.includes('@')) return;
    setIsCheckingEmail(true);
    try {
      const res = await api.get(`/doctors/search-email?email=${email.trim()}`);
      const foundDoctor = res.data?.data?.doctors?.[0];
      if (foundDoctor) {
        setName(foundDoctor.user?.name || name);
        setPhone(foundDoctor.user?.phone || phone);
        setSpecialization(foundDoctor.specialization || specialization);
        setQualification(foundDoctor.qualification || qualification);
        if (foundDoctor.experience != null) setExperience(String(foundDoctor.experience));
        if (foundDoctor.fee != null) setFee(String(foundDoctor.fee));
        setIsExistingDoctor(true);
        Alert.alert('Doctor Found', 'Existing doctor account profile found and auto-filled.');
      } else {
        setIsExistingDoctor(false);
      }
    } catch {
      setIsExistingDoctor(false);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter doctor full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Required', 'Please enter a valid email address.');
      return;
    }
    if (!isExistingDoctor && (!password.trim() || password.length < 6)) {
      Alert.alert('Required', 'Password must be at least 6 characters.');
      return;
    }

    try {
      await addDoctorMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || undefined as any,
        phone: phone.trim() || undefined,
        specialization: specialization.trim() || undefined,
        qualification: qualification.trim() || undefined,
        experience: experience ? parseInt(experience, 10) : undefined,
        fee: fee ? parseInt(fee, 10) : undefined,
        startTime: startTime.trim() || undefined,
      });

      onClose();
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setSpecialization('');
      setQualification('');
      setExperience('');
      setFee('');
      setIsExistingDoctor(false);
      Alert.alert('Doctor Added', 'The doctor account has been registered under your clinic.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to add doctor.');
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Register Clinic Doctor</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="x" size={18} color={Colors.light.ink600} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Doctor Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.formLabel}>Email Address *</Text>
                  {isCheckingEmail && <ActivityIndicator size="small" color={Colors.light.primary} />}
                  {isExistingDoctor && (
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#047857' }}>
                      Existing Doctor Profile Found
                    </Text>
                  )}
                </View>
                <TextInput
                  style={styles.formInput}
                  value={email}
                  onChangeText={setEmail}
                  onBlur={handleEmailBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="rajesh.sharma@example.com"
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {isExistingDoctor ? 'Account Password (Optional for existing doctor)' : 'Temporary Account Password *'}
                </Text>
                <TextInput
                  style={styles.formInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder={isExistingDoctor ? 'Existing password retained' : 'Minimum 6 characters'}
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="+91 98765 43210"
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>

              <View style={styles.rowTwo}>
                <View style={styles.flex1}>
                  <Text style={styles.formLabel}>Specialization</Text>
                  <TextInput
                    style={styles.formInput}
                    value={specialization}
                    onChangeText={setSpecialization}
                    placeholder="Cardiologist"
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
                <Text style={styles.formLabel}>Start Time / Session</Text>
                <TextInput
                  style={styles.formInput}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00 AM"
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSave}
                disabled={addDoctorMutation.isPending}
                activeOpacity={0.85}
              >
                {addDoctorMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Add Doctor to Clinic</Text>
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
