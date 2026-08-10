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

export interface PricePoint {
  label: string;
  value: number;
}

export function PriceLineChart({
  data,
  valuePrefix = "$",
}: {
  data: PricePoint[];
  valuePrefix?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={100}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="label" {...chartAxisProps} />
        <YAxis
          {...chartAxisProps}
          width={56}
          domain={["auto", "auto"]}
          tickFormatter={(v: number) => `${valuePrefix}${v.toLocaleString()}`}
        />
        <Tooltip
          contentStyle={chartTooltipStyle}
          labelStyle={{ color: CHART_COLORS.axis }}
          cursor={{ stroke: CHART_COLORS.grid }}
          formatter={(value) => [`${valuePrefix}${Number(value).toLocaleString()}`, ""]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={CHART_COLORS.line}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3.5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
