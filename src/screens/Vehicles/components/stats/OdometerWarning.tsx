import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import { typeScale } from '@/theme/typography';

interface Props {
  currentValue: number;
  lastValue: number;
}

export default function OdometerWarning({ currentValue, lastValue }: Props) {
  const { t } = useTranslation();
  if (currentValue >= lastValue) return null;

  return (
    <View style={styles.warning}>
      <Icon name="exclamation-triangle" size={13} color={colors.warningText} />
      <Text style={styles.text}>
        {t('vehicles.odometerWarning', { current: currentValue.toLocaleString(), last: lastValue.toLocaleString() })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.warningMuted,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.md,
  },
  text: {
    flex: 1,
    fontSize: typeScale.captionLarge,
    color: colors.warningText,
    lineHeight: 17,
  },
});
