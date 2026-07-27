import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing, radius } from "../../theme/spacing";
import { useServiceTypes } from "../../hooks/useServiceTypes";
import { useServiceTypeLabel } from "../../hooks/useServiceTypeLabel";
import type { ServiceType } from "../../domain/entities/ServiceType";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import Divider from "../components/Divider";
import AlertModal from "../components/AlertModal";
import { haptic } from "@/utils/haptics";

const ICON_OPTIONS = [
  "wrench",
  "oil-can",
  "link",
  "tint",
  "circle-notch",
  "grip-lines",
  "wind",
  "bolt",
  "thermometer-half",
  "sliders-h",
  "cog",
  "tools",
  "battery-full",
  "lightbulb",
  "shield-alt",
  "sync-alt",
];

export default function ManageServiceTypesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { serviceTypes, addServiceType, updateServiceType, deleteServiceType } =
    useServiceTypes();
  const getLabel = useServiceTypeLabel();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("wrench");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceType | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const openAdd = () => {
    setEditingType(null);
    setName("");
    setIcon("wrench");
    setModalVisible(true);
  };

  const openEdit = (st: ServiceType) => {
    setEditingType(st);
    setName(st.name);
    setIcon(st.icon);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      haptic.error();
      return;
    }
    haptic.light();
    setSaving(true);
    try {
      if (editingType) {
        await updateServiceType(editingType.id, name.trim(), icon);
      } else {
        await addServiceType({
          name: name.trim(),
          icon,
          sortOrder: serviceTypes.length,
        });
      }
      haptic.success();
      setModalVisible(false);
    } catch (e) {
      haptic.error();
      setErrorAlert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const systemTypes = serviceTypes.filter((s) => s.isSystem);
  const customTypes = serviceTypes.filter((s) => !s.isSystem);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t('serviceTypes.title')}
        showBack
        rightElement={
          <TouchableOpacity onPress={openAdd} hitSlop={8}>
            <Icon name="plus" size={16} color={colors.accent} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.caption, styles.sectionLabel]}>
          {t('serviceTypes.systemTypes')}
        </Text>
        {systemTypes.map((st) => (
          <View key={st.id} style={styles.row}>
            <View style={styles.iconWrap}>
              <Icon name={st.icon} size={14} color={colors.text2} />
            </View>
            <Text style={[typography.body, { flex: 1 }]}>{getLabel(st)}</Text>
            <Text style={styles.systemBadge}>{t('serviceTypes.builtIn')}</Text>
          </View>
        ))}

        <Divider style={{ marginVertical: spacing.lg }} />

        <Text style={[typography.caption, styles.sectionLabel]}>
          {t('serviceTypes.customTypes')}
        </Text>
        {customTypes.length === 0 ? (
          <Text
            style={[
              typography.bodySmall,
              { textAlign: "center", marginVertical: spacing.xl },
            ]}
          >
            {t('serviceTypes.noCustomTypes')}
          </Text>
        ) : (
          customTypes.map((st) => (
            <View key={st.id} style={styles.row}>
              <View style={[styles.iconWrap, styles.iconWrapCustom]}>
                <Icon name={st.icon} size={14} color={colors.accent} />
              </View>
              <Text style={[typography.body, { flex: 1 }]}>{getLabel(st)}</Text>
              <TouchableOpacity
                onPress={() => openEdit(st)}
                hitSlop={8}
                style={styles.actionBtn}
              >
                <Icon name="pen" size={13} color={colors.text2} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDeleteTarget(st)}
                hitSlop={8}
                style={styles.actionBtn}
              >
                <Icon name="trash-alt" size={13} color={colors.dangerText} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <Text style={[typography.h3, styles.modalTitle]}>
              {editingType ? t('serviceTypes.editType') : t('serviceTypes.newType')}
            </Text>
            <Text style={styles.fieldLabel}>{t('serviceTypes.nameLabel')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('serviceTypes.placeholderName')}
              placeholderTextColor={colors.text2}
              autoFocus
            />
              <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>
              {t('serviceTypes.iconLabel')}
            </Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[
                    styles.iconOption,
                    icon === ic && styles.iconOptionActive,
                  ]}
                  onPress={() => setIcon(ic)}
                >
                  <Icon
                    name={ic}
                    size={16}
                    color={icon === ic ? colors.accent : colors.text2}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <PrimaryButton
                label={t('serviceTypes.cancel')}
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                label={editingType ? t('serviceTypes.save') : t('serviceTypes.add')}
                onPress={handleSave}
                loading={saving}
                disabled={!name.trim()}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        icon="trash-alt"
        iconColor={colors.dangerText}
        title={`${t('serviceTypes.deleteType').replace('%s', deleteTarget?.name ?? '')}`}
        message={t('serviceTypes.deleteTypeMessage')}
        actions={[
          { label: t('common.cancel'), variant: "secondary", onPress: () => {} },
          {
            label: t('common.delete'),
            variant: "danger",
            onPress: async () => {
              if (deleteTarget) await deleteServiceType(deleteTarget.id);
            },
          },
        ]}
      />

      <AlertModal
        visible={!!errorAlert}
        onClose={() => setErrorAlert(null)}
        icon="exclamation-triangle"
        iconColor={colors.dangerText}
        title={t('common.error')}
        message={errorAlert ?? ""}
        actions={[{ label: t('common.ok'), variant: "secondary", onPress: () => {} }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  scroll: { padding: spacing.lg, paddingBottom: 60 },
  sectionLabel: { marginBottom: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border0,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bg3,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapCustom: { backgroundColor: colors.accentMuted },
  systemBadge: {
    fontSize: 10,
    color: colors.text3,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: colors.bg2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  modalTitle: { textAlign: "center", marginBottom: spacing.sm },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border1,
    color: colors.text0,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconOptionActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
