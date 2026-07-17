import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";

export interface ToggleOption<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SettingsToggle<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
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
  option: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm - 2,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
  },
  optionActive: {
    backgroundColor: colors.accent,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: colors.white,
  },
});
