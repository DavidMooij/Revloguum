import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Animated,
  Keyboard,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import type { Vehicle } from '../../domain/entities/Vehicle';
import type { FuelEntry } from '../../domain/entities/FuelEntry';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { typography, typeScale } from '../../theme/typography';
import { haptic } from '@/utils/haptics';
import DatePickerField from '../AddEntry/components/DatePickerField';
import { useOdometerTimelineValidation } from '../../hooks/useOdometerTimelineValidation';
import ModalDragHandle from '../components/ModalDragHandle';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { dateTs: number; odometerKm: number; liters: number; cost: number; notes: string | null }) => Promise<void>;
  vehicle: Vehicle;
  lastEntry: FuelEntry | null;
  editEntry?: FuelEntry | null;
}

type PriceSource = 'total' | 'perLiter';

function parseAmount(value: string) {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeDecimal(value: string, decimalPlaces: number) {
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const [integer, ...fraction] = normalized.split('.');
  return fraction.length ? `${integer}.${fraction.join('').slice(0, decimalPlaces)}` : integer;
}

function FormField({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function QuickFuelModal({ visible, onClose, onSave, vehicle, lastEntry, editEntry }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetBottomOffset = useRef(new Animated.Value(0)).current;
  const validateOdometerTimeline = useOdometerTimelineValidation();
  const [dateTs, setDateTs] = useState(Date.now());
  const [odometer, setOdometer] = useState('');
  const [litersInput, setLitersInput] = useState('');
  const [pricePerLiterInput, setPricePerLiterInput] = useState('');
  const [priceSource, setPriceSource] = useState<PriceSource>('total');
  const [totalInput, setTotalInput] = useState('');
  const [notes, setNotes] = useState<string | null>(null);
  const [notesHeight, setNotesHeight] = useState(48);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [odometerTimelineError, setOdometerTimelineError] = useState<string | null>(null);

  const defaultLiters = vehicle.defaultTankLiters;
  const defaultPrice = vehicle.defaultFuelPrice ?? (lastEntry && lastEntry.liters > 0 ? lastEntry.cost / lastEntry.liters : 2.05);
  const kmSinceLast = lastEntry ? vehicle.currentOdometer - lastEntry.odometerKm : 0;

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      Animated.timing(sheetBottomOffset, {
        toValue: event.endCoordinates.height,
        duration: event.duration ?? 250,
        useNativeDriver: false
      }).start();
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', (event) => {
      Animated.timing(sheetBottomOffset, {
        toValue: 0,
        duration: event.duration ?? 250,
        useNativeDriver: false
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [sheetBottomOffset]);

  useEffect(() => {
    if (visible) {
      setNotesHeight(48);
      setOdometerTimelineError(null);
      if (editEntry) {
        setDateTs(editEntry.dateTs);
        setOdometer(String(editEntry.odometerKm));
        setLitersInput(editEntry.liters.toFixed(2));
        const perLiter = editEntry.liters > 0 ? editEntry.cost / editEntry.liters : defaultPrice;
        setPricePerLiterInput(perLiter.toFixed(2));
        setPriceSource('total');
        setTotalInput(editEntry.cost.toFixed(2));
        setNotes(editEntry.notes);
      } else {
        setDateTs(Date.now());
        setOdometer('');
        setLitersInput(defaultLiters?.toFixed(2) ?? '');
        const initialPrice = Math.round(defaultPrice * 100) / 100;
        setPricePerLiterInput(initialPrice.toFixed(2));
        setPriceSource(defaultLiters === null ? 'perLiter' : 'total');
        setTotalInput(defaultLiters === null ? '' : (Math.round(defaultLiters * initialPrice * 100) / 100).toFixed(2));
        setNotes(null);
      }
      setSaving(false);
      setSubmitted(false);
    }
  }, [visible, editEntry, defaultLiters, defaultPrice]);

  const liters = parseAmount(litersInput);
  const pricePerLiter = parseAmount(pricePerLiterInput);
  const totalCost = Math.round(parseAmount(totalInput) * 100) / 100;
  const enteredOdometer = Number.parseInt(odometer || '0', 10);
  const odometerInvalid = odometer !== '' && !Number.isFinite(enteredOdometer);
  const litersInvalid = liters <= 0;
  const totalInvalid = totalCost <= 0;
  const pricePerLiterInvalid = pricePerLiter <= 0;
  const canSave = odometer !== '' && !odometerInvalid && !litersInvalid && !totalInvalid && !pricePerLiterInvalid;

  const handleLitersChange = (value: string) => {
    const nextInput = sanitizeDecimal(value, 2);
    const nextLiters = parseAmount(nextInput);
    setLitersInput(nextInput);
    if (nextLiters <= 0) return;
    if (priceSource === 'total') {
      setPricePerLiterInput((parseAmount(totalInput) / nextLiters).toFixed(2));
    } else {
      setTotalInput((nextLiters * parseAmount(pricePerLiterInput)).toFixed(2));
    }
  };

  const handleTotalChange = (value: string) => {
    const nextInput = sanitizeDecimal(value, 2);
    const nextTotal = parseAmount(nextInput);
    setTotalInput(nextInput);
    setPriceSource('total');
    if (liters > 0) setPricePerLiterInput((nextTotal / liters).toFixed(2));
  };

  const handlePricePerLiterChange = (value: string) => {
    const nextInput = sanitizeDecimal(value, 2);
    const nextPricePerLiter = parseAmount(nextInput);
    setPricePerLiterInput(nextInput);
    setPriceSource('perLiter');
    if (liters > 0) setTotalInput((liters * nextPricePerLiter).toFixed(2));
  };

  const handleSave = useCallback(async () => {
    setSubmitted(true);
    if (!canSave) {
      haptic.error();
      return;
    }
    setSaving(true);
    try {
      const timelineIssue = await validateOdometerTimeline(vehicle.id, dateTs, enteredOdometer, editEntry ? [editEntry.id] : []);
      if (timelineIssue) {
        setOdometerTimelineError(
          t(timelineIssue.kind === 'belowPrevious' ? 'common.odometerBelowTimeline' : 'common.odometerAboveTimeline', {
            km: timelineIssue.boundaryKm.toLocaleString()
          })
        );
        haptic.error();
        return;
      }

      await onSave({
        dateTs,
        odometerKm: enteredOdometer,
        liters: Math.round(liters * 100) / 100,
        cost: totalCost,
        notes: notes?.trim() || null
      });
      haptic.success();
      onClose();
    } finally {
      setSaving(false);
    }
  }, [canSave, validateOdometerTimeline, vehicle.id, dateTs, enteredOdometer, editEntry, t, liters, totalCost, notes, onSave, onClose]);

  const fillPct = defaultLiters !== null && defaultLiters > 0 ? Math.min(100, Math.round((liters / defaultLiters) * 100)) : 0;
  const vehicleName = vehicle.nickname ?? `${vehicle.make} ${vehicle.model}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={styles.keyboardArea}>
          <Animated.View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md), marginBottom: sheetBottomOffset }]}>
            <ModalDragHandle onClose={onClose} disabled={saving} style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.vehicleName} numberOfLines={1}>
                  {vehicleName}
                </Text>
                {kmSinceLast > 0 && <Text style={styles.kmSince}>{t('fuel.kmSinceLast', { km: kmSinceLast.toLocaleString() })}</Text>}
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.formTitle}>{editEntry ? t('fuel.editTitle') : t('fuel.newTitle')}</Text>
                {lastEntry && (
                  <Text style={[styles.hint, styles.lastTank]} numberOfLines={1}>
                    {t('fuel.lastTankAt', { km: lastEntry.odometerKm.toLocaleString() })}
                  </Text>
                )}
              </View>
            </View>

            <ScrollView
              style={[styles.formScroll, { maxHeight: Math.max(160, windowHeight * 0.72) }]}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <FormField label={t('common.date')}>
                <DatePickerField
                  value={dateTs}
                  onChange={(value) => {
                    setDateTs(value);
                    setOdometerTimelineError(null);
                  }}
                  showLabel={false}
                />
              </FormField>
              <FormField
                label={t('fuel.stepOdometer')}
                error={
                  submitted && odometer === ''
                    ? t('fuel.requiredField')
                    : odometerInvalid
                      ? t('fuel.invalidOdometerMessage', { km: vehicle.currentOdometer.toLocaleString() })
                      : (odometerTimelineError ?? undefined)
                }
              >
                <TextInput
                  style={styles.input}
                  value={odometer}
                  onChangeText={(value) => {
                    setOdometer(value.replace(/[^0-9]/g, ''));
                    setOdometerTimelineError(null);
                  }}
                  placeholder={t('fuel.odometerPlaceholder')}
                  placeholderTextColor={colors.text2}
                  keyboardType="number-pad"
                  returnKeyType="next"
                />
              </FormField>
              <FormField label={t('fuel.stepLiters')} error={submitted && litersInvalid ? t('fuel.invalidLiters') : undefined}>
                <TextInput
                  style={styles.input}
                  value={litersInput}
                  onChangeText={handleLitersChange}
                  placeholder={t('fuel.litersPlaceholder')}
                  placeholderTextColor={colors.text2}
                  keyboardType="decimal-pad"
                />
              </FormField>
              <View style={styles.fillIndicator}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${fillPct}%` }]} />
                </View>
                <Text style={styles.hint}>{t('fuel.tankPercent', { pct: fillPct })}</Text>
              </View>

              <View style={styles.priceInputsRow}>
                <View style={styles.priceInputColumn}>
                  <FormField
                    label={t('fuel.labelPricePerL')}
                    error={submitted && pricePerLiterInvalid ? t('fuel.invalidAmount') : undefined}
                  >
                    <TextInput
                      style={styles.input}
                      value={pricePerLiterInput}
                      onChangeText={handlePricePerLiterChange}
                      placeholder={t('fuel.pricePlaceholder')}
                      placeholderTextColor={colors.text2}
                      keyboardType="decimal-pad"
                    />
                  </FormField>
                </View>
                <View style={styles.priceInputColumn}>
                  <FormField label={t('fuel.labelTotal')} error={submitted && totalInvalid ? t('fuel.invalidAmount') : undefined}>
                    <TextInput
                      style={styles.input}
                      value={totalInput}
                      onChangeText={handleTotalChange}
                      placeholder={t('fuel.amountPlaceholder')}
                      placeholderTextColor={colors.text2}
                      keyboardType="decimal-pad"
                    />
                  </FormField>
                </View>
              </View>

              <FormField label={t('fuel.notes')}>
                <TextInput
                  style={[styles.input, styles.notesInput, { height: notesHeight }]}
                  value={notes ?? ''}
                  onChangeText={setNotes}
                  onContentSizeChange={(event) => setNotesHeight(Math.max(48, event.nativeEvent.contentSize.height))}
                  placeholder={t('fuel.notesPlaceholder')}
                  placeholderTextColor={colors.text2}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
              </FormField>
            </ScrollView>

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose} disabled={saving}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton, saving && styles.saveDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.saveText}>{t('common.save')}</Text>}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  keyboardArea: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    flexShrink: 1,
    maxHeight: '98%',
    backgroundColor: colors.bg1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
    overflow: 'hidden'
  },
  handle: {
    backgroundColor: colors.border2,
    alignSelf: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  headerLeft: { flex: 1, marginRight: spacing.md },
  headerRight: { alignItems: 'flex-end', maxWidth: '50%', marginLeft: spacing.md },
  vehicleName: {
    fontSize: typeScale.subtitle,
    fontWeight: '700',
    color: colors.text0
  },
  kmSince: {
    fontSize: typeScale.captionLarge,
    color: colors.text2,
    marginTop: 2
  },
  formTitle: { ...typography.overline, color: colors.text2 },
  lastTank: { textAlign: 'right' },
  formScroll: { flexGrow: 0, flexShrink: 1 },
  formContent: { gap: spacing.md },
  field: { gap: spacing.xs },
  fieldLabel: { ...typography.overline },
  fieldError: { fontSize: typeScale.captionLarge, color: colors.danger },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    backgroundColor: colors.bg2,
    color: colors.text0,
    fontSize: typeScale.bodyMedium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  hint: {
    fontSize: typeScale.captionLarge,
    color: colors.text2
  },
  fillIndicator: { gap: spacing.xs },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bg3,
    overflow: 'hidden'
  },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.accent },
  priceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  priceInputsRow: { flexDirection: 'row', gap: spacing.md },
  priceInputColumn: { flex: 1 },
  notesInput: { minHeight: 48 },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: 0
  },
  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButton: {
    backgroundColor: colors.bg2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1
  },
  cancelText: { ...typography.button, color: colors.text1 },
  saveButton: { backgroundColor: colors.accent },
  saveText: {
    ...typography.button,
    fontWeight: '700',
    color: colors.white
  },
  saveDisabled: { opacity: 0.5 }
});
