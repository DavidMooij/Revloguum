import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { haptic } from '../../../utils/haptics';
import type { ServiceType } from '../../../domain/entities/ServiceType';
import type { DateRangePreset } from '../../../utils/date';
import { colors } from '../../../theme/colors';
import { spacing, radius } from '../../../theme/spacing';
import { typography, typeScale } from '../../../theme/typography';
import { useServiceTypeLabel } from '../../../hooks/useServiceTypeLabel';

interface Props {
  serviceTypes: ServiceType[];
  selectedTypeIds: string[];
  onToggleType: (id: string) => void;
  datePreset: DateRangePreset;
  onDatePreset: (p: DateRangePreset) => void;
  searchText: string;
  onSearchText: (t: string) => void;
  onClear: () => void;
}

const DATE_PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: 'last30', label: '30d' },
  { key: 'last90', label: '90d' },
  { key: 'last365', label: '1y' },
  { key: 'all', label: 'All' },
];

export default function FilterBar({
  serviceTypes, selectedTypeIds, onToggleType,
  datePreset, onDatePreset,
  searchText, onSearchText, onClear,
}: Props) {
  const { t } = useTranslation();
  const getLabel = useServiceTypeLabel();
  const [expanded, setExpanded] = useState(false);
  const hasFilter = selectedTypeIds.length > 0 || datePreset !== 'all' || searchText.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Icon name="search" size={13} color={colors.text2} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={onSearchText}
            placeholder={t('history.searchPlaceholder')}
            placeholderTextColor={colors.text2}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => onSearchText('')} hitSlop={8}>
              <Icon name="times-circle" size={13} color={colors.text2} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, expanded && styles.filterBtnActive]}
          onPress={() => {
            haptic.light();
            setExpanded(v => !v);
          }}
        >
          <Icon name="sliders-h" size={14} color={expanded ? colors.accent : colors.text1} />
          {hasFilter && <View style={styles.dot} />}
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.expanded}>
          <Text style={styles.filterLabel}>{t('history.dateRange')}</Text>
          <View style={styles.chipRow}>
            {DATE_PRESETS.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[styles.chip, datePreset === p.key && styles.chipActive]}
                onPress={() => { haptic.selection(); onDatePreset(p.key); }}
              >
                <Text style={[styles.chipText, datePreset === p.key && styles.chipTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>{t('history.serviceType')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {serviceTypes.map(st => {
                const active = selectedTypeIds.includes(st.id);
                return (
                  <TouchableOpacity
                    key={st.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => { haptic.selection(); onToggleType(st.id); }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{getLabel(st)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {hasFilter && (
            <TouchableOpacity onPress={() => { haptic.light(); onClear(); }} style={styles.clearBtn}>
              <Text style={styles.clearText}>{t('history.clearFilters')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border1,
    paddingHorizontal: spacing.md,
    height: 40,
    gap: spacing.sm,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    color: colors.text0,
    fontSize: typeScale.bodyMedium,
    height: '100%',
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  expanded: { gap: spacing.md },
  filterLabel: {
    ...typography.overline,
  },
  chipRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border1,
  },
  chipActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  chipText: { fontSize: typeScale.captionLarge, fontWeight: '500', color: colors.text1 },
  chipTextActive: { color: colors.accentText, fontWeight: '600' },
  clearBtn: { alignSelf: 'center', paddingVertical: spacing.sm },
  clearText: { color: colors.accent, fontSize: typeScale.bodySmall, fontWeight: '600' },
});
