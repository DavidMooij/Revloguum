import { colors } from "./colors";

const readabilityColors = {
  text0: "#FFFFFF",
  text1: "#E3E3EC",
  text2: "#C3C3D2",
  text3: "#9C9CAC",
  bg1: "#17171A",
  bg2: "#212129",
  bg3: "#2A2A34",
  bg4: "#343440",
  border0: "#30303A",
  border1: "#4A4A58",
  border2: "#626272",
  accentText: "#E8D9FF",
  successText: "#83EEB7",
  warningText: "#FFD27A",
  dangerText: "#FFA4A4",
} as const;

export function readableColor<K extends keyof typeof colors>(
  key: K,
  enabled: boolean,
): (typeof colors)[K] | string {
  if (!enabled) return colors[key];
  return key in readabilityColors
    ? readabilityColors[key as keyof typeof readabilityColors]
    : colors[key];
}

export function readableSize(
  base: number,
  enabled: boolean,
  bump = 1,
): number {
  return enabled ? base + bump : base;
}

export function readableLineHeight(
  base: number,
  enabled: boolean,
  bump = 2,
): number {
  return enabled ? base + bump : base;
}

export function readableTouchSize(
  base: number,
  enabled: boolean,
  bump = 4,
): number {
  return enabled ? base + bump : base;
}