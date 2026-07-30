import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { ServiceType } from "../../../domain/entities/ServiceType";
import { colors } from "../../../theme/colors";
import { spacing, radius } from "../../../theme/spacing";
import { typography, typeScale } from "../../../theme/typography";
import TextInputField from "../../components/TextInputField";
import ServiceTypePicker from "./ServiceTypePicker";

export interface ServiceBlock {
  key: string;
  serviceTypeId: string | null;
  cost: string;
  notes: string;
}

interface Props {
  index: number;
  block: ServiceBlock;
  serviceTypes: ServiceType[];
  canRemove: boolean;
  error?: string;
  onChange: (patch: Partial<ServiceBlock>) => void;
  onRemove: () => void;
}

export default function ServiceBlockEditor({
  index,
  block,
  serviceTypes,
  canRemove,
  error,
  onChange,
  onRemove,
}: Props) {
  const { t } = useTranslation();

  const selected = serviceTypes.find((s) => s.id === block.serviceTypeId);
  const exampleKey =
    selected?.translationKey?.split(".").pop() ??
    selected?.id.replace("sys_", "");
  const notePlaceholder = selected
    ? t(`addEntry.noteExamples.${exampleKey}`, {
        defaultValue: t("addEntry.placeholderNotes"),
      })
    : t("addEntry.placeholderNotes");

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t("addEntry.serviceBlock", { index: index + 1 })}
        </Text>
        {canRemove && (
          <TouchableOpacity onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
            <Icon name="times" size={14} color={colors.text2} />
          </TouchableOpacity>
        )}
      </View>

      <ServiceTypePicker
        serviceTypes={serviceTypes}
        selectedId={block.serviceTypeId}
        onSelect={(id) => onChange({ serviceTypeId: id })}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInputField
        label={t("addEntry.notes")}
        value={block.notes}
        onChangeText={(v) => onChange({ notes: v })}
        placeholder={notePlaceholder}
        multiline
      />

      <TextInputField
        label={t("addEntry.cost")}
        value={block.cost}
        onChangeText={(v) => onChange({ cost: v })}
        keyboardType="decimal-pad"
        placeholder={t("addEntry.placeholderCost")}
        suffix="CHF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...typography.caption,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg3,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  costField: { width: 120 },
  error: { color: colors.dangerText, fontSize: typeScale.captionLarge },
});
