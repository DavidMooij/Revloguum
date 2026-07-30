import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typeScale } from "../../theme/typography";
import {
  readableColor,
  readableLineHeight,
  readableSize,
} from "../../theme/readability";
import { useAppStore } from "../../store/appStore";

interface SettingsRowProps {
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}

export default function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  right,
  danger,
}: SettingsRowProps) {
  const readabilityMode = useAppStore((s) => s.readabilityMode);

  return (
    <TouchableOpacity
      style={[styles.row, readabilityMode && styles.rowReadable]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View
        style={[
          styles.rowIcon,
          danger && styles.rowIconDanger,
          {
            backgroundColor: danger
              ? readableColor("dangerMuted", readabilityMode)
              : readableColor("bg3", readabilityMode),
          },
        ]}
      >
        <Icon
          name={icon}
          size={14}
          color={
            danger
              ? readableColor("dangerText", readabilityMode)
              : readableColor("text1", readabilityMode)
          }
        />
      </View>
      <View style={styles.rowContent}>
        <Text
          style={[
            styles.rowLabel,
            danger && styles.rowLabelDanger,
            {
              color: danger
                ? readableColor("dangerText", readabilityMode)
                : readableColor("text0", readabilityMode),
              fontSize: readableSize(typeScale.body, readabilityMode, 1),
              lineHeight: readableLineHeight(22, readabilityMode, 2),
            },
          ]}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text
            style={[
              styles.rowSub,
              {
                color: readableColor("text1", readabilityMode),
                fontSize: readableSize(typeScale.captionLarge, readabilityMode, 1),
                lineHeight: readableLineHeight(16, readabilityMode, 3),
              },
            ]}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>
      {right ??
        (onPress ? (
          <Icon
            name="chevron-right"
            size={readableSize(11, readabilityMode, 1)}
            color={readableColor("text2", readabilityMode)}
          />
        ) : null)}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 56,
  },
  rowReadable: {
    minHeight: 62,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bg3,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowIconDanger: { backgroundColor: colors.dangerMuted },
  rowContent: { flex: 1 },
  rowLabel: {
    fontWeight: "500",
    color: colors.text0,
  },
  rowLabelDanger: { color: colors.dangerText },
  rowSub: { color: colors.text2, marginTop: 2 },
});
