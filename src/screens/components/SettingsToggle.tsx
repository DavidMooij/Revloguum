import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { readableColor, readableSize } from "../../theme/readability";
import { spacing, radius } from "../../theme/spacing";
import { typeScale } from "../../theme/typography";
import { useAppStore } from "../../store/appStore";

interface ToggleOption<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  fullWidth?: boolean;
}

export function SettingsToggle<T extends string>({
  options,
  value,
  onChange,
  fullWidth,
}: Props<T>) {
  const readabilityMode = useAppStore((s) => s.readabilityMode);

  return (
    <View
      style={[
        styles.container,
        fullWidth && styles.containerFullWidth,
        { backgroundColor: readableColor("bg3", readabilityMode) },
      ]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.option,
              fullWidth && styles.optionFullWidth,
              readabilityMode && styles.optionReadable,
              active && styles.optionActive,
            ]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                {
                  color: readableColor("text2", readabilityMode),
                  fontSize: readableSize(typeScale.caption, readabilityMode, 1),
                },
                active && styles.labelActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    padding: 2,
    gap: 2,
  },
  containerFullWidth: {
    width: "100%",
  },
  option: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm - 2,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
  },
  optionFullWidth: {
    flex: 1,
    minWidth: 0,
  },
  optionReadable: {
    minWidth: 42,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  optionActive: {
    backgroundColor: colors.accent,
  },
  label: {
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  labelActive: {
    color: colors.white,
  },
});
