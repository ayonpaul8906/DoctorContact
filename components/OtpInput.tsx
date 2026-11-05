import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Colors, Radius, Shadows } from '../theme';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
}: OtpInputProps) {
  const inputRef = useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);

  const digits = value
    .split('')
    .concat(Array(length).fill(''))
    .slice(0, length);

  const handlePress = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleChangeText = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, length);
    onChange(clean);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.container}
      accessible
      accessibilityRole="none"
      accessibilityLabel="6-digit verification code input"
    >
      {/* Hidden Native TextInput */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        editable={!disabled}
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.hiddenInput}
        caretHidden
      />

      {/* Visual Digit Boxes */}
      <View style={styles.boxesRow}>
        {digits.map((digit, index) => {
          const isCurrentActive =
            isFocused &&
            (index === value.length ||
              (index === length - 1 && value.length === length));
          const isFilled = Boolean(digit);

          return (
            <View
              key={index}
              style={[
                styles.digitBox,
                isFilled && styles.digitBoxFilled,
                isCurrentActive && styles.digitBoxActive,
                disabled && styles.digitBoxDisabled,
              ]}
            >
              <Text
                style={[
                  styles.digitText,
                  isCurrentActive && styles.digitTextActive,
                  disabled && styles.digitTextDisabled,
                ]}
              >
                {digit}
              </Text>

              {/* Cursor indicator for active empty cell */}
              {isCurrentActive && !digit && (
                <View style={styles.cursorIndicator} />
              )}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

export default OtpInput;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.01,
    zIndex: 10,
  },
  boxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  digitBox: {
    width: 44,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  digitBoxFilled: {
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  digitBoxActive: {
    borderColor: Colors.light.primary,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  digitBoxDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  digitText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  digitTextActive: {
    color: Colors.light.primary,
  },
  digitTextDisabled: {
    color: Colors.light.ink400,
  },
  cursorIndicator: {
    position: 'absolute',
    bottom: 12,
    width: 14,
    height: 2,
    backgroundColor: Colors.light.primary,
    borderRadius: 1,
  },
});
