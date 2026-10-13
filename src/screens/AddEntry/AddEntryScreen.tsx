import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/routes';
import { colors } from '../../theme/colors';
import { typography, typeScale } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { useServiceTypes } from '../../hooks/useServiceTypes';
import { useServiceEntryActions } from '../../hooks/useServiceHistory';
import { useOdometerTimelineValidation } from '../../hooks/useOdometerTimelineValidation';
import { useVehicles } from '../../hooks/useVehicles';
import { getDatabase } from '../../data/db/database';
import { SQLiteServiceEntryRepo } from '../../data/repositories/SQLiteServiceEntryRepo';
import { generateUUID } from '../../utils/uuid';
import ServiceBlockEditor, { type ServiceBlock } from './components/ServiceBlockEditor';
import DatePickerField from './components/DatePickerField';
import TextInputField from '../components/TextInputField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import AlertModal from '../components/AlertModal';
import { haptic } from '@/utils/haptics';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { encryptImagePaths } from '@/security/imageEncryption';
import { useFeedback } from '../components/feedback/Feedbackprovider';
import { SQLiteDocumentRepo } from '../../data/repositories/SQLiteDocumentRepo';
import PhotoAttachmentsField from '../components/PhotoAttachmentsField';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEntry'>;

export default function AddEntryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { vehicleId, editEntryId } = route.params ?? {};

  const { serviceTypes } = useServiceTypes();
  const { addGroup, deleteGroup, deleteEntry } = useServiceEntryActions();
  const validateOdometerTimeline = useOdometerTimelineValidation();
  const { vehicles, activeVehicleId } = useVehicles();

  const resolvedMotoId = vehicleId ?? activeVehicleId ?? vehicles[0]?.id ?? '';

  const [blocks, setBlocks] = useState<ServiceBlock[]>([{ key: generateUUID(), serviceTypeId: null, cost: '', notes: '' }]);
  const [dateTs, setDateTs] = useState(Date.now());
  const [odometer, setOdometer] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ blocks?: string; odometer?: string }>({});
  const [images, setImages] = useState<string[]>([]);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const isEditing = !!editEntryId;
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editVehicleId, setEditVehicleId] = useState<string | null>(null);
  const [editEntryIds, setEditEntryIds] = useState<string[]>([]);
  const { showToast, showCelebration } = useFeedback();

  const updateBlock = useCallback((key: string, patch: Partial<ServiceBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  }, []);
  const addBlock = () => setBlocks((prev) => [...prev, { key: generateUUID(), serviceTypeId: null, cost: '', notes: '' }]);
  const removeBlock = (key: string) => setBlocks((prev) => prev.filter((b) => b.key !== key));

  useEffect(() => {
    if (isEditing || !resolvedMotoId) return;
    (async () => {
      const db = await getDatabase();
      const repo = new SQLiteServiceEntryRepo(db);
      const last = await repo.getLastForVehicle(resolvedMotoId);
      if (last) setOdometer(String(last.odometerKm + 1));
    })();
  }, [resolvedMotoId, isEditing]);

  useEffect(() => {
    if (!editEntryId) return;
    (async () => {
      const db = await getDatabase();
      const repo = new SQLiteServiceEntryRepo(db);
      const entry = await repo.getById(editEntryId);
      if (!entry) return;
      setDateTs(entry.dateTs);
      setOdometer(String(entry.odometerKm));
      setImages(entry.imagePaths ?? []);
      setEditVehicleId(entry.vehicleId);
      setEditEntryIds([entry.id]);
      if (entry.groupId) {
        const groupItems = await repo.getGroup(entry.groupId);
        setEditGroupId(entry.groupId);
        setEditEntryIds(groupItems.map((item) => item.id));
        setBlocks(
          groupItems.map((g) => ({
            key: g.id,
            serviceTypeId: g.serviceTypeId,
            cost: g.cost != null ? String(g.cost) : '',
            notes: g.notes ?? ''
          }))
        );
      } else {
        setBlocks([
          {
            key: entry.id,
            serviceTypeId: entry.serviceTypeId,
            cost: entry.cost != null ? String(entry.cost) : '',
            notes: entry.notes ?? ''
          }
        ]);
      }
    })();
  }, [editEntryId]);

  const validate = useCallback(() => {
    const errs: { blocks?: string; odometer?: string } = {};
    if (!blocks.some((b) => b.serviceTypeId)) errs.blocks = t('addEntry.errorTypeRequired');
    const odo = parseInt(odometer, 10);
    if (!odometer || isNaN(odo) || odo < 0) errs.odometer = t('addEntry.errorOdometerRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [blocks, odometer, t]);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      haptic.error();
      return;
    }
    haptic.light();
    setSaving(true);
    try {
      const parsedOdo = parseInt(odometer, 10);
      const timelineIssue = await validateOdometerTimeline(
        isEditing ? (editVehicleId ?? resolvedMotoId) : resolvedMotoId,
        dateTs,
        parsedOdo,
        isEditing ? editEntryIds : []
      );
      if (timelineIssue) {
        setErrors((previous) => ({
          ...previous,
          odometer: t(timelineIssue.kind === 'belowPrevious' ? 'common.odometerBelowTimeline' : 'common.odometerAboveTimeline', {
            km: timelineIssue.boundaryKm.toLocaleString()
          })
        }));
        haptic.error();
        return;
      }

      const encryptedImages = await encryptImagePaths(images);
      const items = blocks
        .filter((b) => b.serviceTypeId)
        .map((b) => ({
          serviceTypeId: b.serviceTypeId!,
          cost: b.cost.trim() ? parseFloat(b.cost) : null,
          notes: b.notes.trim() || null
        }));

      const documentHoldingId = `editing-${generateUUID()}`;
      let preservedDocumentIds: string[] = [];

      if (isEditing) {
        if (editEntryId) {
          const db = await getDatabase();
          const documentRepo = new SQLiteDocumentRepo(db);
          const documents = await documentRepo.getForServiceEntry(editEntryId);
          preservedDocumentIds = documents.map((document) => document.id);
          await documentRepo.reassignDocuments(preservedDocumentIds, documentHoldingId);
        }
        if (editGroupId) await deleteGroup(editGroupId, encryptedImages);
        else if (editEntryId) await deleteEntry(editEntryId, encryptedImages);
      }

      let isFirstServiceEver = false;
      if (!isEditing) {
        const db = await getDatabase();
        const countRow = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM service_entries;');
        isFirstServiceEver = (countRow?.c ?? 0) === 0;
      }

      const createdGroup = await addGroup(
        {
          vehicleId: isEditing ? (editVehicleId ?? resolvedMotoId) : resolvedMotoId,
          dateTs,
          odometerKm: parsedOdo,
          imagePaths: encryptedImages
        },
        items
      );
      if (preservedDocumentIds.length > 0 && createdGroup.entryIds[0]) {
        const db = await getDatabase();
        await new SQLiteDocumentRepo(db).reassignDocuments(preservedDocumentIds, createdGroup.entryIds[0]);
      }
      haptic.success();

      if (isFirstServiceEver) {
        showCelebration({
          titleKey: 'celebration.firstService.title',
          subtitleKey: 'celebration.firstService.subtitle',
          variant: 'milestone'
        });
      } else {
        showToast({
          titleKey: isEditing ? 'toast.serviceUpdated' : 'toast.serviceAdded',
          variant: 'success'
        });
      }
      navigation.goBack();
    } catch (e) {
      haptic.error();
      setErrorAlert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [
    validate,
    odometer,
    blocks,
    images,
    isEditing,
    editGroupId,
    editEntryId,
    editVehicleId,
    resolvedMotoId,
    editEntryIds,
    validateOdometerTimeline,
    dateTs,
    addGroup,
    deleteGroup,
    deleteEntry,
    navigation,
    showToast,
    showCelebration
  ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ScreenHeader title={isEditing ? t('addEntry.editTitle') : t('addEntry.title')} showBack />

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[typography.caption, styles.sectionLabel]}>{t('entryDetail.service')}</Text>

          <View style={styles.blocks}>
            {blocks.map((block, i) => (
              <ServiceBlockEditor
                key={block.key}
                index={i}
                block={block}
                serviceTypes={serviceTypes}
                canRemove={blocks.length > 1}
                onChange={(patch) => updateBlock(block.key, patch)}
                onRemove={() => removeBlock(block.key)}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.addBlock} onPress={addBlock} activeOpacity={0.7}>
            <Icon name="plus" size={13} color={colors.accent} />
            <Text style={styles.addBlockText}>{t('addEntry.addService')}</Text>
          </TouchableOpacity>
          {errors.blocks ? <Text style={styles.error}>{errors.blocks}</Text> : null}

          <TextInputField
            label={t('addEntry.odometer')}
            value={odometer}
            onChangeText={(value) => {
              setOdometer(value);
              setErrors((previous) => ({ ...previous, odometer: undefined }));
            }}
            keyboardType="numeric"
            placeholder={t('addEntry.placeholderOdometer')}
            suffix="km"
            error={errors.odometer}
          />

          <DatePickerField
            value={dateTs}
            onChange={(value) => {
              setDateTs(value);
              setErrors((previous) => ({ ...previous, odometer: undefined }));
            }}
          />

          <PhotoAttachmentsField label={t('addEntry.photos')} images={images} onChange={setImages} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <PrimaryButton label={isEditing ? t('addEntry.saveChanges') : t('addEntry.saveEntry')} onPress={handleSave} loading={saving} />
        </View>
      </View>

      <AlertModal
        visible={!!errorAlert}
        onClose={() => setErrorAlert(null)}
        icon="exclamation-triangle"
        iconColor={colors.dangerText}
        title={t('common.error')}
        message={errorAlert ?? ''}
        actions={[{ label: t('common.ok'), variant: 'secondary', onPress: () => {} }]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  scroll: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 40 },
  sectionLabel: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  blocks: { gap: spacing.md },
  addBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    borderStyle: 'dashed',
    backgroundColor: colors.bg1
  },
  addBlockText: {
    fontSize: typeScale.bodySmall,
    fontWeight: '600',
    color: colors.accent
  },
  error: {
    color: colors.dangerText,
    fontSize: typeScale.captionLarge,
    marginTop: spacing.xs
  },
  notesField: { minHeight: 100 },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border0,
    backgroundColor: colors.bg0
  }
});
