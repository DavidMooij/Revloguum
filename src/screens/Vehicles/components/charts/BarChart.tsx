import { colors, spacing } from '@/theme';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  data: BarChartData[];
  width?: number;
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
  title?: string;
  showValues?: boolean;
}

export default function BarChart({
  data,
  width = SCREEN_WIDTH - spacing.lg * 2,
  height = 160,
  color = colors.accent,
  formatValue = v => v.toFixed(1),
  title,
  showValues = true,
}: Props) {
  const PAD_LEFT = 44;
  const PAD_RIGHT = 8;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 28;
  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = height - PAD_TOP - PAD_BOTTOM;

  const { bars, maxVal } = useMemo(() => {
    const maxVal = Math.max(...data.map(d => d.value), 0.01);
    const gap = chartW / data.length;
    const barW = gap * 0.55;

    const bars = data.map((d, i) => ({
      ...d,
      x: PAD_LEFT + i * gap + (gap - barW) / 2,
      barH: (d.value / maxVal) * chartH,
      barW,
    }));
    return { bars, maxVal };
  }, [data, chartW, chartH]);

  if (data.length === 0) return null;

  const yTicks = [0, 0.5, 1].map(t => ({
    y: PAD_TOP + chartH * (1 - t),
    value: maxVal * t,
  }));

  return (
    <View style={styles.wrapper}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={width} height={height}>
        {yTicks.map((tick, i) => (
          <React.Fragment key={i}>
            <Line
              x1={PAD_LEFT} y1={tick.y}
              x2={width - PAD_RIGHT} y2={tick.y}
              stroke={colors.border0} strokeWidth={0.5} strokeDasharray="3,3"
            />
            <SvgText
              x={PAD_LEFT - 5} y={tick.y + 4}
              fontSize={9} fill={colors.text2} textAnchor="end"
            >
              {formatValue(tick.value)}
            </SvgText>
          </React.Fragment>
        ))}

        {bars.map((b, i) => {
          const barColor = b.color ?? color;
          const barY = PAD_TOP + chartH - Math.max(b.barH, 2);
          const valueLabelY = Math.max(barY - 4, PAD_TOP + 10);
          return (
            <React.Fragment key={i}>
              <Rect
                x={b.x} y={barY}
                width={b.barW} height={Math.max(b.barH, 2)}
                rx={3} fill={barColor} opacity={0.9}
              />
              {showValues && b.value > 0 && (
                <SvgText
                  x={b.x + b.barW / 2} y={valueLabelY}
                  fontSize={9} fill={colors.text1} textAnchor="middle" fontWeight="600"
                >
                  {formatValue(b.value)}
                </SvgText>
              )}
              <SvgText
                x={b.x + b.barW / 2} y={height - 7}
                fontSize={9} fill={colors.text2} textAnchor="middle"
              >
                {b.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  title: { fontSize: 11, fontWeight: '700', color: colors.text2, letterSpacing: 0.6, textTransform: 'uppercase' },
});

