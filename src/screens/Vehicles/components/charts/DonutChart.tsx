import { colors } from "@/theme";
import { typeScale } from "@/theme/typography";
import { formatCost } from "@/utils/format";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSub?: string;
}

export default function DonutChart({
  data,
  size = 140,
  strokeWidth = 22,
  centerLabel,
  centerSub,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;

  return (
    <View style={styles.wrapper}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${cx}, ${cy}`}>
            <Circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={colors.bg3}
              strokeWidth={strokeWidth}
            />
            {data.map((seg, i) => {
              const dash = (seg.value / total) * circumference;
              const gap = circumference - dash;
              const el = (
                <Circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return el;
            })}
          </G>
        </Svg>

        {(centerLabel || centerSub) && (
          <View style={[styles.center, { width: size, height: size }]}>
            {centerLabel && (
              <Text style={styles.centerLabel}>{centerLabel}</Text>
            )}
            {centerSub && <Text style={styles.centerSub}>{centerSub}</Text>}
          </View>
        )}
      </View>

      <View style={styles.legend}>
        {data.map((seg, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />

            <View style={styles.legendText}>
              <Text style={styles.legendLabel}>{seg.label}</Text>

              <Text style={styles.legendAmount}>{formatCost(seg.value)}</Text>
            </View>

            <Text style={styles.legendValue}>
              {((seg.value / total) * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "center", gap: 20 },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    fontSize: typeScale.bodyLarge,
    fontWeight: "700",
    color: colors.text0,
    letterSpacing: -0.3,
  },
  centerSub: { fontSize: typeScale.caption, color: colors.text2, marginTop: 2 },
  legend: { flex: 1, gap: 8 },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },

  legendText: {
    flex: 1,
  },

  legendLabel: {
    fontSize: typeScale.captionLarge,
    fontWeight: "600",
    color: colors.text1,
  },

  legendAmount: {
    fontSize: typeScale.caption,
    color: colors.text2,
    marginTop: 1,
  },

  legendValue: {
    fontSize: typeScale.captionLarge,
    fontWeight: "700",
    color: colors.text0,
  },
});
