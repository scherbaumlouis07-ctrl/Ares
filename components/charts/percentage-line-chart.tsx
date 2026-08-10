"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, chartAxisProps, chartTooltipStyle } from "./chart-theme";

export interface PercentagePoint {
  label: string;
  value: number;
}

export function PercentageLineChart({ data }: { data: PercentagePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={140}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="label" {...chartAxisProps} />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          {...chartAxisProps}
          width={36}
        />
        <Tooltip
          contentStyle={chartTooltipStyle}
          labelStyle={{ color: CHART_COLORS.axis }}
          cursor={{ stroke: CHART_COLORS.grid }}
          formatter={(value) => [`${value}%`, ""]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={CHART_COLORS.line}
          strokeWidth={1.5}
          dot={{ r: 2.5, fill: CHART_COLORS.dot, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
