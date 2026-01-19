"use client";

import { useMemo } from "react";
import { calculateFourFrequencyAverage, getHearingLevel } from "./audiogram-chart";

interface AudiometryTest {
  id: string;
  testDate: Date | string;
  rightAir500?: number | null;
  rightAir1000?: number | null;
  rightAir2000?: number | null;
  rightAir4000?: number | null;
  leftAir500?: number | null;
  leftAir1000?: number | null;
  leftAir2000?: number | null;
  leftAir4000?: number | null;
}

interface HearingProgressChartProps {
  tests: AudiometryTest[];
  width?: number;
  height?: number;
}

export function HearingProgressChart({
  tests,
  width = 600,
  height = 300,
}: HearingProgressChartProps) {
  const padding = { top: 30, right: 60, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Sort tests by date and calculate averages
  const dataPoints = useMemo(() => {
    return tests
      .map((test) => {
        const rightAvg = calculateFourFrequencyAverage(
          test.rightAir500,
          test.rightAir1000,
          test.rightAir2000,
          test.rightAir4000
        );
        const leftAvg = calculateFourFrequencyAverage(
          test.leftAir500,
          test.leftAir1000,
          test.leftAir2000,
          test.leftAir4000
        );
        return {
          date: new Date(test.testDate),
          rightAvg,
          leftAvg,
        };
      })
      .filter((d) => d.rightAvg !== null || d.leftAvg !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [tests]);

  if (dataPoints.length < 2) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
        <p>経過グラフを表示するには、2回以上の聴力検査データが必要です</p>
        <p className="text-sm mt-2">現在: {dataPoints.length}回</p>
      </div>
    );
  }

  // Calculate scales
  const dateExtent = [dataPoints[0].date, dataPoints[dataPoints.length - 1].date];
  const dateRange = dateExtent[1].getTime() - dateExtent[0].getTime();

  const xScale = (date: Date) => {
    const ratio = (date.getTime() - dateExtent[0].getTime()) / dateRange;
    return padding.left + ratio * chartWidth;
  };

  // dB scale (inverted: 0 at top, 120 at bottom)
  const yScale = (db: number) => {
    return padding.top + (db / 120) * chartHeight;
  };

  // Create paths
  const createPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  };

  const rightPoints = dataPoints
    .filter((d) => d.rightAvg !== null)
    .map((d) => ({ x: xScale(d.date), y: yScale(d.rightAvg!), date: d.date, db: d.rightAvg! }));

  const leftPoints = dataPoints
    .filter((d) => d.leftAvg !== null)
    .map((d) => ({ x: xScale(d.date), y: yScale(d.leftAvg!), date: d.date, db: d.leftAvg! }));

  // Generate Y-axis ticks
  const yTicks = [0, 20, 40, 60, 80, 100, 120];

  // Generate X-axis ticks (dates)
  const xTicks = dataPoints.map((d) => ({
    date: d.date,
    x: xScale(d.date),
  }));

  // Hearing level zones
  const zones = [
    { min: 0, max: 25, label: "正常", color: "#22c55e" },
    { min: 25, max: 40, label: "軽度", color: "#eab308" },
    { min: 40, max: 55, label: "中等度", color: "#f97316" },
    { min: 55, max: 70, label: "準重度", color: "#ef4444" },
    { min: 70, max: 90, label: "重度", color: "#dc2626" },
    { min: 90, max: 120, label: "最重度", color: "#7f1d1d" },
  ];

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold mb-4">聴力経過グラフ (4分法平均)</h3>
      <svg width={width} height={height} className="font-sans">
        {/* Background zones */}
        {zones.map((zone) => (
          <rect
            key={zone.label}
            x={padding.left}
            y={yScale(zone.min)}
            width={chartWidth}
            height={yScale(zone.max) - yScale(zone.min)}
            fill={zone.color}
            opacity={0.1}
          />
        ))}

        {/* Grid lines */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={yScale(tick)}
              x2={padding.left + chartWidth}
              y2={yScale(tick)}
              stroke="#e5e5e5"
              strokeDasharray={tick === 25 ? "4,2" : undefined}
            />
            <text
              x={padding.left - 8}
              y={yScale(tick)}
              textAnchor="end"
              alignmentBaseline="middle"
              fontSize={10}
              fill="#666"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* X-axis ticks */}
        {xTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={tick.x}
              y1={padding.top}
              x2={tick.x}
              y2={padding.top + chartHeight}
              stroke="#e5e5e5"
            />
            <text
              x={tick.x}
              y={padding.top + chartHeight + 20}
              textAnchor="middle"
              fontSize={9}
              fill="#666"
            >
              {tick.date.toLocaleDateString("ja-JP", {
                year: "2-digit",
                month: "short",
              })}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize={11}
          fill="#333"
        >
          検査日
        </text>
        <text
          x={15}
          y={padding.top + chartHeight / 2}
          textAnchor="middle"
          fontSize={11}
          fill="#333"
          transform={`rotate(-90, 15, ${padding.top + chartHeight / 2})`}
        >
          4分法平均 (dB)
        </text>

        {/* Right ear line */}
        {rightPoints.length > 1 && (
          <>
            <path
              d={createPath(rightPoints)}
              fill="none"
              stroke="#ef4444"
              strokeWidth={2}
            />
            {rightPoints.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={5} fill="white" stroke="#ef4444" strokeWidth={2} />
                <title>
                  {p.date.toLocaleDateString("ja-JP")} - 右: {p.db.toFixed(1)}dB
                </title>
              </g>
            ))}
          </>
        )}

        {/* Left ear line */}
        {leftPoints.length > 1 && (
          <>
            <path
              d={createPath(leftPoints)}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
            />
            {leftPoints.map((p, i) => (
              <g key={i}>
                <line x1={p.x - 4} y1={p.y - 4} x2={p.x + 4} y2={p.y + 4} stroke="#3b82f6" strokeWidth={2} />
                <line x1={p.x + 4} y1={p.y - 4} x2={p.x - 4} y2={p.y + 4} stroke="#3b82f6" strokeWidth={2} />
                <title>
                  {p.date.toLocaleDateString("ja-JP")} - 左: {p.db.toFixed(1)}dB
                </title>
              </g>
            ))}
          </>
        )}

        {/* Legend */}
        <g transform={`translate(${padding.left + chartWidth - 100}, ${padding.top + 5})`}>
          <rect x={0} y={0} width={100} height={50} fill="white" stroke="#e5e5e5" rx={4} />
          <circle cx={15} cy={18} r={4} fill="white" stroke="#ef4444" strokeWidth={2} />
          <text x={25} y={22} fontSize={10} fill="#333">右耳</text>
          <g transform="translate(15, 38)">
            <line x1={-3} y1={-3} x2={3} y2={3} stroke="#3b82f6" strokeWidth={2} />
            <line x1={3} y1={-3} x2={-3} y2={3} stroke="#3b82f6" strokeWidth={2} />
          </g>
          <text x={25} y={42} fontSize={10} fill="#333">左耳</text>
        </g>

        {/* Zone labels */}
        <g transform={`translate(${padding.left + chartWidth + 5}, 0)`}>
          {zones.slice(0, 4).map((zone) => (
            <text
              key={zone.label}
              x={0}
              y={yScale((zone.min + zone.max) / 2)}
              fontSize={8}
              fill={zone.color}
              alignmentBaseline="middle"
            >
              {zone.label}
            </text>
          ))}
        </g>
      </svg>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-red-50 rounded-lg">
          <h4 className="font-semibold text-red-700">右耳の変化</h4>
          {rightPoints.length >= 2 && (
            <div className="mt-1">
              <p>
                初回: {rightPoints[0].db.toFixed(1)}dB (
                {getHearingLevel(rightPoints[0].db).level})
              </p>
              <p>
                最新: {rightPoints[rightPoints.length - 1].db.toFixed(1)}dB (
                {getHearingLevel(rightPoints[rightPoints.length - 1].db).level})
              </p>
              <p className={
                rightPoints[rightPoints.length - 1].db > rightPoints[0].db
                  ? "text-red-600"
                  : "text-green-600"
              }>
                変化: {(rightPoints[rightPoints.length - 1].db - rightPoints[0].db).toFixed(1)}dB
                {rightPoints[rightPoints.length - 1].db > rightPoints[0].db ? " (悪化)" : " (改善)"}
              </p>
            </div>
          )}
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-700">左耳の変化</h4>
          {leftPoints.length >= 2 && (
            <div className="mt-1">
              <p>
                初回: {leftPoints[0].db.toFixed(1)}dB (
                {getHearingLevel(leftPoints[0].db).level})
              </p>
              <p>
                最新: {leftPoints[leftPoints.length - 1].db.toFixed(1)}dB (
                {getHearingLevel(leftPoints[leftPoints.length - 1].db).level})
              </p>
              <p className={
                leftPoints[leftPoints.length - 1].db > leftPoints[0].db
                  ? "text-red-600"
                  : "text-green-600"
              }>
                変化: {(leftPoints[leftPoints.length - 1].db - leftPoints[0].db).toFixed(1)}dB
                {leftPoints[leftPoints.length - 1].db > leftPoints[0].db ? " (悪化)" : " (改善)"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
