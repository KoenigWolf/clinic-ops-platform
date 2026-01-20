"use client";

import { useMemo } from "react";

interface AudiogramData {
  // 右耳気導
  rightAir125?: number | null;
  rightAir250?: number | null;
  rightAir500?: number | null;
  rightAir1000?: number | null;
  rightAir2000?: number | null;
  rightAir4000?: number | null;
  rightAir8000?: number | null;
  // 左耳気導
  leftAir125?: number | null;
  leftAir250?: number | null;
  leftAir500?: number | null;
  leftAir1000?: number | null;
  leftAir2000?: number | null;
  leftAir4000?: number | null;
  leftAir8000?: number | null;
  // 右耳骨導
  rightBone250?: number | null;
  rightBone500?: number | null;
  rightBone1000?: number | null;
  rightBone2000?: number | null;
  rightBone4000?: number | null;
  // 左耳骨導
  leftBone250?: number | null;
  leftBone500?: number | null;
  leftBone1000?: number | null;
  leftBone2000?: number | null;
  leftBone4000?: number | null;
}

interface AudiogramChartProps {
  data: AudiogramData;
  width?: number;
  height?: number;
}

const FREQUENCIES = [125, 250, 500, 1000, 2000, 4000, 8000];
const DB_LEVELS = [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];

