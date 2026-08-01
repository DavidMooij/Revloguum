import React, { useEffect } from "react";
import { StyleSheet, Text, View, Dimensions } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import type { ToastItem } from "./types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const VARIANT_STYLE: Record<
  ToastItem["variant"],
  { bg: string; border: string; iconColor: string; iconBg: string }
> = {
  success: {
    bg: colors.bg1,
    border: colors.success,
    iconColor: colors.successText,
    iconBg: colors.successMuted,
  },
  error: {
    bg: colors.bg1,
    border: colors.danger,
    iconColor: colors.dangerText,
    iconBg: colors.dangerMuted,
  },
  warning: {
    bg: colors.bg1,
    border: colors.warning,
    iconColor: colors.warningText,
    iconBg: colors.warningMuted,
  },
  info: {
    bg: colors.bg1,
    border: colors.accent,
    iconColor: colors.accentText,
    iconBg: colors.accentMuted,
  },
};

interface Props {
  item: ToastItem;
  index: number;
  onDismiss: (id: string) => void;
}

export default function Toast({ item, index, onDismiss }: Props) {
  const v = VARIANT_STYLE[item.variant];

  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const progress = useSharedValue(1);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    opacity.value = withTiming(1, { duration: 180 });
    progress.value = withTiming(0, {
      duration: item.duration,
      easing: Easing.linear,
    });

    const timer = setTimeout(() => {
      close();
    }, item.duration);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    translateX.value = withTiming(0);
    opacity.value = withTiming(0, { duration: 150 });
    translateY.value = withTiming(20, { duration: 150 }, (finished) => {
      if (finished) runOnJS(onDismiss)(item.id);
    });
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      opacity.value =
        1 - Math.min(Math.abs(e.translationX) / SCREEN_WIDTH, 0.7);
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 80) {
        translateX.value = withTiming(
          Math.sign(e.translationX) * SCREEN_WIDTH,
          { duration: 200 },
          (finished) => {
            if (finished) runOnJS(onDismiss)(item.id);
          },
        );
      } else {
        translateX.value = withSpring(0);
        opacity.value = withTiming(1);
      }
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value - index * 6 },
      { translateX: translateX.value },
      { scale: 1 - index * 0.04 },
    ],
    opacity: opacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.toast,
          { borderColor: v.border, backgroundColor: v.bg, zIndex: 100 - index },
          containerStyle,
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: v.iconBg }]}>
          <Icon name={item.icon} size={14} color={v.iconColor} />
        </View>
        <Text
          style={[styles.text, typography.bodyMediumStrong]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: v.border },
              progressStyle,
            ]}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 2,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  text: {
    flex: 1,
  },
  progressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.bg3,
  },
  progressFill: {
    height: 2,
  },
});
