import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { readableColor, readableSize, readableTouchSize } from '../../theme/readability';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useAppStore } from '../../store/appStore';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export default function ScreenHeader({ title, subtitle, showBack, rightElement }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const readabilityMode = useAppStore((s) => s.readabilityMode);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: readableColor('bg0', readabilityMode),
          borderBottomColor: readableColor('border0', readabilityMode),
        },
      ]}
    >
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            style={[
              styles.backBtn,
              {
                width: readableTouchSize(36, readabilityMode),
                height: readableTouchSize(36, readabilityMode),
                borderRadius: readableTouchSize(18, readabilityMode, 2),
                backgroundColor: readableColor('bg2', readabilityMode),
              },
            ]}
            onPress={() => navigation.goBack()}
            hitSlop={12}
          >
            <Icon name="chevron-left" size={readableSize(16, readabilityMode, 2)} color={readableColor('text0', readabilityMode)} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <View style={styles.titleWrapper}>
          <Text
            style={[
              typography.h3,
              {
                color: readableColor('text0', readabilityMode),
                fontSize: readableSize(18, readabilityMode, 2),
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                typography.bodySmall,
                {
                  color: readableColor('text1', readabilityMode),
                  fontSize: readableSize(13, readabilityMode, 1),
                  lineHeight: readabilityMode ? 20 : 18,
                },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>{rightElement ?? null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backPlaceholder: { width: 36 },
  titleWrapper: { flex: 1 },
  right: { minWidth: 36, alignItems: 'flex-end' },
});
