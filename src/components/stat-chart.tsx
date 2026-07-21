import React, { useState, useRef, useEffect } from "react";
import { StatEntry, TimeRange } from "../types";
import { Calendar, Activity } from "lucide-react";
import { calculateCheckpoints } from "../utils/checkpoint";
import { Container } from "./ui/container";

interface StatChartProps {
  entries: StatEntry[];
}

export default function StatChart({ entries }: StatChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 320 });

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayString();

  // Update dimensions based on container width
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        // Keep height proportional but with reasonable bounds
        const computedHeight = Math.max(
          240,
          Math.min(360, Math.floor(width * 0.4)),
        );
        setDimensions({ width: Math.max(300, width), height: computedHeight });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 1. Sort entries chronologically
  const sortedEntries = [...entries].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // Compute checkpoint calculations
  const checkpointMapping = calculateCheckpoints(entries);

  // 2. Filter entries based on the selected time range
  const getFilteredEntries = () => {
    if (sortedEntries.length === 0) return [];
    if (timeRange === "all") return sortedEntries;
    if (timeRange === "custom") {
      return sortedEntries.filter((entry) => {
        if (customStartDate && entry.date < customStartDate) return false;
        if (customEndDate && entry.date > customEndDate) return false;
        return true;
      });
    }

    // Find the latest entry date as anchor to make historical datasets look beautiful
    const latestDateStr = sortedEntries[sortedEntries.length - 1].date;
    const anchorDate = new Date(latestDateStr);

    return sortedEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      const diffTime = anchorDate.getTime() - entryDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (timeRange === "1m") return diffDays <= 30;
      if (timeRange === "3m") return diffDays <= 90;
      if (timeRange === "6m") return diffDays <= 180;
      if (timeRange === "1y") return diffDays <= 365;
      return true;
    });
  };

  const filtered = getFilteredEntries();

  // Calculate statistics for the current filtered range (using statistic entries only)
  const statEntries = filtered.filter(
    (e) => e.value !== null && e.value !== undefined,
  ) as (StatEntry & { value: number })[];
  const values = statEntries.map((e) => e.value);
  const maxVal = values.length ? Math.max(...values) : 0;
  const minVal = values.length ? Math.min(...values) : 0;
  const avgVal = values.length
    ? values.reduce((sum, v) => sum + v, 0) / values.length
    : 0;

  // For change percentage, use the last two statistic entries
  const allStatEntries = sortedEntries.filter(
    (e) => e.value !== null && e.value !== undefined,
  ) as (StatEntry & { value: number })[];
  const latestVal = allStatEntries.length
    ? allStatEntries[allStatEntries.length - 1].value
    : null;
  const previousVal =
    allStatEntries.length > 1
      ? allStatEntries[allStatEntries.length - 2].value
      : null;

  // Padding and margins for the SVG plotting area
  const padding = { top: 20, right: 35, bottom: 45, left: 55 };
  const plotWidth = dimensions.width - padding.left - padding.right;
  const plotHeight = dimensions.height - padding.top - padding.bottom;

  // Render an empty state if not enough data
  if (entries.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 text-zinc-500"
        id="chart-empty-state"
      >
        <Activity className="w-10 h-10 mb-3 text-zinc-700 animate-pulse" />
        <p className="text-sm font-medium">
          No statistic entries recorded yet.
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          Add an entry above to start charting trends.
        </p>
      </div>
    );
  }

  // Handle plotting coordinates
  const parseDateToUnix = (dateStr: string) => new Date(dateStr).getTime();

  // Timestamps for X-axis (all entries have dates)
  const timestamps = filtered.map((e) => parseDateToUnix(e.date));
  const minTime = timestamps.length ? Math.min(...timestamps) : 0;
  const maxTime = timestamps.length ? Math.max(...timestamps) : 0;
  const timeSpan = maxTime - minTime || 1; // Avoid divide by zero

  // Range for Y-axis (add 15% buffer above and below for breathing room)
  const valSpan = maxVal - minVal;
  const yMin = minVal - (valSpan * 0.15 || 5);
  const yMax = maxVal + (valSpan * 0.15 || 5);
  const ySpan = yMax - yMin || 1;

  // Convert an entry to SVG coordinates
  const getCoordinates = (entry: StatEntry, index: number) => {
    // X Coordinate: distributed linearly across dates
    let x = padding.left;
    if (filtered.length > 1) {
      const time = parseDateToUnix(entry.date);
      x += ((time - minTime) / timeSpan) * plotWidth;
    } else {
      x += plotWidth / 2; // Center single item
    }

    // Y Coordinate: events sit exactly on the bottom timeline axis
    let y = padding.top + plotHeight;
    if (entry.value !== null && entry.value !== undefined) {
      y =
        padding.top + plotHeight - ((entry.value - yMin) / ySpan) * plotHeight;
    }
    return { x, y };
  };

  const points = filtered.map((entry, index) => ({
    ...getCoordinates(entry, index),
    entry,
    index,
  }));

  // Create SVG path string for line - ONLY for statistic entries
  let linePath = "";
  let areaPath = "";

  const statPoints = points.filter(
    (p) => p.entry.value !== null && p.entry.value !== undefined,
  );

  if (statPoints.length > 0) {
    linePath = statPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    // Close the area path to the bottom of the plot area
    if (statPoints.length > 1) {
      const first = statPoints[0];
      const last = statPoints[statPoints.length - 1];
      const bottomY = padding.top + plotHeight;
      areaPath = `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
    }
  }

  // Y-axis gridlines & ticks (usually 4 levels)
  const yTicks = Array.from({ length: 4 }).map((_, i) => {
    const val = yMin + (ySpan / 3) * i;
    const y = padding.top + plotHeight - (i / 3) * plotHeight;
    return { val: Math.round(val * 10) / 10, y };
  });

  // X-axis ticks (usually 3 to 5 dates depending on range)
  let xTicks: { dateStr: string; x: number }[] = [];
  if (filtered.length > 0) {
    if (filtered.length <= 4) {
      xTicks = points.map((p) => ({ dateStr: p.entry.date, x: p.x }));
    } else {
      // Pick dynamic items to show as ticks
      const stride = Math.max(1, Math.floor(filtered.length / 3));
      for (let i = 0; i < filtered.length; i += stride) {
        xTicks.push({ dateStr: filtered[i].date, x: points[i].x });
      }
      // Ensure the last one is included
      if ((filtered.length - 1) % stride !== 0) {
        xTicks.push({
          dateStr: filtered[filtered.length - 1].date,
          x: points[points.length - 1].x,
        });
      }
    }
  }

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    // Format to "DD.MM.YY"
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || points.length === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Find closest point by X coordinate
    let closestIndex = 0;
    let minDistance = Infinity;

    points.forEach((p, idx) => {
      const dist = Math.abs(p.x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    // Only show hover if cursor is relatively close to a point (or generally on chart)
    if (minDistance < 60) {
      setHoveredIndex(closestIndex);
      const activePoint = points[closestIndex];
      setTooltipPos({
        x: activePoint.x,
        y: activePoint.y - 12,
      });
    } else {
      setHoveredIndex(null);
      setTooltipPos(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltipPos(null);
  };

  const ranges: { key: TimeRange; label: string }[] = [
    { key: "all", label: "All Time" },
    { key: "1m", label: "1 Month" },
    { key: "3m", label: "3 Months" },
    { key: "6m", label: "6 Months" },
    { key: "1y", label: "1 Year" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="w-full flex flex-col gap-4" id="stats-dashboard-panel">
      {/* Metrics Bar */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        id="stats-metrics-grid"
      >
        <Container>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#71717a]">
            <span>Latest Statistic</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-[#fafafa] font-mono tracking-tight">
              {latestVal !== null ? latestVal : "—"}
            </span>
          </div>
        </Container>

        <Container>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#71717a]">
            <span>Range Average</span>
          </div>
          <span className="text-xl font-bold text-[#fafafa] font-mono tracking-tight mt-1">
            {filtered.length ? avgVal.toFixed(1) : "—"}
          </span>
        </Container>

        <Container>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#71717a]">
            <span>Highest (Max)</span>
          </div>
          <span className="text-xl font-bold text-[#fafafa] font-mono tracking-tight mt-1">
            {filtered.length ? maxVal : "—"}
          </span>
        </Container>

        <Container>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#71717a]">
            <span>Lowest (Min)</span>
          </div>
          <span className="text-xl font-bold text-[#fafafa] font-mono tracking-tight mt-1">
            {filtered.length ? minVal : "—"}
          </span>
        </Container>
      </div>

      <div
        className="relative bg-[#09090b] border border-[#27272a] rounded p-4 flex flex-col gap-4"
        id="main-chart-card"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717a] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Visual Trend Analysis
            </h3>
            <p className="text-[11px] text-[#52525b]">
              Tracking values over time based on entries
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <div
              className="flex bg-[#18181b] p-0.5 rounded border border-[#27272a] self-start sm:self-auto"
              id="chart-time-selectors"
            >
              {ranges.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setTimeRange(r.key)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-all ${
                    timeRange === r.key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-[#71717a] hover:text-[#fafafa]"
                  }`}
                  id={`time-btn-${r.key}`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {timeRange === "custom" && (
              <div
                className="flex flex-wrap items-center gap-2 mt-1 animate-fadeIn"
                id="custom-date-inputs"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#71717a]">
                    Start:
                  </span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-[#18181b] border border-[#27272a] text-[#fafafa] font-mono text-[10px] px-2 py-1 rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#71717a]">
                    End:
                  </span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-[#18181b] border border-[#27272a] text-[#fafafa] font-mono text-[10px] px-2 py-1 rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
                {(customStartDate || customEndDate) && (
                  <button
                    onClick={() => {
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                    className="text-[9px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 px-1 ml-1"
                    title="Clear Dates"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          ref={containerRef}
          className="w-full overflow-x-scroll sm:overflow-hidden select-none"
          id="svg-chart-container"
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-zinc-500">
              <Calendar className="w-8 h-8 mb-2 text-zinc-700" />
              <p className="text-xs">
                No data available for the selected time range.
              </p>
              <button
                onClick={() => setTimeRange("all")}
                className="mt-2 text-xs text-blue-500 hover:underline"
              >
                Reset range to All Time
              </button>
            </div>
          ) : (
            <>
              <svg
                width={dimensions.width}
                height={dimensions.height}
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                className="overflow-visible"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                id="timeseries-svg-chart"
              >
                <defs>
                  {/* Glowing Area Fill Gradient */}
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop
                      offset="100%"
                      stopColor="#3b82f6"
                      stopOpacity="0.00"
                    />
                  </linearGradient>
                  {/* Subtle Grid Pattern for Aesthetic Accent */}
                  <pattern
                    id="gridPattern"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="rgba(39, 39, 42, 0.15)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>

                {/* Decorative Pattern Background */}
                <rect
                  x={padding.left}
                  y={padding.top}
                  width={plotWidth}
                  height={plotHeight}
                  fill="url(#gridPattern)"
                />

                {/* Y-Axis Gridlines */}
                {yTicks.map((tick, i) => (
                  <g key={`y-grid-${i}`} className="opacity-40">
                    <line
                      x1={padding.left}
                      y1={tick.y}
                      x2={dimensions.width - padding.right}
                      y2={tick.y}
                      stroke="#27272a"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={padding.left - 12}
                      y={tick.y + 4}
                      fill="#71717a"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {tick.val}
                    </text>
                  </g>
                ))}

                {/* X-Axis Ticks & Gridlines */}
                {xTicks.map((tick, i) => (
                  <g key={`x-tick-${i}`} className="opacity-40">
                    <line
                      x1={tick.x}
                      y1={padding.top}
                      x2={tick.x}
                      y2={padding.top + plotHeight}
                      stroke="#27272a"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={tick.x}
                      y={padding.top + plotHeight + 18}
                      fill="#71717a"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {formatDateLabel(tick.dateStr)}
                    </text>
                  </g>
                ))}

                {/* Horizontal Zero-line if dataset crosses zero, or simple bottom border */}
                <line
                  x1={padding.left}
                  y1={padding.top + plotHeight}
                  x2={dimensions.width - padding.right}
                  y2={padding.top + plotHeight}
                  stroke="#27272a"
                  strokeWidth="1"
                />

                {/* Area Gradient Fill under the line */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill="url(#areaGradient)"
                    className="transition-all duration-500 ease-in-out"
                  />
                )}

                {/* Main Trend Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-500 ease-in-out filter drop-shadow-[0_1px_4px_rgba(59,130,246,0.2)]"
                  />
                )}

                {/* Vertical event reference lines */}
                {points
                  .filter((pt) => pt.entry.isEvent)
                  .map((pt, idx) => {
                    const isFuture = pt.entry.date > todayStr;
                    return (
                      <line
                        key={`event-line-${idx}`}
                        x1={pt.x}
                        y1={padding.top}
                        x2={pt.x}
                        y2={padding.top + plotHeight}
                        stroke={isFuture ? "#f59e0b" : "#10b981"}
                        strokeWidth="1"
                        strokeDasharray={isFuture ? "4,4" : "3,3"}
                        className="opacity-60"
                      />
                    );
                  })}

                {/* Data Points */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredIndex === idx;
                  const isChk = pt.entry.isCheckpoint;
                  const isEvt = pt.entry.isEvent;

                  if (isEvt) {
                    const isFuture = pt.entry.date > todayStr;
                    const eventColor = isFuture ? "#f59e0b" : "#10b981";
                    const eventBorderColor = isFuture ? "#d97706" : "#059669";
                    return (
                      <g key={`point-${idx}`}>
                        {/* Interactive hover padding element */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="14"
                          fill="transparent"
                          className="cursor-pointer"
                        />
                        {/* Halo/Ring for Event Checkpoints */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 12 : 8}
                          fill="none"
                          stroke={eventColor}
                          strokeWidth="1"
                          strokeDasharray="2,2"
                          className="opacity-70 animate-[pulse_2s_infinite]"
                        />
                        {isHovered && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="10"
                            fill="none"
                            stroke={eventColor}
                            strokeWidth="1.5"
                            className="opacity-40"
                          />
                        )}
                        {/* The physical visible point dot */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : 5}
                          fill={eventColor}
                          stroke={isHovered ? "#ffffff" : eventBorderColor}
                          strokeWidth={isHovered ? 2 : 1}
                          className="transition-all duration-150 ease-out cursor-pointer"
                        />
                      </g>
                    );
                  }

                  return (
                    <g key={`point-${idx}`}>
                      {/* Interactive hover padding element */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="14"
                        fill="transparent"
                        className="cursor-pointer"
                      />
                      {/* Halo/Ring for Checkpoints */}
                      {isChk && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 10 : 7}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                          className="opacity-70 animate-[pulse_2s_infinite]"
                        />
                      )}
                      {isHovered && !isChk && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="8"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="1.5"
                          className="opacity-40"
                        />
                      )}
                      {/* The physical visible point dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 5 : isChk ? 4 : 3}
                        fill={
                          isHovered ? "#3b82f6" : isChk ? "#3b82f6" : "#27272a"
                        }
                        stroke={
                          isHovered ? "#ffffff" : isChk ? "#3b82f6" : "#09090b"
                        }
                        strokeWidth={isHovered ? 2 : isChk ? 1.5 : 1}
                        className="transition-all duration-150 ease-out cursor-pointer"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Dynamic HTML Tooltip over SVG workspace */}
              {tooltipPos &&
                hoveredIndex !== null &&
                filtered[hoveredIndex] &&
                (() => {
                  const hoveredEntry = filtered[hoveredIndex];
                  const chkInfo = checkpointMapping[hoveredEntry.id];
                  return (
                    <div
                      className="absolute pointer-events-none p-2.5 rounded border border-[#27272a] bg-[#18181b] shadow-xl flex flex-col text-[10px] transition-all duration-75 ease-out transform -translate-x-1/2 -translate-y-3/4 z-50"
                      style={{
                        left: `${tooltipPos.x}px`,
                        top: `${tooltipPos.y}px`,
                      }}
                      id="chart-tooltip-bubble"
                    >
                      {hoveredEntry.isEvent ? (
                        <span
                          className={`font-bold font-sans text-[11px] mb-0.5 ${hoveredEntry.date > todayStr ? "text-amber-400" : "text-emerald-400"}`}
                        >
                          {hoveredEntry.date > todayStr
                            ? "PLANNED EVENT:"
                            : "EVENT:"}{" "}
                          {hoveredEntry.eventName || "Milestone Event"}
                        </span>
                      ) : (
                        <span className="font-bold text-[#fafafa] font-mono">
                          VAL: {hoveredEntry.value}
                        </span>
                      )}
                      <span className="text-[#71717a] font-mono whitespace-nowrap mt-0.5">
                        DATE: {formatDateLabel(hoveredEntry.date)}
                      </span>
                      {hoveredEntry.isCheckpoint && !hoveredEntry.isEvent && (
                        <span className="text-blue-400 font-bold font-mono text-[9px] mt-1.5 uppercase tracking-wider bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 text-center">
                          Checkpoint
                        </span>
                      )}

                      {(chkInfo?.checkpointText || chkInfo?.eventText) && (
                        <div className="flex flex-col gap-1 mt-1.5 border-t border-[#27272a]/60 pt-1.5 text-[8.5px] uppercase tracking-wider text-center">
                          {chkInfo.checkpointText && (
                            <span className="text-blue-400 font-mono">
                              {chkInfo.checkpointText}
                            </span>
                          )}
                          {chkInfo.eventText && (
                            <span className="text-emerald-400 font-mono">
                              {chkInfo.eventText}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