export function AudiogramChart({ data, width = 500, height = 400 }: AudiogramChartProps) {
  const padding = { top: 40, right: 40, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xScale = useMemo(() => {
    const logMin = Math.log10(125);
    const logMax = Math.log10(8000);
    return (freq: number) => {
      const logFreq = Math.log10(freq);
      return padding.left + ((logFreq - logMin) / (logMax - logMin)) * chartWidth;
    };
  }, [chartWidth, padding.left]);

  const yScale = useMemo(() => {
    return (db: number) => {
      return padding.top + ((db + 10) / 130) * chartHeight;
    };
  }, [chartHeight, padding.top]);

  const rightAirPoints = useMemo(() => {
    const points: { x: number; y: number; freq: number; db: number }[] = [];
    const values = [
      { freq: 125, db: data.rightAir125 },
      { freq: 250, db: data.rightAir250 },
      { freq: 500, db: data.rightAir500 },
      { freq: 1000, db: data.rightAir1000 },
      { freq: 2000, db: data.rightAir2000 },
      { freq: 4000, db: data.rightAir4000 },
      { freq: 8000, db: data.rightAir8000 },
    ];
    values.forEach(({ freq, db }) => {
      if (db !== null && db !== undefined) {
        points.push({ x: xScale(freq), y: yScale(db), freq, db });
      }
    });
    return points;
  }, [data, xScale, yScale]);

  const leftAirPoints = useMemo(() => {
    const points: { x: number; y: number; freq: number; db: number }[] = [];
    const values = [
      { freq: 125, db: data.leftAir125 },
      { freq: 250, db: data.leftAir250 },
      { freq: 500, db: data.leftAir500 },
      { freq: 1000, db: data.leftAir1000 },
      { freq: 2000, db: data.leftAir2000 },
      { freq: 4000, db: data.leftAir4000 },
      { freq: 8000, db: data.leftAir8000 },
    ];
    values.forEach(({ freq, db }) => {
      if (db !== null && db !== undefined) {
        points.push({ x: xScale(freq), y: yScale(db), freq, db });
      }
    });
    return points;
  }, [data, xScale, yScale]);

  const rightBonePoints = useMemo(() => {
    const points: { x: number; y: number; freq: number; db: number }[] = [];
    const values = [
      { freq: 250, db: data.rightBone250 },
      { freq: 500, db: data.rightBone500 },
      { freq: 1000, db: data.rightBone1000 },
      { freq: 2000, db: data.rightBone2000 },
      { freq: 4000, db: data.rightBone4000 },
    ];
    values.forEach(({ freq, db }) => {
      if (db !== null && db !== undefined) {
        points.push({ x: xScale(freq), y: yScale(db), freq, db });
      }
    });
    return points;
  }, [data, xScale, yScale]);

  const leftBonePoints = useMemo(() => {
    const points: { x: number; y: number; freq: number; db: number }[] = [];
    const values = [
      { freq: 250, db: data.leftBone250 },
      { freq: 500, db: data.leftBone500 },
      { freq: 1000, db: data.leftBone1000 },
      { freq: 2000, db: data.leftBone2000 },
      { freq: 4000, db: data.leftBone4000 },
    ];
    values.forEach(({ freq, db }) => {
      if (db !== null && db !== undefined) {
        points.push({ x: xScale(freq), y: yScale(db), freq, db });
      }
    });
    return points;
  }, [data, xScale, yScale]);

  const createPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <svg width={width} height={height} className="font-sans">
        {/* Background */}
        <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} fill="#fafafa" stroke="#e5e5e5" />

        {/* Grid lines - horizontal (dB) */}
        {DB_LEVELS.map((db) => (
          <g key={db}>
            <line
              x1={padding.left}
              y1={yScale(db)}
              x2={padding.left + chartWidth}
              y2={yScale(db)}
              stroke={db === 25 ? "#94a3b8" : "#e5e5e5"}
              strokeWidth={db === 25 ? 2 : 1}
              strokeDasharray={db === 25 ? "4,2" : undefined}
            />
            <text
              x={padding.left - 8}
              y={yScale(db)}
              textAnchor="end"
              alignmentBaseline="middle"
              fontSize={10}
              fill="#666"
            >
              {db}
            </text>
          </g>
        ))}

        {/* Grid lines - vertical (frequency) */}
        {FREQUENCIES.map((freq) => (
          <g key={freq}>
            <line
              x1={xScale(freq)}
              y1={padding.top}
              x2={xScale(freq)}
              y2={padding.top + chartHeight}
              stroke="#e5e5e5"
            />
            <text
              x={xScale(freq)}
              y={padding.top + chartHeight + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#666"
            >
              {freq >= 1000 ? `${freq / 1000}k` : freq}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text
          x={padding.left + chartWidth / 2}
          y={height - 8}
          textAnchor="middle"
          fontSize={12}
          fill="#333"
        >
          周波数 (Hz)
        </text>
        <text
          x={12}
          y={padding.top + chartHeight / 2}
          textAnchor="middle"
          fontSize={12}
          fill="#333"
          transform={`rotate(-90, 12, ${padding.top + chartHeight / 2})`}
        >
          聴力レベル (dB HL)
        </text>

        {/* Normal hearing zone */}
        <rect
          x={padding.left}
          y={yScale(-10)}
          width={chartWidth}
          height={yScale(25) - yScale(-10)}
          fill="#22c55e"
          opacity={0.1}
        />

        {/* Right ear air conduction - Red circles with line */}
        {rightAirPoints.length > 0 && (
          <>
            <path d={createPath(rightAirPoints)} fill="none" stroke="#ef4444" strokeWidth={2} />
            {rightAirPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={6} fill="white" stroke="#ef4444" strokeWidth={2} />
            ))}
          </>
        )}

        {/* Left ear air conduction - Blue X with line */}
        {leftAirPoints.length > 0 && (
          <>
            <path d={createPath(leftAirPoints)} fill="none" stroke="#3b82f6" strokeWidth={2} />
            {leftAirPoints.map((p, i) => (
              <g key={i}>
                <line x1={p.x - 5} y1={p.y - 5} x2={p.x + 5} y2={p.y + 5} stroke="#3b82f6" strokeWidth={2} />
                <line x1={p.x + 5} y1={p.y - 5} x2={p.x - 5} y2={p.y + 5} stroke="#3b82f6" strokeWidth={2} />
              </g>
            ))}
          </>
        )}

        {/* Right ear bone conduction - Red brackets */}
        {rightBonePoints.length > 0 && (
          <>
            <path d={createPath(rightBonePoints)} fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4,2" />
            {rightBonePoints.map((p, i) => (
              <g key={i}>
                <path d={`M ${p.x + 6} ${p.y - 4} L ${p.x} ${p.y - 4} L ${p.x} ${p.y + 4} L ${p.x + 6} ${p.y + 4}`} fill="none" stroke="#ef4444" strokeWidth={2} />
              </g>
            ))}
          </>
        )}

        {/* Left ear bone conduction - Blue brackets */}
        {leftBonePoints.length > 0 && (
          <>
            <path d={createPath(leftBonePoints)} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4,2" />
            {leftBonePoints.map((p, i) => (
              <g key={i}>
                <path d={`M ${p.x - 6} ${p.y - 4} L ${p.x} ${p.y - 4} L ${p.x} ${p.y + 4} L ${p.x - 6} ${p.y + 4}`} fill="none" stroke="#3b82f6" strokeWidth={2} />
              </g>
            ))}
          </>
        )}

        {/* Legend */}
        <g transform={`translate(${padding.left + 10}, ${padding.top + 10})`}>
          <rect x={0} y={0} width={140} height={80} fill="white" stroke="#e5e5e5" rx={4} />

          {/* Right air */}
          <circle cx={16} cy={16} r={5} fill="white" stroke="#ef4444" strokeWidth={2} />
          <text x={30} y={20} fontSize={10} fill="#333">右耳（気導）</text>

          {/* Left air */}
          <g transform="translate(16, 36)">
            <line x1={-4} y1={-4} x2={4} y2={4} stroke="#3b82f6" strokeWidth={2} />
            <line x1={4} y1={-4} x2={-4} y2={4} stroke="#3b82f6" strokeWidth={2} />
          </g>
          <text x={30} y={40} fontSize={10} fill="#333">左耳（気導）</text>

          {/* Bone conduction note */}
          <line x1={10} y1={56} x2={22} y2={56} stroke="#666" strokeWidth={1.5} strokeDasharray="4,2" />
          <text x={30} y={60} fontSize={10} fill="#333">骨導</text>
        </g>
      </svg>
    </div>
  );
}

// 聴力レベルの評価
export function getHearingLevel(avgDb: number): { level: string; color: string } {
  if (avgDb <= 25) return { level: "正常", color: "text-green-600" };
  if (avgDb <= 40) return { level: "軽度難聴", color: "text-yellow-600" };
  if (avgDb <= 55) return { level: "中等度難聴", color: "text-orange-600" };
  if (avgDb <= 70) return { level: "準重度難聴", color: "text-red-500" };
  if (avgDb <= 90) return { level: "重度難聴", color: "text-red-600" };
  return { level: "最重度難聴", color: "text-red-700" };
}

// 4分法平均を計算
export function calculateFourFrequencyAverage(
  db500?: number | null,
  db1000?: number | null,
  db2000?: number | null,
  db4000?: number | null
): number | null {
  const values = [db500, db1000, db2000, db4000].filter((v): v is number => v !== null && v !== undefined);
  if (values.length < 4) return null;
  // (500 + 1000×2 + 2000) / 4 (日本式)
  return ((db500! + db1000! * 2 + db2000!) / 4);
}
