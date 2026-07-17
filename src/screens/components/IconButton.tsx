import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';

interface Props {
  name: string;
  size?: number;
  color?: string;
  onPress: () => void;
  style?: ViewStyle;
  hitSlop?: number;
  variant?: 'default' | 'accent' | 'danger';
}

export default function IconButton({
  name, size = 15, color, onPress, style, hitSlop = 10, variant = 'default',
}: Props) {
  const bg = {
    default: colors.bg3,
    accent:  colors.accentMuted,
    danger:  colors.dangerMuted,
  }[variant];

  const ic = color ?? {
    default: colors.text1,
    accent:  colors.accent,
    danger:  colors.dangerText,
  }[variant];

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bg }, style]}
      onPress={onPress}
      hitSlop={hitSlop}
      activeOpacity={0.7}
    >
      <Icon name={name} size={size} color={ic} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
