export type FeedbackVariant = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  /** i18n key, e.g. "toast.serviceUpdated" */
  titleKey?: string;
  /** raw text, used if titleKey isn't provided */
  title?: string;
  /** i18n interpolation params */
  params?: Record<string, string | number>;
  variant?: FeedbackVariant;
  /** FontAwesome5 icon name override */
  icon?: string;
  /** ms visible before auto-dismiss, default 2600 */
  duration?: number;
}

export interface ToastItem extends Required<Pick<ToastOptions, "variant" | "duration">> {
  id: string;
  title: string;
  icon: string;
}

type CelebrationVariant = "milestone" | "streak" | "success";

export interface CelebrationOptions {
  titleKey?: string;
  title?: string;
  subtitleKey?: string;
  subtitle?: string;
  params?: Record<string, string | number>;
  /** FontAwesome5 icon name override */
  icon?: string;
  variant?: CelebrationVariant;
  /** ms visible before auto-dismiss; pass null to require a manual tap */
  autoDismissMs?: number | null;
}

export interface CelebrationState {
  title: string;
  subtitle?: string;
  icon: string;
  variant: CelebrationVariant;
  autoDismissMs: number | null;
}