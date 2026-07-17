import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  suffix?: string;
}

export default function TextInputField({ label, error, containerStyle, suffix, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[typography.label, styles.label]}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.focused, !!error && styles.errored]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.text2}
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
  focused: { borderColor: colors.accent },
  errored: { borderColor: colors.danger },
  input: {
    flex: 1,
    color: colors.text0,
    fontSize: 15,
    fontWeight: '400',
  },
  suffix: {
    color: colors.text2,
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  error: {
    color: colors.dangerText,
    fontSize: 12,
    marginTop: 2,
  },
});
