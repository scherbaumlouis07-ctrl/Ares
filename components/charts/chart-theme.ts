export const CHART_COLORS = {
  grid: "#1c1c1c",
  axis: "#666666",
  line: "#f2f2f2",
  dot: "#f2f2f2",
  critical: "#e5484d",
  tooltipBg: "#151515",
  tooltipBorder: "#242424",
};

export const chartAxisProps = {
  stroke: CHART_COLORS.axis,
  tick: { fill: CHART_COLORS.axis, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHART_COLORS.grid },
};

export const chartTooltipStyle = {
  background: CHART_COLORS.tooltipBg,
  border: `1px solid ${CHART_COLORS.tooltipBorder}`,
  borderRadius: 2,
  fontSize: 12,
  color: "#f2f2f2",
};
