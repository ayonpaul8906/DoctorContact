import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  ScrollViewProps,
  EmitterSubscription,
  TextInput,
  findNodeHandle,
} from 'react-native';

export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  extraHeight?: number;
  keyboardVerticalOffset?: number;
  children: React.ReactNode;
}

export interface KeyboardAwareScrollViewRef extends ScrollView {
  scrollToFocusedInput?: (additionalOffset?: number) => void;
}

/**
 * Universal Keyboard-Aware ScrollView container.
 * Automatically expands bottom scroll space and scrolls directly to focused
 * text inputs to avoid keyboard occlusion across both iOS and Android.
 */
export const KeyboardAwareScrollView = forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
  (
    {
      style,
      contentContainerStyle,
      extraHeight = 140,
      keyboardVerticalOffset = Platform.OS === 'ios' ? 70 : 0,
      children,
      ...props
    },
    ref
  ) => {
    const scrollRef = useRef<ScrollView>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const scrollToFocusedInput = useCallback(
      (additionalOffset = extraHeight) => {
        try {
          const currentlyFocused =
            TextInput.State.currentlyFocusedInput?.() ||
            (TextInput as any).State?.currentlyFocusedField?.();
          if (currentlyFocused && scrollRef.current) {
            const responder =
              (scrollRef.current as any).getScrollResponder?.() || scrollRef.current;
            const node = findNodeHandle(currentlyFocused as any) || currentlyFocused;
            if (
              responder &&
              typeof responder.scrollResponderScrollNativeHandleToKeyboard === 'function'
            ) {
              responder.scrollResponderScrollNativeHandleToKeyboard(
                node,
                additionalOffset,
                true
              );
            }
          }
        } catch {
          // Fallback gracefully if node is detached
        }
      },
      [extraHeight]
    );

    useImperativeHandle(ref, () => {
      if (!scrollRef.current) return {} as ScrollView;
      return Object.assign(scrollRef.current, {
        scrollToFocusedInput,
      });
    });

    useEffect(() => {
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

      const showSub: EmitterSubscription = Keyboard.addListener(showEvent, (e) => {
        const height = e.endCoordinates?.height || 280;
        setKeyboardHeight(height);
        setTimeout(() => {
          scrollToFocusedInput(extraHeight);
        }, Platform.OS === 'android' ? 120 : 50);
      });

      const hideSub: EmitterSubscription = Keyboard.addListener(hideEvent, () => {
        setKeyboardHeight(0);
      });

      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, [extraHeight, scrollToFocusedInput]);

    // Dynamically calculate bottom padding
    const dynamicBottomPadding = keyboardHeight > 0 ? keyboardHeight + extraHeight : 40;

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          ref={scrollRef}
          style={[styles.scrollView, style]}
          contentContainerStyle={[
            contentContainerStyle,
            { paddingBottom: dynamicBottomPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          {...props}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
);

KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
