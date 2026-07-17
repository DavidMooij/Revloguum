import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Props {
  visible: boolean;
  label?: string;
}

export default function LoadingOverlay({ visible, label }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color={colors.accent} />
        {label ? <Text style={[typography.bodySmall, styles.label]}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  box: {
    backgroundColor: '#1C1C20',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    minWidth: 120,
  },
  label: { textAlign: 'center' },
});
