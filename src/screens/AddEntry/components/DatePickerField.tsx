import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing, radius } from '../../../theme/spacing';
import { typography, typeScale } from '../../../theme/typography';
import { formatDate } from '../../../utils/date';
import PrimaryButton from '../../components/PrimaryButton';

interface Props {
  value: number;
  onChange: (ts: number) => void;
  label?: string;
  showLabel?: boolean;
}

type Field = 'day' | 'month' | 'year';

export default function DatePickerField({ value, onChange, label, showLabel = true }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(value));
  const [editing, setEditing] = useState<Field | null>(null);
  const [editText, setEditText] = useState('');

  const openPicker = () => {
    setTempDate(new Date(value));
    setEditing(null);
    setOpen(true);
  };

  const getDisplay = (field: Field) => {
    const d = tempDate;
    const v = field === 'day' ? d.getDate() : field === 'month' ? d.getMonth() + 1 : d.getFullYear();
    return String(v).padStart(field === 'year' ? 4 : 2, '0');
  };

  const commitEdit = (field: Field, text: string) => {
    const n = parseInt(text, 10);
    if (!isNaN(n)) {
      setTempDate(prev => {
        const d = new Date(prev);
        if (field === 'day' && n >= 1 && n <= 31) d.setDate(n);
        if (field === 'month' && n >= 1 && n <= 12) d.setMonth(n - 1);
        if (field === 'year' && n > 1900 && n < 2200) d.setFullYear(n);
        return d;
      });
    }
    setEditing(null);
  };

  const startEdit = (field: Field) => {
    setEditText(getDisplay(field));
    setEditing(field);
  };

  const adjust = (field: Field, delta: number) => {
    setTempDate(prev => {
      const d = new Date(prev);
      if (field === 'day')   d.setDate(d.getDate() + delta);
      if (field === 'month') d.setMonth(d.getMonth() + delta);
      if (field === 'year')  d.setFullYear(d.getFullYear() + delta);
      return d;
    });
  };

  const confirm = () => {
    if (editing) commitEdit(editing, editText);
    onChange(tempDate.getTime());
    setOpen(false);
  };

  const FIELDS: { key: Field; label: string }[] = [
    { key: 'day', label: t('addEntry.dateDay') },
    { key: 'month', label: t('addEntry.dateMonth') },
    { key: 'year', label: t('addEntry.dateYear') },
  ];

  return (
    <View>
      {showLabel ? (
        <Text style={[typography.label, styles.label]}>{label ?? t('common.date')}</Text>
      ) : null}
      <TouchableOpacity style={styles.field} onPress={openPicker}>
        <Text style={styles.value}>{formatDate(value)}</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={[typography.h3, styles.title]}>{t('addEntry.selectDate')}</Text>

            <View style={styles.pickerRow}>
              {FIELDS.map(({ key, label: fLabel }) => {
                const isEditing = editing === key;
                return (
                  <View key={key} style={styles.col}>
                    <Text style={styles.fieldLabel}>{fLabel}</Text>
                    <TouchableOpacity onPress={() => adjust(key, 1)} style={styles.arrowBtn}>
                      <Text style={styles.arrow}>▲</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => startEdit(key)} activeOpacity={0.7} style={styles.valueWrap}>
                      {isEditing ? (
                        <TextInput
                          autoFocus
                          style={styles.textInput}
                          value={editText}
                          onChangeText={setEditText}
                          keyboardType="numeric"
                          maxLength={key === 'year' ? 4 : 2}
                          onBlur={() => commitEdit(key, editText)}
                          onSubmitEditing={() => commitEdit(key, editText)}
                          selectTextOnFocus
                        />
                      ) : (
                        <Text style={styles.dateValue}>{getDisplay(key)}</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => adjust(key, -1)} style={styles.arrowBtn}>
                      <Text style={styles.arrow}>▼</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            <Text style={styles.hint}>{t('addEntry.selectDate')}</Text>

            <View style={styles.actions}>
              <PrimaryButton label={t('common.cancel')} variant="secondary" onPress={() => setOpen(false)} style={{ flex: 1 }} />
              <PrimaryButton label={t('common.confirm')} onPress={confirm} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text1, marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border1,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  value: { color: colors.text0, fontSize: typeScale.body },
  chevron: { color: colors.text2, fontSize: typeScale.titleMedium },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.bg2,
    borderRadius: 20,
    padding: spacing.xxl,
    width: '100%',
    gap: spacing.xl,
  },
  title: { textAlign: 'center' },
  hint: { fontSize: typeScale.caption, color: colors.text3, textAlign: 'center', marginTop: -spacing.md },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-around', gap: spacing.lg },
  col: { alignItems: 'center', gap: spacing.sm, flex: 1 },
  fieldLabel: { ...typography.overline, letterSpacing: 1 },
  arrowBtn: { padding: spacing.sm },
  arrow: { color: colors.accent, fontSize: typeScale.titleSmall, fontWeight: '700' },
  valueWrap: { minHeight: 44, alignItems: 'center', justifyContent: 'center', width: '100%' },
  dateValue: { ...typography.heroTitle, color: colors.text0, textAlign: 'center' },
  textInput: {
    fontSize: typeScale.hero,
    fontWeight: '700',
    color: colors.text0,
    textAlign: 'center',
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  actions: { flexDirection: 'row', gap: spacing.md },
});
