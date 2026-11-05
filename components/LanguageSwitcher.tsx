import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useLanguage, type SupportedLanguage } from '../lib/language-context';
import { Icon } from './Icon';
import { Colors, Radius, Shadows, Spacing } from '../theme';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'segmented';
  compact?: boolean;
}

export function LanguageSwitcher({
  variant = 'pill',
  compact = false,
}: LanguageSwitcherProps) {
  const { language, setLanguage, locales, currentLocale, t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = async (code: SupportedLanguage) => {
    await setLanguage(code);
    setModalVisible(false);
  };

  // If segmented inline variant requested
  if (variant === 'segmented') {
    return (
      <View style={styles.segmentedContainer}>
        {locales.map((l) => {
          const isActive = language === l.code;
          return (
            <TouchableOpacity
              key={l.code}
              onPress={() => handleSelect(l.code)}
              activeOpacity={0.8}
              style={[
                styles.segmentButton,
                isActive && styles.segmentButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  isActive && styles.segmentButtonTextActive,
                ]}
              >
                {compact ? l.code.toUpperCase() : l.nativeName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Default: Pill button with interactive dropdown modal
  return (
    <>
      <TouchableOpacity
        style={[styles.pillButton, compact && styles.pillButtonCompact]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.75}
        accessibilityLabel="Change Language"
      >
        <Icon name="globe" size={compact ? 12 : 13} color={Colors.light.primary} />
        <Text style={[styles.pillText, compact && styles.pillTextCompact]}>
          {compact ? currentLocale.code.toUpperCase() : currentLocale.nativeName}
        </Text>
        <Icon name="chevron-down" size={compact ? 9 : 11} color={Colors.light.ink500} />
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.globeIconBox}>
                  <Icon name="globe" size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {t('common.language', 'Language')} / ভাষা / भाषा
                  </Text>
                  <Text style={styles.modalSub}>
                    {t('common.selectLanguage', 'Select Language')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Icon name="x" size={16} color={Colors.light.ink500} />
              </TouchableOpacity>
            </View>

            {/* Detailed Language List */}
            <View style={styles.languageList}>
              {locales.map((l) => {
                const isSelected = language === l.code;
                return (
                  <TouchableOpacity
                    key={l.code}
                    style={[
                      styles.languageRow,
                      isSelected && styles.languageRowSelected,
                    ]}
                    onPress={() => handleSelect(l.code)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.languageRowLeft}>
                      <View>
                        <Text
                          style={[
                            styles.languageNativeText,
                            isSelected && styles.languageNativeTextSelected,
                          ]}
                        >
                          {l.nativeName}
                        </Text>
                        <Text style={styles.languageEnglishText}>
                          {l.label} ({l.code.toUpperCase()})
                        </Text>
                      </View>
                    </View>

                    {isSelected ? (
                      <View style={styles.checkIconBox}>
                        <Icon name="check" size={14} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={styles.uncheckCircle} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: Radius.full,
  },
  pillButtonCompact: {
    paddingVertical: 4,
    paddingHorizontal: 7,
    gap: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  pillTextCompact: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.light.primary,
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 51, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.five,
    ...Shadows.lg,
    gap: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  globeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F1B33',
  },
  modalSub: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Segmented Pill (Matches Webapp LanguageSwitcher)
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.full,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: Colors.light.primary,
    ...Shadows.sm,
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // List of Languages
  languageList: {
    gap: 8,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  languageRowSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  languageRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  languageNativeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F1B33',
  },
  languageNativeTextSelected: {
    color: Colors.light.primary,
  },
  languageEnglishText: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  checkIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
});
