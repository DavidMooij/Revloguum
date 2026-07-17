import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

interface Props {
  label: string;
  variant?: 'accent' | 'muted' | 'success' | 'warning' | 'danger';
  style?: ViewStyle;
}

export default function Badge({ label, variant = 'muted', style }: Props) {
  const bg = {
    accent:  colors.accentMuted,
    muted:   colors.bg3,
    success: colors.successMuted,
    warning: colors.warningMuted,
    danger:  colors.dangerMuted,
  }[variant];

  const textColor = {
    accent:  colors.accentText,
    muted:   colors.text1,
    success: colors.successText,
    warning: colors.warningText,
    danger:  colors.dangerText,
  }[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
