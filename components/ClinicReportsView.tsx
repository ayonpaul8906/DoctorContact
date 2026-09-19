import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  useClinicDoctors,
  useClinicProfile,
  usePeriodReport,
  useGrowthReport,
  useDailyDashboard,
} from '../hooks/useClinic';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import { StatCard } from './StatCard';
import { DatePickerModal } from './DatePickerModal';
import type { ClinicDoctor } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';
import { getImageUrl } from '../utils/image';
import { TokenStorage } from '../lib/secure-store';
import { Config } from '../lib/config';
import { api, getAccessToken } from '../lib/api';

const PERIOD_PILLS: { key: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'custom', label: 'Custom' },
];

const GRANULARITY_PILLS: { key: 'daily' | 'weekly' | 'monthly' | 'yearly'; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || 'Select Date';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDisplayMonth(monthStr: string): string {
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) return monthStr || 'Select Month';
  const [y, m] = monthStr.split('-').map(Number);
  const dt = new Date(y, m - 1, 1);
  return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

interface MonthPickerModalProps {
  visible: boolean;
  value: string; // YYYY-MM
  onSelect: (val: string) => void;
  onClose: () => void;
}

const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function MonthPickerModal({ visible, value, onSelect, onClose }: MonthPickerModalProps) {
  const initialYear = useMemo(() => {
    if (value && /^\d{4}-\d{2}$/.test(value)) {
      return Number(value.split('-')[0]);
    }
    return new Date().getFullYear();
  }, [value]);

  const [selectedYear, setSelectedYear] = useState(initialYear);

  useEffect(() => {
    if (visible && value && /^\d{4}-\d{2}$/.test(value)) {
      setSelectedYear(Number(value.split('-')[0]));
    }
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.pickerModalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} activeOpacity={0.7}>
              <Icon name="x" size={18} color={Colors.light.ink600} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalYearRow}>
            <TouchableOpacity
              style={styles.yearStepBtn}
              onPress={() => setSelectedYear((y) => y - 1)}
              activeOpacity={0.7}
            >
              <Icon name="chevron-left" size={16} color={Colors.light.ink800} />
            </TouchableOpacity>
            <Text style={styles.modalYearText}>{selectedYear}</Text>
            <TouchableOpacity
              style={styles.yearStepBtn}
              onPress={() => setSelectedYear((y) => y + 1)}
              activeOpacity={0.7}
            >
              <Icon name="chevron-right" size={16} color={Colors.light.ink800} />
            </TouchableOpacity>
          </View>

          <View style={styles.monthGrid}>
            {MONTH_SHORT_NAMES.map((mName, idx) => {
              const monthStr = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
              const isSelected = value === monthStr;
              return (
                <TouchableOpacity
                  key={mName}
                  style={[styles.monthGridBtn, isSelected && styles.monthGridBtnActive]}
                  onPress={() => {
                    onSelect(monthStr);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.monthGridText, isSelected && styles.monthGridTextActive]}>
                    {mName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ClinicReportsView() {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonth = useMemo(() => today.slice(0, 7), [today]);
  const currentYear = useMemo(() => String(new Date().getFullYear()), []);

  // Selection states
  const [selectedDoctor, setSelectedDoctor] = useState<ClinicDoctor | 'ALL' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Period report parameters
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Growth report parameters
  const [growthGranularity, setGrowthGranularity] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const sixMonthsAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  }, []);
  const [growthStartDate, setGrowthStartDate] = useState(sixMonthsAgo);
  const [growthEndDate, setGrowthEndDate] = useState(today);

  // Date picker modal controls
  const [activeDatePicker, setActiveDatePicker] = useState<
    'periodDate' | 'periodStartDate' | 'periodEndDate' | 'growthStartDate' | 'growthEndDate' | null
  >(null);
  const [showMonthModal, setShowMonthModal] = useState(false);

  // Data Queries
  const { data: clinic, isLoading: loadingClinic } = useClinicProfile();
  const { data: doctors = [], isLoading: loadingDoctors } = useClinicDoctors();

  const doctorId = selectedDoctor && selectedDoctor !== 'ALL' ? selectedDoctor.id : undefined;

  const periodParams = useMemo(() => {
    const base: any = {};
    if (doctorId) base.doctorId = doctorId;

    if (period === 'daily') return { ...base, date };
    if (period === 'weekly') return { ...base, date };
    if (period === 'monthly') return { ...base, month };
    if (period === 'yearly') return { ...base, year };
    if (period === 'custom') return { ...base, startDate, endDate };
    return base;
  }, [period, date, month, year, startDate, endDate, doctorId]);

  const {
    data: periodReport,
    isLoading: loadingPeriodReport,
    refetch: refetchPeriodReport,
  } = usePeriodReport(period, periodParams);

  const {
    data: growthReport,
    isLoading: loadingGrowthReport,
  } = useGrowthReport(growthGranularity, { startDate: growthStartDate, endDate: growthEndDate });

  const { data: dailyDashboard } = useDailyDashboard(period === 'daily' ? date : undefined);

  // Doctor search filtering
  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return doctors;
    const q = searchQuery.toLowerCase().trim();
    return doctors.filter((doc) => {
      const name = (doc.user?.name || '').toLowerCase();
      const spec = (doc.specialization || '').toLowerCase();
      return name.includes(q) || spec.includes(q);
    });
  }, [doctors, searchQuery]);

  const doctorDisplayName = useMemo(() => {
    if (selectedDoctor === 'ALL') return 'Overall Clinic Practice';
    if (selectedDoctor) return `Dr. ${selectedDoctor.user?.name || 'Doctor'}`;
    return 'Clinic Practice';
  }, [selectedDoctor]);

  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'excel' | 'patientList' | null>(null);

  const handleDownload = async (format: 'pdf' | 'excel') => {
    try {
      setDownloadingFormat(format);
      const token = (await TokenStorage.getAccessToken()) || getAccessToken();

      const queryParams: any = { format };
      if (periodParams.date) queryParams.date = periodParams.date;
      if (periodParams.month) queryParams.month = periodParams.month;
      if (periodParams.year) queryParams.year = periodParams.year;
      if (periodParams.startDate) queryParams.startDate = periodParams.startDate;
      if (periodParams.endDate) queryParams.endDate = periodParams.endDate;
      if (periodParams.doctorId) queryParams.doctorId = periodParams.doctorId;

      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const fileName = `clinic-report-${period}-${Date.now()}.${ext}`;

      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
        const res = await api.get(`/reports/${period}`, {
          params: queryParams,
          responseType: 'blob',
        });
        const blob = new Blob([res.data], {
          type:
            format === 'pdf'
              ? 'application/pdf'
              : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => {
          try {
            window.URL.revokeObjectURL(blobUrl);
          } catch {}
        }, 15000);
        return;
      }

      // Native Mobile: download file using FileSystem with Authorization header
      if (!token) {
        Alert.alert('Authentication Error', 'Access token is missing. Please log in again.');
        return;
      }

      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v != null) params.append(k, String(v));
      });

      const downloadUrl = `${Config.API_URL}/reports/${period}?${params.toString()}`;
      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
      const fileUri = `${baseDir}${fileName}`;

      const res = await FileSystem.downloadAsync(downloadUrl, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status >= 400) {
        let errDetail = `Status code ${res.status}`;
        try {
          const content = await FileSystem.readAsStringAsync(res.uri);
          const parsed = JSON.parse(content);
          if (parsed.message) errDetail = parsed.message;
        } catch {}
        throw new Error(errDetail);
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri, {
          mimeType:
            format === 'pdf'
              ? 'application/pdf'
              : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Clinic Report (${format.toUpperCase()})`,
          UTI: format === 'pdf' ? 'com.adobe.pdf' : 'org.openxmlformats.spreadsheetml.sheet',
        });
      } else {
        Alert.alert('Downloaded', 'Report downloaded successfully to device.');
      }
    } catch (err: any) {
      let msg = err?.message || 'Failed to download report.';
      if (err?.response?.data instanceof Blob) {
        try {
          const txt = await err.response.data.text();
          const j = JSON.parse(txt);
          if (j.message) msg = j.message;
        } catch {}
      } else if (err?.response?.data?.message) {
        msg = err.response.data.message;
      }
      Alert.alert('Download Error', msg);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadPatientList = async () => {
    try {
      setDownloadingFormat('patientList');
      const token = (await TokenStorage.getAccessToken()) || getAccessToken();

      let endpoint = '/reports/patients/pdf';
      const queryParams: any = {};
      if (selectedDoctor && selectedDoctor !== 'ALL') {
        const clinicId = clinic?.id || '';
        endpoint = `/reports/doctors/${selectedDoctor.id}/clinics/${clinicId}/patients/pdf`;
        queryParams.date = today;
      }

      const fileName = `patient-list-${today}-${Date.now()}.pdf`;

      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
        const res = await api.get(endpoint, {
          params: queryParams,
          responseType: 'blob',
        });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => {
          try {
            window.URL.revokeObjectURL(blobUrl);
          } catch {}
        }, 15000);
        return;
      }

      // Native Mobile
      if (!token) {
        Alert.alert('Authentication Error', 'Access token is missing. Please log in again.');
        return;
      }

      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v != null) params.append(k, String(v));
      });

      const downloadUrl = `${Config.API_URL}${endpoint}?${params.toString()}`;
      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
      const fileUri = `${baseDir}${fileName}`;

      const res = await FileSystem.downloadAsync(downloadUrl, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status >= 400) {
        let errDetail = `Status code ${res.status}`;
        try {
          const content = await FileSystem.readAsStringAsync(res.uri);
          const parsed = JSON.parse(content);
          if (parsed.message) errDetail = parsed.message;
        } catch {}
        throw new Error(errDetail);
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Patient List (PDF)',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Downloaded', 'Patient list downloaded successfully to device.');
      }
    } catch (err: any) {
      let msg = err?.message || 'Failed to download patient list.';
      if (err?.response?.data instanceof Blob) {
        try {
          const txt = await err.response.data.text();
          const j = JSON.parse(txt);
          if (j.message) msg = j.message;
        } catch {}
      } else if (err?.response?.data?.message) {
        msg = err.response.data.message;
      }
      Alert.alert('Download Error', msg);
    } finally {
      setDownloadingFormat(null);
    }
  };

  // ============================================================
  // STAGE 1: DOCTOR SELECTION HUB (Just like webapp)
  // ============================================================
  if (!selectedDoctor) {
    return (
      <View style={styles.container}>
        {/* Header Title */}
        <View style={styles.hubHeader}>
          <Text style={styles.hubTitle}>Select Doctor for Report</Text>
          <Text style={styles.hubSubtitle}>
            Choose a doctor to generate their individual report or view the overall clinic report.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Icon name="search" size={16} color={Colors.light.ink400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctor by name or specialization..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.ink400}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
              <Icon name="x" size={14} color={Colors.light.ink400} />
            </TouchableOpacity>
          )}
        </View>

        {/* 1. Overall Clinic Report Card */}
        <TouchableOpacity
          style={styles.overallClinicCard}
          onPress={() => setSelectedDoctor('ALL')}
          activeOpacity={0.88}
        >
          <GradientCard variant="blue" style={styles.overallGradientCard}>
            <View style={styles.overallContent}>
              <View style={styles.overallTopRow}>
                <View style={styles.overallLogoBox}>
                  {clinic?.logo ? (
                    <Image source={{ uri: getImageUrl(clinic.logo) }} style={styles.overallLogoImg} />
                  ) : (
                    <Icon name="building" size={24} color="#FFFFFF" />
                  )}
                </View>

                <View style={styles.overallMetaCol}>
                  <View style={styles.overallTagRow}>
                    <Text style={styles.overallTagText}>ENTIRE CLINICAL ECOSYSTEM</Text>
                    <View style={styles.verifiedPill}>
                      <Icon name="check-circle" size={10} color="#047857" />
                      <Text style={styles.verifiedPillText}>Verified</Text>
                    </View>
                  </View>

                  <Text style={styles.overallTitle}>Overall Clinic Report</Text>
                  <Text style={styles.overallSubText}>
                    {clinic?.clinicName || 'Clinic Practice'} • All Associated Doctors
                  </Text>
                </View>
              </View>

              <View style={styles.overallActionFooter}>
                <Text style={styles.overallActionText}>View Practice-Wide Analytics</Text>
                <Icon name="arrow-right" size={14} color={Colors.light.primary} />
              </View>
            </View>
          </GradientCard>
        </TouchableOpacity>

        {/* 2. Individual Doctor Cards List */}
        <View style={styles.doctorsListSection}>
          <Text style={styles.sectionHeading}>
            PRACTICING DOCTORS ({filteredDoctors.length})
          </Text>

          {loadingDoctors ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <Text style={styles.centerStateText}>Loading practicing doctors...</Text>
            </View>
          ) : filteredDoctors.length === 0 ? (
            <View style={styles.emptySearchBox}>
              <Icon name="search" size={24} color={Colors.light.ink400} />
              <Text style={styles.emptySearchTitle}>No doctors found</Text>
              <Text style={styles.emptySearchSub}>
                No doctors match "{searchQuery}"
              </Text>
            </View>
          ) : (
            <View style={styles.docGrid}>
              {filteredDoctors.map((doc) => {
                const docName = doc.user?.name || 'Doctor';
                const avatar = doc.avatar || doc.profilePhoto;
                const exp = doc.experience ?? 0;

                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={styles.docCard}
                    onPress={() => setSelectedDoctor(doc)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.docCardTopRow}>
                      <View style={styles.docAvatarWrap}>
                        {avatar ? (
                          <Image source={{ uri: getImageUrl(avatar) }} style={styles.docAvatarImg} />
                        ) : (
                          <View style={styles.docAvatarFallback}>
                            <Text style={styles.docInitials}>
                              {docName
                                .split(' ')
                                .map((p) => p[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.docCardMeta}>
                        <View style={styles.docCardNameRow}>
                          <Text style={styles.docCardName} numberOfLines={1}>
                            Dr. {docName}
                          </Text>
                          <Icon name="check-circle" size={14} color="#10B981" />
                        </View>

                        <View style={styles.specRow}>
                          <Icon name="stethoscope" size={11} color={Colors.light.primary} />
                          <Text style={styles.docCardSpec} numberOfLines={1}>
                            {doc.specialization || 'General Physician'}
                          </Text>
                        </View>

                        {exp > 0 && (
                          <View style={styles.expPill}>
                            <Icon name="award" size={10} color="#D97706" />
                            <Text style={styles.expPillText}>{exp}+ years experience</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.docCardActionRow}>
                      <Text style={styles.docCardActionText}>Generate Report</Text>
                      <Icon name="chevron-right" size={14} color={Colors.light.primary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  }

  // ============================================================
  // STAGE 2: REPORT VIEW (Doctor / Clinic Selected)
  // ============================================================
  const growthSummary = growthReport?.summary;
  const growthRate = growthSummary?.growthRatePercent ?? 0;
  const isPositiveGrowth = growthRate >= 0;

  return (
    <View style={styles.container}>
      {/* Back to Selection Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setSelectedDoctor(null)}
        activeOpacity={0.7}
      >
        <Icon name="chevron-left" size={16} color={Colors.light.primary} />
        <Text style={styles.backButtonText}>Back to Doctor Selection</Text>
      </TouchableOpacity>

      {/* Hero Banner Card */}
      <GradientCard variant="blue" style={styles.heroBanner}>
        <View style={styles.heroBannerContent}>
          <View style={styles.heroBannerTop}>
            <View style={styles.heroIconBox}>
              <Icon name="trending-up" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.heroBannerTag}>PRACTICE PERFORMANCE</Text>
            <View style={styles.analyticsBadge}>
              <Icon name="sparkles" size={10} color="#047857" />
              <Text style={styles.analyticsBadgeText}>Analytics</Text>
            </View>
          </View>

          <Text style={styles.heroBannerHeading}>Reports for {doctorDisplayName}</Text>
          <Text style={styles.heroBannerSub}>
            Comprehensive appointment distribution, revenue estimations, and patient growth
          </Text>

          {/* Patient List Download Pill */}
          <View style={styles.heroDownloadRow}>
            <TouchableOpacity
              style={styles.heroDownloadBtn}
              onPress={handleDownloadPatientList}
              disabled={downloadingFormat !== null}
              activeOpacity={0.8}
            >
              {downloadingFormat === 'patientList' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="file-text" size={13} color="#FFFFFF" />
                  <Text style={styles.heroDownloadBtnText}>Download Patient List (PDF)</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </GradientCard>

      {/* ========================================================
          1. PERIOD REPORT CARD
      ======================================================== */}
      <GradientCard variant="indigo" style={styles.periodCard}>
        <View style={styles.periodCardContent}>
          {/* Card Title & Download Actions */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: '#4F46E5' }]}>
                <Icon name="calendar-days" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.cardHeaderTitle}>Patient Activity Report</Text>
                <Text style={styles.cardHeaderSub}>Consultation breakdown & estimated revenue</Text>
              </View>
            </View>

            {/* PDF & Excel Download Buttons (matching webapp) */}
            <View style={styles.downloadButtonsRow}>
              <TouchableOpacity
                style={[styles.downloadBtn, styles.pdfBtn]}
                onPress={() => handleDownload('pdf')}
                disabled={downloadingFormat !== null}
                activeOpacity={0.8}
              >
                {downloadingFormat === 'pdf' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="file-text" size={12} color="#FFFFFF" />
                    <Text style={styles.downloadBtnText}>PDF</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.downloadBtn, styles.excelBtn]}
                onPress={() => handleDownload('excel')}
                disabled={downloadingFormat !== null}
                activeOpacity={0.8}
              >
                {downloadingFormat === 'excel' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="file-spreadsheet" size={12} color="#FFFFFF" />
                    <Text style={styles.downloadBtnText}>Excel</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Period Selector Pills */}
          <View style={styles.periodPillRow}>
            {PERIOD_PILLS.map((p) => {
              const isSel = period === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.periodPillBtn, isSel && styles.periodPillBtnActive]}
                  onPress={() => setPeriod(p.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.periodPillBtnText, isSel && styles.periodPillBtnTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Period Filter Inputs - View Only, Date Pickups */}
          <View style={styles.filterInputsBox}>
            {(period === 'daily' || period === 'weekly') && (
              <View style={styles.filterInputGroup}>
                <Text style={styles.inputLabel}>
                  {period === 'weekly' ? 'WEEK OF' : 'DATE'}
                </Text>
                <TouchableOpacity
                  style={styles.pickerTriggerBtn}
                  onPress={() => setActiveDatePicker('periodDate')}
                  activeOpacity={0.8}
                >
                  <View style={styles.pickerTriggerLeft}>
                    <Icon name="calendar" size={15} color={Colors.light.primary} />
                    <Text style={styles.pickerTriggerText}>{formatDisplayDate(date)}</Text>
                  </View>
                  <Icon name="chevron-down" size={14} color={Colors.light.ink400} />
                </TouchableOpacity>
              </View>
            )}

            {period === 'monthly' && (
              <View style={styles.filterInputGroup}>
                <Text style={styles.inputLabel}>MONTH</Text>
                <TouchableOpacity
                  style={styles.pickerTriggerBtn}
                  onPress={() => setShowMonthModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.pickerTriggerLeft}>
                    <Icon name="calendar" size={15} color={Colors.light.primary} />
                    <Text style={styles.pickerTriggerText}>{formatDisplayMonth(month)}</Text>
                  </View>
                  <Icon name="chevron-down" size={14} color={Colors.light.ink400} />
                </TouchableOpacity>
              </View>
            )}

            {period === 'yearly' && (
              <View style={styles.filterInputGroup}>
                <Text style={styles.inputLabel}>YEAR</Text>
                <View style={styles.yearStepperRow}>
                  <TouchableOpacity
                    style={styles.yearStepBtn}
                    onPress={() => setYear((y) => String(Number(y) - 1))}
                    activeOpacity={0.7}
                  >
                    <Icon name="chevron-left" size={16} color={Colors.light.ink800} />
                  </TouchableOpacity>
                  <View style={styles.yearDisplayBox}>
                    <Icon name="calendar" size={15} color={Colors.light.primary} />
                    <Text style={styles.yearDisplayText}>{year}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.yearStepBtn}
                    onPress={() => setYear((y) => String(Number(y) + 1))}
                    activeOpacity={0.7}
                  >
                    <Icon name="chevron-right" size={16} color={Colors.light.ink800} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {period === 'custom' && (
              <View style={styles.twoInputsRow}>
                <View style={styles.flex1}>
                  <Text style={styles.inputLabel}>FROM</Text>
                  <TouchableOpacity
                    style={styles.pickerTriggerBtn}
                    onPress={() => setActiveDatePicker('periodStartDate')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.pickerTriggerLeft}>
                      <Icon name="calendar" size={15} color={Colors.light.primary} />
                      <Text style={styles.pickerTriggerText} numberOfLines={1}>
                        {formatDisplayDate(startDate)}
                      </Text>
                    </View>
                    <Icon name="chevron-down" size={14} color={Colors.light.ink400} />
                  </TouchableOpacity>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.inputLabel}>TO</Text>
                  <TouchableOpacity
                    style={styles.pickerTriggerBtn}
                    onPress={() => setActiveDatePicker('periodEndDate')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.pickerTriggerLeft}>
                      <Icon name="calendar" size={15} color={Colors.light.primary} />
                      <Text style={styles.pickerTriggerText} numberOfLines={1}>
                        {formatDisplayDate(endDate)}
                      </Text>
                    </View>
                    <Icon name="chevron-down" size={14} color={Colors.light.ink400} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Summary Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <Icon name="calendar" size={14} color={Colors.light.primary} />
              </View>
              <Text style={styles.metricValue}>{periodReport?.totalAppointments ?? 0}</Text>
              <Text style={styles.metricLabel}>Total Visits</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="dollar-sign" size={14} color="#059669" />
              </View>
              <Text style={[styles.metricValue, { color: '#059669' }]}>
                ₹{(periodReport?.estimatedRevenue ?? 0).toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>Est. Revenue</Text>
            </View>

            {period === 'daily' && dailyDashboard && (
              <>
                <View style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: '#EFF6FF' }]}>
                    <Icon name="user" size={14} color="#2563EB" />
                  </View>
                  <Text style={styles.metricValue}>{dailyDashboard.newPatients ?? 0}</Text>
                  <Text style={styles.metricLabel}>New Patients</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: '#FAF5FF' }]}>
                    <Icon name="refresh-cw" size={14} color="#7C3AED" />
                  </View>
                  <Text style={styles.metricValue}>{dailyDashboard.returningPatients ?? 0}</Text>
                  <Text style={styles.metricLabel}>Returning</Text>
                </View>
              </>
            )}
          </View>

          {/* Status Breakdown Grid */}
          <View style={styles.breakdownSection}>
            <Text style={styles.subSectionTitle}>Status Distribution</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>Completed</Text>
                <Text style={[styles.statusBoxVal, { color: '#047857' }]}>
                  {periodReport?.byStatus?.COMPLETED ?? 0}
                </Text>
              </View>
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>Waiting</Text>
                <Text style={[styles.statusBoxVal, { color: '#D97706' }]}>
                  {periodReport?.byStatus?.WAITING ?? 0}
                </Text>
              </View>
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>Cancelled</Text>
                <Text style={[styles.statusBoxVal, { color: '#DC2626' }]}>
                  {periodReport?.byStatus?.CANCELLED ?? 0}
                </Text>
              </View>
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>Absent</Text>
                <Text style={[styles.statusBoxVal, { color: Colors.light.ink600 }]}>
                  {periodReport?.byStatus?.ABSENT ?? 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Doctor-Wise Performance Breakdown */}
          {periodReport?.byDoctor && Object.keys(periodReport.byDoctor).length > 0 && (
            <View style={styles.doctorWiseSection}>
              <Text style={styles.subSectionTitle}>Doctor Breakdown</Text>
              <View style={styles.doctorWiseList}>
                {Object.entries(periodReport.byDoctor).map(([name, dData]) => (
                  <View key={name} style={styles.doctorWiseRow}>
                    <View style={styles.doctorWiseLeft}>
                      <View style={styles.doctorWiseIconBox}>
                        <Icon name="stethoscope" size={14} color={Colors.light.primary} />
                      </View>
                      <View>
                        <Text style={styles.doctorWiseName}>Dr. {name}</Text>
                        <Text style={styles.doctorWiseSub}>
                          {dData.totalAppointments} Visits • {dData.completed} Completed
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.doctorWiseRevenue}>₹{dData.revenue.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </GradientCard>

      {/* ========================================================
          2. PATIENT GROWTH & ACQUISITION CARD
      ======================================================== */}
      <GradientCard variant="green" style={styles.growthCard}>
        <View style={styles.growthCardContent}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: '#059669' }]}>
                <Icon name="trending-up" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.cardHeaderTitle}>Patient Growth & Trends</Text>
                <Text style={styles.cardHeaderSub}>Historical volume and retention analytics</Text>
              </View>
            </View>
          </View>

          {/* Granularity Pills */}
          <View style={styles.periodPillRow}>
            {GRANULARITY_PILLS.map((g) => {
              const isSel = growthGranularity === g.key;
              return (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.periodPillBtn, isSel && styles.periodPillBtnActive]}
                  onPress={() => setGrowthGranularity(g.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.periodPillBtnText, isSel && styles.periodPillBtnTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Growth Date Range Pickers */}
          <View style={styles.growthFilterBox}>
            <View style={styles.twoInputsRow}>
              <View style={styles.flex1}>
                <Text style={styles.inputLabel}>START DATE</Text>
                <TouchableOpacity
                  style={styles.pickerTriggerBtn}
                  onPress={() => setActiveDatePicker('growthStartDate')}
                  activeOpacity={0.8}
                >
                  <View style={styles.pickerTriggerLeft}>
                    <Icon name="calendar" size={15} color="#059669" />
                    <Text style={styles.pickerTriggerText} numberOfLines={1}>
                      {formatDisplayDate(growthStartDate)}
                    </Text>
                  </View>
                  <Icon name="chevron-down" size={14} color={Colors.light.ink400} />
                </TouchableOpacity>
              </View>

              <View style={styles.flex1}>
                <Text style={styles.inputLabel}>END DATE</Text>
                <TouchableOpacity
                  style={styles.pickerTriggerBtn}
                  onPress={() => setActiveDatePicker('growthEndDate')}
                  activeOpacity={0.8}
                >
                  <View style={styles.pickerTriggerLeft}>
                    <Icon name="calendar" size={15} color="#059669" />
                    <Text style={styles.pickerTriggerText} numberOfLines={1}>
                      {formatDisplayDate(growthEndDate)}
                    </Text>
                  </View>
                  <Icon name="chevron-down" size={14} color={Colors.light.ink400} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Growth Summary Metrics */}
          <View style={styles.growthStatsRow}>
            <View style={styles.growthStatBox}>
              <Text style={styles.growthStatVal}>{growthSummary?.currentPeriodPatients ?? 0}</Text>
              <Text style={styles.growthStatLabel}>This Period</Text>
            </View>

            <View style={styles.growthStatBox}>
              <Text style={styles.growthStatVal}>{growthSummary?.previousPeriodPatients ?? 0}</Text>
              <Text style={styles.growthStatLabel}>Previous Period</Text>
            </View>

            <View style={styles.growthRateBox}>
              <View
                style={[
                  styles.growthRatePill,
                  { backgroundColor: isPositiveGrowth ? '#ECFDF5' : '#FEF2F2' },
                ]}
              >
                <Icon
                  name={isPositiveGrowth ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={isPositiveGrowth ? '#047857' : '#DC2626'}
                />
                <Text
                  style={[
                    styles.growthRateText,
                    { color: isPositiveGrowth ? '#047857' : '#DC2626' },
                  ]}
                >
                  {isPositiveGrowth ? `+${growthRate}%` : `${growthRate}%`}
                </Text>
              </View>
              <Text style={styles.growthStatLabel}>Growth Rate</Text>
            </View>
          </View>

          {/* Growth Trend Points Timeline */}
          {growthReport?.trend && growthReport.trend.length > 0 && (
            <View style={styles.trendSection}>
              <Text style={styles.subSectionTitle}>Volume Trend Timeline</Text>
              <View style={styles.trendList}>
                {growthReport.trend.slice(-6).map((point, idx) => (
                  <View key={point.period || `trend-${idx}`} style={styles.trendRow}>
                    <Text style={styles.trendPeriodText}>{point.period}</Text>
                    <View style={styles.trendChipsRow}>
                      <View style={styles.trendChipBlue}>
                        <Text style={styles.trendChipBlueText}>+{point.newPatients} new</Text>
                      </View>
                      <View style={styles.trendChipGreen}>
                        <Text style={styles.trendChipGreenText}>{point.returningPatients} ret</Text>
                      </View>
                      <View style={styles.trendChipAmber}>
                        <Text style={styles.trendChipAmberText}>{point.totalAppointments} visits</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </GradientCard>

      {/* Date Pickers */}
      <DatePickerModal
        visible={activeDatePicker === 'periodDate'}
        title={period === 'weekly' ? 'Select Week' : 'Select Date'}
        value={date}
        onSelect={(d) => setDate(d)}
        onClose={() => setActiveDatePicker(null)}
      />

      <DatePickerModal
        visible={activeDatePicker === 'periodStartDate'}
        title="Select Start Date"
        value={startDate}
        onSelect={(d) => setStartDate(d)}
        onClose={() => setActiveDatePicker(null)}
      />

      <DatePickerModal
        visible={activeDatePicker === 'periodEndDate'}
        title="Select End Date"
        value={endDate}
        onSelect={(d) => setEndDate(d)}
        onClose={() => setActiveDatePicker(null)}
      />

      <DatePickerModal
        visible={activeDatePicker === 'growthStartDate'}
        title="Growth Start Date"
        value={growthStartDate}
        onSelect={(d) => setGrowthStartDate(d)}
        onClose={() => setActiveDatePicker(null)}
      />

      <DatePickerModal
        visible={activeDatePicker === 'growthEndDate'}
        title="Growth End Date"
        value={growthEndDate}
        onSelect={(d) => setGrowthEndDate(d)}
        onClose={() => setActiveDatePicker(null)}
      />

      {/* Month Picker Modal */}
      <MonthPickerModal
        visible={showMonthModal}
        value={month}
        onSelect={(m) => setMonth(m)}
        onClose={() => setShowMonthModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  hubHeader: {
    gap: 2,
    marginBottom: Spacing.one,
  },
  hubTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  hubSubtitle: {
    fontSize: 12,
    color: Colors.light.ink600,
    lineHeight: 18,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
    paddingVertical: 2,
  },
  searchClearBtn: {
    padding: 4,
  },
  overallClinicCard: {
    marginTop: Spacing.one,
  },
  overallGradientCard: {
    marginBottom: 0,
  },
  overallContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  overallTopRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  overallLogoBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...Shadows.sm,
  },
  overallLogoImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overallMetaCol: {
    flex: 1,
    gap: 2,
  },
  overallTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overallTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Colors.light.primary,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  verifiedPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  overallTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  overallSubText: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  overallActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginTop: 2,
  },
  overallActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  doctorsListSection: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  centerState: {
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  centerStateText: {
    fontSize: 12,
    color: Colors.light.ink500,
  },
  emptySearchBox: {
    alignItems: 'center',
    padding: Spacing.six,
    gap: 4,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  emptySearchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  emptySearchSub: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  docGrid: {
    gap: Spacing.two,
  },
  docCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  docCardTopRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  docAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: Colors.light.primary,
  },
  docAvatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  docAvatarFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  docCardMeta: {
    flex: 1,
    gap: 2,
  },
  docCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  docCardName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docCardSpec: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  expPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  expPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  docCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface50,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  docCardActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  heroBanner: {
    marginBottom: 0,
  },
  heroBannerContent: {
    padding: Spacing.four,
    gap: 4,
  },
  heroBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroIconBox: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBannerTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Colors.light.primary,
  },
  analyticsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  analyticsBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  heroBannerHeading: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    marginTop: 2,
  },
  heroBannerSub: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  heroDownloadRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  heroDownloadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  periodCard: {
    marginBottom: 0,
  },
  periodCardContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
    minWidth: 150,
  },
  downloadButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  pdfBtn: {
    backgroundColor: '#DC2626',
  },
  excelBtn: {
    backgroundColor: '#059669',
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  cardHeaderSub: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  periodPillRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  periodPillBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  periodPillBtnActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  periodPillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  periodPillBtnTextActive: {
    color: '#FFFFFF',
  },
  filterInputsBox: {
    backgroundColor: Colors.light.surface50,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.two,
  },
  filterInputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Colors.light.ink600,
    textTransform: 'uppercase',
  },
  pickerTriggerBtn: {
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface300,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  pickerTriggerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink900,
  },
  yearStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  yearStepBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearDisplayBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface300,
    borderRadius: Radius.sm,
    paddingVertical: 6,
  },
  yearDisplayText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  growthFilterBox: {
    backgroundColor: Colors.light.surface50,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
    ...Shadows.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  modalYearText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthGridBtn: {
    width: '30%',
    paddingVertical: 9,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface100,
    alignItems: 'center',
  },
  monthGridBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  monthGridText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  monthGridTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  twoInputsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.light.surfaceWhite,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: 2,
    ...Shadows.sm,
  },
  metricIconWrap: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.light.ink500,
    fontWeight: '600',
  },
  breakdownSection: {
    gap: 6,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBox: {
    flex: 1,
    backgroundColor: Colors.light.surfaceWhite,
    padding: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    alignItems: 'center',
    gap: 2,
  },
  statusBoxLabel: {
    fontSize: 9,
    color: Colors.light.ink500,
    fontWeight: '600',
  },
  statusBoxVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  doctorWiseSection: {
    gap: 6,
  },
  doctorWiseList: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    overflow: 'hidden',
  },
  doctorWiseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface100,
  },
  doctorWiseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  doctorWiseIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorWiseName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  doctorWiseSub: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  doctorWiseRevenue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  growthCard: {
    marginBottom: 0,
  },
  growthCardContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  growthStatsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  growthStatBox: {
    flex: 1,
    backgroundColor: Colors.light.surfaceWhite,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    alignItems: 'center',
    gap: 2,
  },
  growthStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  growthStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.light.ink500,
  },
  growthRateBox: {
    flex: 1,
    backgroundColor: Colors.light.surfaceWhite,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    alignItems: 'center',
    gap: 4,
  },
  growthRatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  growthRateText: {
    fontSize: 11,
    fontWeight: '800',
  },
  trendSection: {
    gap: 6,
  },
  trendList: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    overflow: 'hidden',
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface100,
  },
  trendPeriodText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  trendChipsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  trendChipBlue: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  trendChipBlueText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  trendChipGreen: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  trendChipGreenText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  trendChipAmber: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  trendChipAmberText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
});
