import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import type { Doctor } from '../types';
import { Colors, Spacing, Radius, Typography } from '../theme';

interface BookingDoctorCardProps {
  doctor: Doctor;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function BookingDoctorCard({ doctor }: BookingDoctorCardProps) {
  const doctorName = doctor.user?.name || 'Healthcare Professional';
  const clinicName = doctor.clinic?.clinicName || 'Dewasi Healthcare Clinic';
  const city = doctor.clinic?.city || doctor.clinic?.address || 'Main Campus';
  const experienceYears = doctor.experience ?? 0;

  return (
    <GradientCard variant="blue" style={styles.card}>
      <View style={styles.cardContent}>
        {/* Top Badges Row */}
        <View style={styles.topBadgesRow}>
          {experienceYears > 0 ? (
            <View style={styles.expBadge}>
              <Icon name="star" size={12} color="#EAB308" />
              <Text style={styles.expBadgeText}>{experienceYears}+ yrs exp</Text>
            </View>
          ) : (
            <View style={styles.expBadge}>
              <Icon name="award" size={12} color={Colors.light.primary} />
              <Text style={styles.expBadgeText}>Verified Specialist</Text>
            </View>
          )}

          <View style={styles.availablePill}>
            <View style={styles.greenDot} />
            <Text style={styles.availableText}>Available for Booking</Text>
          </View>
        </View>

        {/* Doctor Main Info */}
        <View style={styles.mainInfoRow}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{getInitials(doctorName)}</Text>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineInnerDot} />
            </View>
          </View>

          <View style={styles.detailsCol}>
            <View style={styles.nameRow}>
              <Text style={styles.doctorName} numberOfLines={1}>
                {doctorName}
              </Text>
              <Icon name="check-circle" size={16} color={Colors.light.primary} />
            </View>

            {doctor.qualification ? (
              <Text style={styles.qualificationText} numberOfLines={1}>
                {doctor.qualification}
              </Text>
            ) : null}

            {doctor.specialization ? (
              <Text style={styles.specializationText} numberOfLines={1}>
                {doctor.specialization}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Clinic & Fee Row */}
        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Icon name="map-pin" size={13} color={Colors.light.primary} />
            <Text style={styles.metaBadgeText} numberOfLines={1}>
              {city} • {clinicName}
            </Text>
          </View>

          {doctor.fee != null ? (
            <View style={styles.feeBadge}>
              <Text style={styles.feeText}>₹{doctor.fee}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.four,
  },
  cardContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  expBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#854D0E',
  },
  availablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  availableText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  mainInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarBox: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  onlineInnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  detailsCol: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  doctorName: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  qualificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  specializationText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface200,
    paddingTop: Spacing.two,
  },
  metaBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.surface50,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  feeBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
  },
  feeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
});
