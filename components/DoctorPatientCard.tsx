import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import type { DoctorPatientRecord } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface DoctorPatientCardProps {
  patient: DoctorPatientRecord;
}

function formatDate(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DoctorPatientCard({ patient }: DoctorPatientCardProps) {
  const formattedLastVisit = formatDate(patient.lastConsultationDate);

  return (
    <GradientCard variant="blue" style={styles.card}>
      <View style={styles.content}>
        {/* Top Profile Row */}
        <View style={styles.headerRow}>
          <View style={styles.patientMainInfo}>
            <View style={styles.avatarBox}>
              <Icon name="user" size={20} color="#FFFFFF" />
            </View>

            <View style={styles.nameCol}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {patient.name}
                </Text>
                {patient.bloodGroup ? (
                  <View style={styles.bloodGroupBadge}>
                    <Text style={styles.bloodGroupText}>
                      {patient.bloodGroup}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.demographicsRow}>
                {patient.age != null && (
                  <Text style={styles.demographicsText}>Age: {patient.age} yrs</Text>
                )}
                {patient.gender && (
                  <Text style={styles.demographicsText}>
                    {patient.age != null ? ' • ' : ''}
                    {patient.gender}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Consultations Badge */}
          <View style={styles.consultationsBadge}>
            <Icon name="activity" size={11} color={Colors.light.primary} />
            <Text style={styles.consultationsText}>
              {patient.totalConsultations}{' '}
              {patient.totalConsultations === 1 ? 'Visit' : 'Visits'}
            </Text>
          </View>
        </View>

        {/* Contact Info (if present) */}
        {(patient.phone || patient.email) && (
          <View style={styles.contactRow}>
            {patient.phone ? (
              <View style={styles.contactItem}>
                <Icon name="phone" size={12} color={Colors.light.ink500} />
                <Text style={styles.contactText}>{patient.phone}</Text>
              </View>
            ) : null}

            {patient.email ? (
              <View style={styles.contactItem}>
                <Icon name="mail" size={12} color={Colors.light.ink500} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {patient.email}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Bottom Clinic & Last Visit Row */}
        <View style={styles.footerRow}>
          <View style={styles.clinicItem}>
            <Icon name="building" size={12} color={Colors.light.primary} />
            <Text style={styles.clinicText} numberOfLines={1}>
              {patient.clinicName || 'Clinic Practice'}
            </Text>
          </View>

          {formattedLastVisit ? (
            <View style={styles.lastVisitItem}>
              <Icon name="calendar" size={12} color={Colors.light.ink400} />
              <Text style={styles.lastVisitText}>
                Last Visit: <Text style={styles.lastVisitDate}>{formattedLastVisit}</Text>
              </Text>
            </View>
          ) : null}
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
  patientMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  nameCol: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  nameText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  bloodGroupBadge: {
    backgroundColor: '#FFE4E6',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  bloodGroupText: {
    color: '#BE123C',
    fontSize: 10,
    fontWeight: '800',
  },
  demographicsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demographicsText: {
    fontSize: 11,
    color: Colors.light.ink500,
    fontWeight: '500',
  },
  consultationsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  consultationsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
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
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface200,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  clinicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  clinicText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  lastVisitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastVisitText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  lastVisitDate: {
    fontWeight: '700',
    color: Colors.light.ink800,
  },
});
