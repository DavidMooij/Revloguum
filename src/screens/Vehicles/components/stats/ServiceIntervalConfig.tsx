import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { ServiceType } from '@/domain/entities/ServiceType';
import { ServiceInterval } from '@/domain/entities/Vehicle';
import { colors, radius, spacing } from '@/theme';
import { useServiceTypeLabel } from '@/hooks/useServiceTypeLabel';
interface Props {
  serviceTypes: ServiceType[];
  intervals: ServiceInterval[];
  onChange: (intervals: ServiceInterval[]) => void;
}

export default function ServiceIntervalConfig({ serviceTypes, intervals, onChange }: Props) {
  const { t } = useTranslation();
  const getLabel = useServiceTypeLabel();
  const [adding, setAdding] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [kmInterval, setKmInterval] = useState('');
  const [daysInterval, setDaysInterval] = useState('');

  const handleAdd = () => {
    if (!selectedTypeId) return;
    const newInterval: ServiceInterval = {
      serviceTypeId: selectedTypeId,
      intervalKm: kmInterval ? parseInt(kmInterval, 10) : undefined,
      intervalDays: daysInterval ? parseInt(daysInterval, 10) : undefined,
    };
    onChange([...intervals.filter(i => i.serviceTypeId !== selectedTypeId), newInterval]);
    setAdding(false);
    setSelectedTypeId(null);
    setKmInterval('');
    setDaysInterval('');
  };

  const handleRemove = (serviceTypeId: string) => {
    onChange(intervals.filter(i => i.serviceTypeId !== serviceTypeId));
  };

  const getTypeName = (id: string) => {
    const st = serviceTypes.find((s) => s.id === id);
    return st ? getLabel(st) : id;
  };
  const getTypeIcon = (id: string) => serviceTypes.find(t => t.id === id)?.icon ?? 'wrench';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('vehicles.serviceIntervals')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAdding(v => !v)}
        >
          <Icon name={adding ? 'times' : 'plus'} size={12} color={colors.accent} />
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>{t('vehicles.serviceIntervalsHint')}</Text>

      {intervals.length === 0 && !adding && (
        <Text style={styles.empty}>{t('vehicles.noIntervals')}</Text>
      )}
      {intervals.map(iv => (
        <View key={iv.serviceTypeId} style={styles.intervalRow}>
          <View style={styles.intervalIcon}>
            <Icon name={getTypeIcon(iv.serviceTypeId)} size={13} color={colors.accent} />
          </View>
          <View style={styles.intervalInfo}>
            <Text style={styles.intervalName}>{getTypeName(iv.serviceTypeId)}</Text>
            <View style={styles.intervalBadges}>
              {iv.intervalKm && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t('vehicles.intervalEveryKm', { km: iv.intervalKm!.toLocaleString() })}</Text>
                </View>
              )}
              {iv.intervalDays && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t('vehicles.intervalEveryDays', { days: iv.intervalDays })}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => handleRemove(iv.serviceTypeId)} hitSlop={8}>
            <Icon name="times" size={14} color={colors.text2} />
          </TouchableOpacity>
        </View>
      ))}

      {adding && (
        <View style={styles.addForm}>
          <Text style={styles.fieldLabel}>{t('vehicles.serviceTypeFieldLabel')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            <View style={styles.typeRow}>
              {serviceTypes.map(st => (
                <TouchableOpacity
                  key={st.id}
                  style={[styles.typeChip, selectedTypeId === st.id && styles.typeChipActive]}
                  onPress={() => setSelectedTypeId(st.id)}
                >
                  <Icon name={st.icon} size={11} color={selectedTypeId === st.id ? colors.white : colors.text2} />
                  <Text style={[styles.typeChipText, selectedTypeId === st.id && styles.typeChipTextActive]}>
                    {getLabel(st)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>{t('vehicles.intervalKmLabel')}</Text>
              <TextInput
                style={styles.input}
                value={kmInterval}
                onChangeText={setKmInterval}
                keyboardType="numeric"
                placeholder={t('vehicles.placeholderIntervalKm')}
                placeholderTextColor={colors.text2}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>{t('vehicles.intervalDaysLabel')}</Text>
              <TextInput
                style={styles.input}
                value={daysInterval}
                onChangeText={setDaysInterval}
                keyboardType="numeric"
                placeholder={t('vehicles.placeholderIntervalDays')}
                placeholderTextColor={colors.text2}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, !selectedTypeId && styles.confirmBtnDisabled]}
            onPress={handleAdd}
            disabled={!selectedTypeId}
          >
            <Text style={styles.confirmBtnText}>{t('vehicles.addInterval')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 13, fontWeight: '600', color: colors.text0 },
  addBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accentMuted, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 12, color: colors.text2, marginTop: -spacing.xs },
  empty: { fontSize: 13, color: colors.text2, fontStyle: 'italic' },
  intervalRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg2, borderRadius: radius.sm, padding: spacing.md, gap: spacing.md },
  intervalIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentMuted, alignItems: 'center', justifyContent: 'center' },
  intervalInfo: { flex: 1, gap: 4 },
  intervalName: { fontSize: 13, fontWeight: '600', color: colors.text0 },
  intervalBadges: { flexDirection: 'row', gap: spacing.xs },
  badge: { backgroundColor: colors.bg3, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: colors.text1 },
  addForm: { backgroundColor: colors.bg2, borderRadius: radius.md, padding: spacing.md, gap: spacing.md, borderWidth: 1, borderColor: colors.border1 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: colors.text2, letterSpacing: 0.8, marginBottom: spacing.xs },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radius.full, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border1 },
  typeChipActive: { backgroundColor: colors.accent, borderColor: colors.accentDark },
  typeChipText: { fontSize: 12, fontWeight: '500', color: colors.text1 },
  typeChipTextActive: { color: colors.white, fontWeight: '600' },
  formRow: { flexDirection: 'row', gap: spacing.md },
  input: { backgroundColor: colors.bg3, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border1, color: colors.text0, fontSize: 14, paddingHorizontal: spacing.md, height: 44 },
  confirmBtn: { backgroundColor: colors.accent, borderRadius: radius.md, height: 44, alignItems: 'center', justifyContent: 'center' },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { fontSize: 14, fontWeight: '600', color: colors.white },
});
