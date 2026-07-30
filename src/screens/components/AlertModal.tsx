import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { FontAwesome5 } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { typography, typeScale } from "../../theme/typography";

const { width } = Dimensions.get("window");

export interface AlertAction {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  iconColor?: string;
  actions: AlertAction[];
  onClose: () => void;
  children?: React.ReactNode;
}

export default function AlertModal({
  visible,
  title,
  message,
  icon,
  iconColor,
  actions,
  onClose,
  children,
}: Props) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 18, stiffness: 250 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      scale.value = withTiming(0.9, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const variantStyle = (variant: AlertAction["variant"] = "secondary") => ({
    bg: {
      primary: colors.accent,
      secondary: colors.bg3,
      danger: colors.dangerMuted,
    }[variant],
    border: {
      primary: colors.accent,
      secondary: colors.border1,
      danger: colors.danger,
    }[variant],
    text: {
      primary: colors.white,
      secondary: colors.text0,
      danger: colors.dangerText,
    }[variant],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {icon && (
            <View
              style={[
                styles.iconWrap,
                { borderColor: iconColor ?? colors.border2 },
              ]}
            >
              <FontAwesome5
                name={icon}
                size={24}
                color={iconColor ?? colors.text1}
              />
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children}

          <View style={styles.divider} />

          <View
            style={[styles.actions, actions.length === 2 && styles.actionsRow]}
          >
            {actions.map((action, i) => {
              const v = variantStyle(action.variant);
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    actions.length === 2 && styles.btnHalf,
                    { backgroundColor: v.bg, borderColor: v.border },
                    action.disabled && styles.btnDisabled,
                  ]}
                  onPress={() => {
                    if (action.disabled) return;
                    action.onPress();
                    onClose();
                  }}
                  activeOpacity={action.disabled ? 1 : 0.75}
                >
                  <Text style={[styles.btnText, { color: v.text }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  sheet: {
    width: width - spacing.xl * 2,
    backgroundColor: colors.bg2,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleMedium,
    color: colors.text0,
    textAlign: "center",
  },
  message: {
    fontSize: typeScale.bodyMedium,
    color: colors.text1,
    textAlign: "center",
    lineHeight: 20,
  },
  divider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border0,
    marginVertical: spacing.xs,
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  btn: {
    flexGrow: 1,
    flexBasis: "48%",
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  btnHalf: {
    flex: 1,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    ...typography.button,
  },
});
