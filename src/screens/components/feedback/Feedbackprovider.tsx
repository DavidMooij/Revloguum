import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { haptic } from "@/utils/haptics";
import Toast from "./Toast";
import type {
  ToastOptions,
  ToastItem,
  CelebrationOptions,
  CelebrationState,
  FeedbackVariant,
} from "./types";
import CelebrationOverlay from "./Celebrationoverlay";

const DEFAULT_ICON: Record<FeedbackVariant, string> = {
  success: "check-circle",
  error: "exclamation-circle",
  warning: "exclamation-triangle",
  info: "info-circle",
};

const DEFAULT_CELEBRATION_ICON: Record<CelebrationState["variant"], string> = {
  milestone: "flag-checkered",
  streak: "fire",
  success: "check-circle",
};

interface FeedbackContextValue {
  showToast: (options: ToastOptions) => void;
  showCelebration: (options: CelebrationOptions) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return ctx;
}

const MAX_VISIBLE_TOASTS = 3;

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const idCounter = useRef(0);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const variant = options.variant ?? "info";
      const title = options.titleKey
        ? String(t(options.titleKey, options.params as any))
        : (options.title ?? "");
      if (!title) return;

      const item: ToastItem = {
        id: String(idCounter.current++),
        title,
        variant,
        icon: options.icon ?? DEFAULT_ICON[variant],
        duration: options.duration ?? 2600,
      };

      switch (variant) {
        case "success":
          haptic.success();
          break;
        case "error":
          haptic.error();
          break;
        case "warning":
          haptic.warning();
          break;
        default:
          haptic.selection();
      }

      setToasts((prev) => [item, ...prev].slice(0, MAX_VISIBLE_TOASTS));
    },
    [t],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const showCelebration = useCallback(
    (options: CelebrationOptions) => {
      const variant = options.variant ?? "milestone";
      const title = options.titleKey
        ? String(t(options.titleKey, options.params as any))
        : (options.title ?? "");
      if (!title) return;
      const subtitle = options.subtitleKey
        ? String(t(options.subtitleKey, options.params as any))
        : options.subtitle;

      setCelebration({
        title,
        subtitle,
        icon: options.icon ?? DEFAULT_CELEBRATION_ICON[variant],
        variant,
        autoDismissMs:
          options.autoDismissMs === undefined ? 2400 : options.autoDismissMs,
      });
    },
    [t],
  );

  const dismissCelebration = useCallback(() => setCelebration(null), []);

  return (
    <FeedbackContext.Provider value={{ showToast, showCelebration }}>
      {children}

      <View
        style={[styles.toastHost, { bottom: insets.bottom + 20 }]}
        pointerEvents="box-none"
      >
        {toasts.map((item, index) => (
          <Toast
            key={item.id}
            item={item}
            index={index}
            onDismiss={dismissToast}
          />
        ))}
      </View>

      {celebration && (
        <CelebrationOverlay
          state={celebration}
          onDismiss={dismissCelebration}
        />
      )}
    </FeedbackContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastHost: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 90,
  },
});
