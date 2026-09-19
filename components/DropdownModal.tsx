import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import { Icon } from './Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

export interface DropdownOption {
  label: string;
  value: string;
  sublabel?: string;
}

interface DropdownModalProps {
  visible: boolean;
  title: string;
  options: DropdownOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  searchable?: boolean;
  placeholder?: string;
}

export function DropdownModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  searchable,
  placeholder = 'Search options...',
}: DropdownModalProps) {
  const [search, setSearch] = useState('');

  const isSearchable = searchable ?? options.length > 6;

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [options, search]);

  const handleSelect = (val: string) => {
    onSelect(val);
    setSearch('');
    onClose();
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Icon name="x" size={18} color={Colors.light.ink600} />
            </TouchableOpacity>
          </View>

          {/* Search bar if needed */}
          {isSearchable && (
            <View style={styles.searchWrap}>
              <Icon name="search" size={14} color={Colors.light.ink400} />
              <TextInput
                style={styles.searchInput}
                placeholder={placeholder}
                value={search}
                onChangeText={setSearch}
                placeholderTextColor={Colors.light.ink400}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Icon name="x" size={13} color={Colors.light.ink400} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Options List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {filteredOptions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No matching options found.</Text>
              </View>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValue === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                    onPress={() => handleSelect(opt.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionTextCol}>
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {opt.sublabel ? (
                        <Text style={styles.optionSublabel}>{opt.sublabel}</Text>
                      ) : null}
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Icon name="check" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.light.surfaceWhite,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    maxHeight: '75%',
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  closeBtn: {
    padding: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    marginTop: Spacing.three,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
    padding: 0,
  },
  list: {
    marginTop: Spacing.three,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  optionTextCol: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  optionLabelSelected: {
    fontWeight: '800',
    color: Colors.light.primary,
  },
  optionSublabel: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.light.ink400,
  },
});
