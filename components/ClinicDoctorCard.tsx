import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import type { ClinicDoctor } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';
import { getImageUrl } from '../utils/image';

interface ClinicDoctorCardProps {
  doctor: ClinicDoctor;
  onEdit: (doctor: ClinicDoctor) => void;
  onViewQueue?: (doctor: ClinicDoctor) => void;
}

function getDoctorInitials(name?: string) {
  if (!name) return 'DR';
  return name
    .replace(/^(dr\.?\s*)+/i, '')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ClinicDoctorCard({ doctor, onEdit, onViewQueue }: ClinicDoctorCardProps) {
  const doctorName = doctor.user?.name || 'Practicing Doctor';
  const isActive = doctor.user?.isActive ?? true;
  const initials = getDoctorInitials(doctorName);
  const avatarUrl =
    doctor.user?.avatar ||
    doctor.user?.profilePhoto ||
    (doctor as any).profilePhoto ||
    (doctor as any).avatar ||
    null;
  const resolvedAvatar = getImageUrl(avatarUrl);

  return (
    <GradientCard variant="blue" style={styles.card}>
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.doctorInfoRow}>
            <View style={styles.avatarCircle}>
              {resolvedAvatar ? (
                <Image source={{ uri: resolvedAvatar }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>

            <View style={styles.nameCol}>
              <View style={styles.titleRow}>
                <Text style={styles.doctorNameText} numberOfLines={1}>
                  Dr. {doctorName.replace(/^(dr\.?\s*)+/i, '')}
                </Text>
                <Icon name="check-circle" size={14} color="#059669" />
              </View>

              {/* Specialization & Experience Pills */}
              <View style={styles.pillRow}>
                <View style={styles.specPill}>
                  <Text style={styles.specPillText} numberOfLines={1}>
                    {doctor.specialization || 'General Physician'}
                  </Text>
                </View>

                {doctor.experience != null && (
                  <View style={styles.expPill}>
                    <Text style={styles.expPillText}>
                      {doctor.experience} yrs exp
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isActive ? '#ECFDF5' : '#FEF2F2',
                borderColor: isActive ? '#A7F3D0' : '#FECDD3',
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: isActive ? '#047857' : '#DC2626' },
              ]}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Contact info row */}
        {(doctor.user?.email || doctor.user?.phone) && (
          <View style={styles.contactRow}>
            {doctor.user?.phone ? (
              <View style={styles.contactItem}>
                <Icon name="phone" size={12} color={Colors.light.ink500} />
                <Text style={styles.contactText}>{doctor.user.phone}</Text>
              </View>
            ) : null}

            {doctor.user?.email ? (
              <View style={styles.contactItem}>
                <Icon name="mail" size={12} color={Colors.light.ink500} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {doctor.user.email}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Footer Meta: Fee & Schedule & Actions */}
        <View style={styles.footerRow}>
          <View style={styles.feeGroup}>
            <Text style={styles.feeLabel}>CONSULTATION FEE</Text>
            <Text style={styles.feeVal}>
              {doctor.fee != null ? `₹${doctor.fee}` : 'Free'}
            </Text>
          </View>

          {doctor.startTime ? (
            <View style={styles.timeGroup}>
              <Text style={styles.timeLabel}>HOURS</Text>
              <Text style={styles.timeVal}>{doctor.startTime}</Text>
            </View>
          ) : null}

          <View style={styles.actionsGroup}>
            {onViewQueue && (
              <TouchableOpacity
                style={styles.queueBtn}
                onPress={() => onViewQueue(doctor)}
                activeOpacity={0.8}
              >
                <Icon name="list-ordered" size={13} color={Colors.light.primary} />
                <Text style={styles.queueBtnText}>Queue</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => onEdit(doctor)}
              activeOpacity={0.8}
            >
              <Icon name="sliders" size={13} color={Colors.light.ink700} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.three,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  nameCol: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  doctorNameText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  specPill: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  specPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  expPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  expPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 11,
    color: Colors.light.ink600,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface100,
  },
  feeGroup: {
    gap: 1,
  },
  feeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
    letterSpacing: 0.5,
  },
  feeVal: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.primary,
  },
  timeGroup: {
    gap: 1,
  },
  timeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
  },
  timeVal: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  queueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  queueBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.surface100,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
});
