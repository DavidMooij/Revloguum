import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { haptic } from "@/utils/haptics";
import type { CelebrationState } from "./types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const VARIANT_STYLE: Record<
  CelebrationState["variant"],
  { accent: string; accentMuted: string; glow: string }
> = {
  milestone: {
    accent: colors.accent,
    accentMuted: colors.accentMuted,
    glow: colors.cardGlowStrong,
  },
  streak: {
    accent: colors.warning,
    accentMuted: colors.warningMuted,
    glow: "rgba(232, 162, 40, 0.35)",
  },
  success: {
    accent: colors.success,
    accentMuted: colors.successMuted,
    glow: "rgba(52, 201, 122, 0.3)",
  },
};

/** small drifting particle used for the celebratory burst */
function Particle({
  delay,
  angle,
  variantColor,
}: {
  delay: number;
  angle: number;
  variantColor: string;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const distance = 70 + Math.random() * 20;
    const x = Math.cos(angle) * distance * progress.value;
    const y = Math.sin(angle) * distance * progress.value - 20 * progress.value;
    return {
      opacity: 1 - progress.value,
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: 1 - progress.value * 0.4 },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.particle, { backgroundColor: variantColor }, style]}
    />
  );
}

interface Props {
  state: CelebrationState;
  onDismiss: () => void;
}

export default function CelebrationOverlay({ state, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const v = VARIANT_STYLE[state.variant];

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(-8);
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    haptic.success();
    backdropOpacity.value = withTiming(1, { duration: 220 });
    cardOpacity.value = withTiming(1, { duration: 260 });
    cardScale.value = withSequence(
      withTiming(1.04, { duration: 260, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
    iconScale.value = withDelay(
      120,
      withSequence(
        withSpring(1.15, { damping: 8, stiffness: 260 }),
        withSpring(1, { damping: 10, stiffness: 220 }),
      ),
    );
    iconRotate.value = withDelay(
      120,
      withSequence(
        withTiming(8, { duration: 140 }),
        withSpring(0, { damping: 8, stiffness: 200 }),
      ),
    );
    ringScale.value = withDelay(
      100,
      withTiming(1.6, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    ringOpacity.value = withDelay(
      100,
      withSequence(
        withTiming(0.5, { duration: 120 }),
        withTiming(0, { duration: 580 }),
      ),
    );

    if (state.autoDismissMs != null) {
      const timer = setTimeout(close, state.autoDismissMs);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    haptic.light();
    backdropOpacity.value = withTiming(0, { duration: 200 });
    cardOpacity.value = withTiming(0, { duration: 180 });
    cardScale.value = withTiming(0.92, { duration: 200 }, (finished) => {
      if (finished) runOnJS(onDismiss)();
    });
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const particles = Array.from({ length: 10 });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={close}
        />
      </Animated.View>

      <View
        style={[styles.centerWrap, { paddingBottom: insets.bottom }]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.card,
            { borderColor: v.accentMuted, shadowColor: v.accent },
            cardStyle,
          ]}
        >
          <View style={styles.iconStage}>
            <Animated.View
              style={[
                styles.ring,
                { borderColor: v.accent, shadowColor: v.glow },
                ringStyle,
              ]}
            />
            {particles.map((_, i) => (
              <Particle
                key={i}
                delay={140 + i * 12}
                angle={(i / particles.length) * Math.PI * 2}
                variantColor={v.accent}
              />
            ))}
            <Animated.View
              style={[
                styles.iconCircle,
                { backgroundColor: v.accentMuted, borderColor: v.accent },
                iconStyle,
              ]}
            >
              <Icon name={state.icon} size={34} color={v.accent} />
            </Animated.View>
          </View>

          <Text style={[typography.titleCard, styles.title]}>
            {state.title}
          </Text>
          {state.subtitle ? (
            <Text style={[typography.bodySmall, styles.subtitle]}>
              {state.subtitle}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.dismissBtn, { backgroundColor: v.accent }]}
            onPress={close}
            activeOpacity={0.85}
          >
            <Text style={[typography.button, styles.dismissText]}>Nice</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const CARD_WIDTH = Math.min(SCREEN_WIDTH - spacing.xl * 2, 340);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.68)",
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.bg1,
    borderRadius: radius.lg + 6,
    borderWidth: 1,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
  iconStage: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  ring: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  dismissBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.full,
  },
  dismissText: {
    color: colors.white,
  },
});
