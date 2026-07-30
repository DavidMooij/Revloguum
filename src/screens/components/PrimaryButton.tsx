import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function PrimaryButton({ label, onPress, loading, disabled, variant = 'primary', style }: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg = {
    primary:   colors.accent,
    secondary: colors.bg3,
    danger:    colors.danger,
  }[variant];

  const textColor = variant === 'secondary' ? colors.text0 : colors.white;

  return (
    <AnimatedTouchable
      style={[styles.btn, { backgroundColor: bg }, (disabled || loading) && styles.disabled, animStyle, style]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      activeOpacity={1}
      disabled={disabled || loading}
    >
      {loading
        ? <ActivityIndicator size="small" color={textColor} />
        : <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      }
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  label: {
    ...typography.buttonLarge,
  },
  disabled: {
    opacity: 0.45,
  },
});
