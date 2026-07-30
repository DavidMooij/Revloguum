import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { typography, typeScale } from '../../theme/typography';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  suffix?: string;
}

export default function TextInputField({ label, error, containerStyle, suffix, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const isMultiline = !!rest.multiline;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[typography.label, styles.label]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          isMultiline && styles.inputRowMultiline,
          focused && styles.focused,
          !!error && styles.errored,
        ]}
      >
        <TextInput
          style={[styles.input, isMultiline && styles.inputMultiline]}
          placeholderTextColor={colors.text2}
          textAlignVertical={isMultiline ? "top" : "center"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
    lineHeight: 21,
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
