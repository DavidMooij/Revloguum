import { colors, spacing } from "@/theme";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Rect,
  G,
} from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface LineChartPoint {
  x: number;
  y: number;
  label?: string;
}

interface Props {
  data: LineChartPoint[];
  width?: number;
  height?: number;
  color?: string;
  gradientColor?: string;
  formatY?: (v: number) => string;
  formatX?: (v: number) => string;
  title?: string;
  unit?: string;
  showDots?: boolean;
  showGrid?: boolean;
}

export default function LineChart({
  data,
  width = SCREEN_WIDTH - spacing.lg * 2,
  height = 180,
  color = colors.accent,
  gradientColor,
  formatY = (v) => v.toFixed(1),
  formatX,
  title,
  unit,
  showDots = true,
  showGrid = true,
}: Props) {
  const { t } = useTranslation();
  const PAD_LEFT = 50;
  const PAD_RIGHT = 12;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 36;
  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = height - PAD_TOP - PAD_BOTTOM;

  const { points, minY, maxY, pathD, areaD } = useMemo(() => {
    if (data.length < 2)
      return { points: [], minY: 0, maxY: 0, pathD: "", areaD: "" };

    const xs = data.map((d) => d.x);
    const ys = data.map((d) => d.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const padY = rangeY * 0.12;

    const toSvg = (d: LineChartPoint) => ({
      svgX: PAD_LEFT + ((d.x - minX) / rangeX) * chartW,
      svgY:
        PAD_TOP +
        chartH -
        ((d.y - (minY - padY)) / (rangeY + padY * 2)) * chartH,
    });

    const pts = data.map((d) => ({ ...d, ...toSvg(d) }));

    let pathD = `M ${pts[0].svgX} ${pts[0].svgY}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX = (prev.svgX + curr.svgX) / 2;
      pathD += ` C ${cpX} ${prev.svgY}, ${cpX} ${curr.svgY}, ${curr.svgX} ${curr.svgY}`;
    }

    const areaD = `${pathD} L ${pts[pts.length - 1].svgX} ${PAD_TOP + chartH} L ${pts[0].svgX} ${PAD_TOP + chartH} Z`;

    return {
      points: pts,
      minY: minY - padY,
      maxY: maxY + padY * 0.1,
      pathD,
      areaD,
    };
  }, [data, chartW, chartH]);

  if (data.length < 2) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.empty}>{t("chart.notEnoughData")}</Text>
      </View>
    );
  }

  const gradId = `grad_${title?.replace(/\s/g, "") ?? "chart"}`;
  const clipId = `clip_${title?.replace(/\s/g, "") ?? "chart"}`;
  const gc = gradientColor ?? color;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: PAD_TOP + chartH * (1 - t),
    value: minY + (maxY - minY) * t,
  }));

  const labelIndices = [
    0,
    Math.floor((points.length - 1) / 2),
    points.length - 1,
  ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate
  const labelPoints = labelIndices.map((i) => points[i]).filter(Boolean);
  const getLabelX = (p: (typeof points)[0], idx: number, total: number) => {
    if (idx === 0) return Math.max(p.svgX, PAD_LEFT + 2);
    if (idx === total - 1) return Math.min(p.svgX, width - PAD_RIGHT - 2);
    return p.svgX;
  };

  return (
    <View style={styles.wrapper}>
      {title && (
        <Text style={styles.title}>
          {title}
          {unit ? ` (${unit})` : ""}
        </Text>
      )}
      <View style={{ overflow: "hidden" }}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={gc} stopOpacity="0.3" />
              <Stop offset="1" stopColor={gc} stopOpacity="0" />
            </LinearGradient>
            <ClipPath id={clipId}>
              <Rect
                x={PAD_LEFT}
                y={0}
                width={chartW + PAD_RIGHT}
                height={height}
              />
            </ClipPath>
          </Defs>

          {showGrid &&
            gridLines.map((g, i) => (
              <React.Fragment key={i}>
                <Line
                  x1={PAD_LEFT}
                  y1={g.y}
                  x2={width - PAD_RIGHT}
                  y2={g.y}
                  stroke={colors.border0}
                  strokeWidth={0.5}
                  strokeDasharray="4,4"
                />
                <SvgText
                  x={PAD_LEFT - 5}
                  y={g.y + 4}
                  fontSize={9}
                  fill={colors.text2}
                  textAnchor="end"
                >
                  {formatY(g.value)}
                </SvgText>
              </React.Fragment>
            ))}

          <G clipPath={`url(#${clipId})`}>
            <Path d={areaD} fill={`url(#${gradId})`} />
            <Path
              d={pathD}
              stroke={color}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {showDots &&
              points.map((p, i) => (
                <Circle key={i} cx={p.svgX} cy={p.svgY} r={3} fill={color} />
              ))}
          </G>

          {labelPoints.map((p, i) => {
            const anchor =
              i === 0
                ? "start"
                : i === labelPoints.length - 1
                  ? "end"
                  : "middle";
            const x = getLabelX(p, i, labelPoints.length);
            return (
              <SvgText
                key={i}
                x={x}
                y={height - 8}
                fontSize={9}
                fill={colors.text2}
                textAnchor={anchor}
              >
                {p.label ?? (formatX ? formatX(p.x) : "")}
              </SvgText>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  container: { alignItems: "center", justifyContent: "center" },
  empty: { fontSize: 13, color: colors.text2 },
});
