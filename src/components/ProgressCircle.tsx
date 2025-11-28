import React from 'react';

interface ProgressCircleProps {
  current: number;
  target: number;
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  current,
  target,
  label,
  sublabel,
  size = 120,
  strokeWidth = 8,
  color = 'hsl(var(--primary))'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((current / target) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{current}</span>
          <span className="text-xs text-muted-foreground">/ {target}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground">{label}</p>
        {sublabel && <p className="text-sm text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
  );
};
