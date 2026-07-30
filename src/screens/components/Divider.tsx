import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { readableColor } from '../../theme/readability';
import { useAppStore } from '../../store/appStore';

interface Props {
  style?: ViewStyle;
}

export default function Divider({ style }: Props) {
  const readabilityMode = useAppStore((s) => s.readabilityMode);

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: readableColor('border0', readabilityMode),
          opacity: readabilityMode ? 0.9 : 1,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border0,
  },
});
