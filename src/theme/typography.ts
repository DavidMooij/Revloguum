import { StyleSheet, Platform } from 'react-native';
import { colors } from './colors';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = StyleSheet.create({
  h1: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text0,
  },
  h2: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text0,
  },
  h3: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.text0,
  },
  h4: {
    fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text0,
  },
  body: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.text0,
  },
  bodySmall: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.text1,
  },
  caption: {
    fontFamily,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text2,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
    fontSize: 14,
    color: colors.text0,
  },
  label: {
    fontFamily,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text1,
  },
  numericLarge: {
    fontFamily,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.text0,
  },
});
