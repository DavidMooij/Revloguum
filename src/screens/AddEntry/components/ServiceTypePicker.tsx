import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import type { ServiceType } from '../../../domain/entities/ServiceType';
import { colors } from '../../../theme/colors';
import { spacing, radius } from '../../../theme/spacing';
import { useServiceTypeLabel } from '../../../hooks/useServiceTypeLabel';

interface Props {
  serviceTypes: ServiceType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ServiceTypePicker({ serviceTypes, selectedId, onSelect }: Props) {
  const getLabel = useServiceTypeLabel();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {serviceTypes.map(st => {
        const active = st.id === selectedId;
        return (
          <TouchableOpacity
            key={st.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(st.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Icon name={st.icon} size={13} color={active ? colors.white : colors.text1} />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{getLabel(st)}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border1,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accentDark,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.bg4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text1,
  },
  labelActive: {
    color: colors.white,
    fontWeight: '600',
  },
});
