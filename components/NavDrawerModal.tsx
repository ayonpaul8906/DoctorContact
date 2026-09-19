import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Dimensions,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../lib/language-context';
import { Icon, IconName } from './Icon';
import { Colors } from '../theme';

export interface NavDrawerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSection?: (section: 'treatments' | 'labs' | 'ambulance') => void;
}

const CLINIC_PHONE = '+919777777777';
const CLINIC_WHATSAPP = '919777777777';
const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.82);

interface NavItemDef {
  id: string;
  icon: IconName;
  iconBg: string;
  iconColor: string;
  label: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  onPress: () => void;
}

export function NavDrawerModal({
  visible,
  onClose,
  onSelectSection,
}: NavDrawerModalProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(DRAWER_WIDTH);
    }
  }, [visible, slideAnim]);

  const handleCloseWithSlide = () => {
    Animated.timing(slideAnim, {
      toValue: DRAWER_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const navItems: NavItemDef[] = [
    {
      id: 'home',
      icon: 'home',
      iconBg: '#EFF6FF',
      iconColor: '#1B3A8C',
      label: t('nav.home', 'Home'),
      subtitle: t('nav.homeSub', 'Overview & quick search'),
      onPress: () => {
        handleCloseWithSlide();
        router.push('/(main)');
      },
    },
    {
      id: 'doctors',
      icon: 'stethoscope',
      iconBg: '#F0FDF4',
      iconColor: '#16A34A',
      label: t('nav.doctors', 'Doctors'),
      subtitle: t('nav.doctorsSub', 'Find specialists & book appointments'),
      onPress: () => {
        handleCloseWithSlide();
        router.push('/(patient)/doctors' as any);
      },
    },
    {
      id: 'clinics',
      icon: 'building',
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      label: t('nav.clinics', 'Clinics'),
      subtitle: t('nav.clinicsSub', 'Explore healthcare facilities & timings'),
      onPress: () => {
        handleCloseWithSlide();
        router.push('/(patient)/clinics' as any);
      },
    },
    {
      id: 'treatments',
      icon: 'activity',
      iconBg: '#FDF2F8',
      iconColor: '#DB2777',
      label: t('nav.treatments', 'Treatments & Systems'),
      subtitle: t('nav.treatmentsSub', 'Allopathy, Homeopathy, Ayurveda'),
      onPress: () => {
        handleCloseWithSlide();
        if (onSelectSection) {
          onSelectSection('treatments');
        } else {
          router.push('/(main)');
        }
      },
    },
    {
      id: 'labs',
      icon: 'flask',
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
      label: t('nav.labs', 'Diagnostic Labs'),
      subtitle: t('nav.labsSub', 'Pathology, blood tests & imaging'),
      onPress: () => {
        handleCloseWithSlide();
        router.push('/(patient)/labs' as any);
      },
    },
    {
      id: 'ambulance',
      icon: 'phone',
      iconBg: '#FEF2F2',
      iconColor: '#DC2626',
      label: t('nav.ambulance', '24×7 Ambulance'),
      subtitle: t('nav.ambulanceSub', 'Emergency response service'),
      badge: '24×7 Emergency',
      badgeColor: '#EF4444',
      onPress: () => {
        handleCloseWithSlide();
        Linking.openURL(`tel:${CLINIC_PHONE}`).catch(() => {});
      },
    },
    {
      id: 'available-doctors',
      icon: 'user-check',
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      label: t('nav.availableDoctors', 'Available Doctors'),
      subtitle: t('nav.availableDoctorsSub', 'Specialists available right now'),
      badge: 'Live',
      badgeColor: '#10B981',
      onPress: () => {
        handleCloseWithSlide();
        router.push({
          pathname: '/(patient)/doctors',
          params: { live: 'true' },
        } as any);
      },
    },
    {
      id: 'available-clinics',
      icon: 'check-circle',
      iconBg: '#F0F9FF',
      iconColor: '#0284C7',
      label: t('nav.availableClinics', 'Available Clinics'),
      subtitle: t('nav.availableClinicsSub', 'Open clinics accepting walk-ins'),
      onPress: () => {
        handleCloseWithSlide();
        router.push('/(patient)/clinics' as any);
      },
    },
    {
      id: 'apply-listing',
      icon: 'award',
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      label: t('nav.applyListing', 'Apply for Listing'),
      subtitle: t('nav.applyListingSub', 'Register doctor or clinic practice'),
      badge: 'Partner',
      badgeColor: '#F59E0B',
      onPress: () => {
        handleCloseWithSlide();
        Linking.openURL(
          `https://wa.me/${CLINIC_WHATSAPP}?text=Hello%20Doctor%20Contact,%20I%20want%20to%20apply%20for%20a%20doctor%20or%20clinic%20listing.`
        ).catch(() => {});
      },
    },
  ];

  const handleCallSupport = () => {
    Linking.openURL(`tel:${CLINIC_PHONE}`).catch(() => {});
  };

  const handleWhatsAppSupport = () => {
    Linking.openURL(
      `https://wa.me/${CLINIC_WHATSAPP}?text=Hello%20Doctor%20Contact%20Support,%20I%20need%20assistance.`
    ).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCloseWithSlide}
    >
      <View style={styles.overlay}>
        {/* Backdrop touch to close */}
        <TouchableWithoutFeedback onPress={handleCloseWithSlide}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Sliding Drawer Container */}
        <Animated.View
          style={[
            styles.drawerContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Drawer Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.brandRow}>
              <View style={styles.logoIconBox}>
                <Image
                  source={require('../assets/logo-icon.png')}
                  style={styles.logoIcon}
                  resizeMode="contain"
                  fadeDuration={0}
                  resizeMethod="resize"
                />
              </View>
              <Image
                source={require('../assets/LOGO.png')}
                style={styles.logoImage}
                resizeMode="contain"
                fadeDuration={0}
                resizeMethod="resize"
              />
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleCloseWithSlide}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Navigation Links List */}
          <ScrollView
            style={styles.drawerScroll}
            contentContainerStyle={styles.drawerContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionHeading}>
              {t('nav.navigation', 'Explore Doctor Contact')}
            </Text>

            <View style={styles.navGroup}>
              {navItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.navRow}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: item.iconBg },
                    ]}
                  >
                    <Icon name={item.icon} size={17} color={item.iconColor} />
                  </View>

                  <View style={styles.navTextContainer}>
                    <View style={styles.navTitleRow}>
                      <Text style={styles.navLabel} numberOfLines={1}>
                        {item.label}
                      </Text>
                      {item.badge && (
                        <View
                          style={[
                            styles.badgePill,
                            { backgroundColor: `${item.badgeColor}15` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: item.badgeColor },
                            ]}
                          >
                            {item.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.navSubtitle} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  </View>

                  <Icon name="chevron-right" size={15} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Contact Assistance */}
            <View style={styles.supportBox}>
              <Text style={styles.supportTitle}>
                {t('nav.needHelp', 'Need Immediate Help?')}
              </Text>
              <Text style={styles.supportSub}>
                {t('nav.helpSub', 'Direct hotline & WhatsApp for health guidance')}
              </Text>

              <View style={styles.supportButtonsRow}>
                <TouchableOpacity
                  style={styles.callSupportBtn}
                  onPress={handleCallSupport}
                  activeOpacity={0.85}
                >
                  <Icon name="phone" size={13} color="#FFFFFF" />
                  <Text style={styles.callSupportBtnText}>
                    {t('common.call', 'Call 24/7')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.waSupportBtn}
                  onPress={handleWhatsAppSupport}
                  activeOpacity={0.85}
                >
                  <Icon name="message-circle" size={13} color="#15803D" />
                  <Text style={styles.waSupportBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer Attribution */}
            <View style={styles.drawerFooter}>
              <Text style={styles.footerBrand}>
                Doctor Contact Healthcare Platform
              </Text>
              <Text style={styles.footerCredits}>
                Developed by Soumya Chatterjee & Ayon Paul
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  logoIcon: {
    width: 34,
    height: 34,
  },
  logoImage: {
    width: 142,
    height: 38,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  drawerScroll: {
    flex: 1,
  },
  drawerContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  navGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navTextContainer: {
    flex: 1,
    marginRight: 6,
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  navSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  supportBox: {
    marginTop: 20,
    padding: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  supportSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
    marginBottom: 10,
  },
  supportButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callSupportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    borderRadius: 8,
  },
  callSupportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  waSupportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 8,
    borderRadius: 8,
  },
  waSupportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  drawerFooter: {
    marginTop: 28,
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerBrand: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  footerCredits: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },
});
