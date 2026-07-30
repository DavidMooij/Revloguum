import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { readableColor, readableLineHeight, readableSize } from '../../theme/readability';
import { spacing, radius } from '../../theme/spacing';
import { typography, typeScale } from '../../theme/typography';
import { useAppStore } from '../../store/appStore';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  suffix?: string;
}

export default function TextInputField({ label, error, containerStyle, suffix, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const isMultiline = !!rest.multiline;
  const readabilityMode = useAppStore((s) => s.readabilityMode);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        style={[
          typography.label,
          styles.label,
          {
            color: readableColor('text1', readabilityMode),
            fontSize: readableSize(typeScale.bodySmall, readabilityMode, 1),
          },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.inputRow,
          isMultiline && styles.inputRowMultiline,
          focused && styles.focused,
          !!error && styles.errored,
          {
            backgroundColor: readableColor('bg3', readabilityMode),
            borderColor: focused
              ? readableColor('accent', readabilityMode)
              : !!error
                ? readableColor('danger', readabilityMode)
                : readableColor('border1', readabilityMode),
            minHeight: readabilityMode ? 54 : 48,
          },
        ]}
      >
        <TextInput
          placeholderTextColor={readableColor('text2', readabilityMode)}
          textAlignVertical={isMultiline ? "top" : "center"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={readableColor('accent', readabilityMode)}
          style={[
            styles.input,
            isMultiline && styles.inputMultiline,
            {
              color: readableColor('text0', readabilityMode),
              fontSize: readableSize(typeScale.body, readabilityMode, 1),
              lineHeight: readableLineHeight(21, readabilityMode, 3),
            },
          ]}
          {...rest}
        />
        {suffix ? (
          <Text
            style={[
              styles.suffix,
              {
                color: readableColor('text1', readabilityMode),
                fontSize: readableSize(typeScale.bodyMedium, readabilityMode, 1),
              },
            ]}
          >
            {suffix}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text
          style={[
            styles.error,
            {
              color: readableColor('dangerText', readabilityMode),
              fontSize: readableSize(typeScale.captionLarge, readabilityMode, 1),
            },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { color: colors.text1 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border1,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputRowMultiline: {
    height: undefined,
    minHeight: 48,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm + 2,
  },
  focused: { borderColor: colors.accent },
  errored: { borderColor: colors.danger },
  input: {
    flex: 1,
    color: colors.text0,
    fontSize: typeScale.body,
    fontWeight: '400',
  },
  inputMultiline: {
    paddingTop: 0,
  },
  suffix: {
    color: colors.text2,
    fontSize: typeScale.bodyMedium,
    marginLeft: spacing.xs,
  },
  error: {
    color: colors.dangerText,
    fontSize: typeScale.captionLarge,
    marginTop: 2,
  },
});
