import { useMemo } from 'react';
import type { FC } from 'react';

interface FaceClockTimerProps {
  currentSeconds: number;
  maxSeconds: number;
  label: string;
  color: string;
}

export const FaceClockTimer: FC<FaceClockTimerProps> = ({
  currentSeconds,
  maxSeconds,
  label,
  color,
}) => {
  // Calculate the angle for the hand (0 degrees = 12 o'clock position)
  const handAngle = useMemo(() => {
    if (maxSeconds === 0) return 0;
    const progress = currentSeconds / maxSeconds;
    // Full rotation is 360 degrees, starting from top (12 o'clock)
    return progress * 360;
  }, [currentSeconds, maxSeconds]);

  // Generate tick marks for the clock face
  const tickMarks = useMemo(() => {
    const marks = [];
    const maxMinutes = Math.ceil(maxSeconds / 60);

    // Determine interval based on max time
    let interval = 5; // Default 5 minute intervals
    if (maxMinutes <= 10) interval = 1;
    else if (maxMinutes <= 30) interval = 5;
    else if (maxMinutes <= 60) interval = 10;
    else interval = 15;

    const numMarks = Math.ceil(maxMinutes / interval);

    for (let i = 0; i <= numMarks; i++) {
      const minutes = i * interval;
      if (minutes > maxMinutes) break;

      const angle = (minutes / maxMinutes) * 360 - 90; // -90 to start from top
      const radians = (angle * Math.PI) / 180;

      // Position for tick marks (on the edge)
      const outerRadius = 45;
      const innerRadius = 40;
      const labelRadius = 33;

      const x1 = 50 + outerRadius * Math.cos(radians);
      const y1 = 50 + outerRadius * Math.sin(radians);
      const x2 = 50 + innerRadius * Math.cos(radians);
      const y2 = 50 + innerRadius * Math.sin(radians);
      const labelX = 50 + labelRadius * Math.cos(radians);
      const labelY = 50 + labelRadius * Math.sin(radians);

      marks.push({
        x1, y1, x2, y2,
        labelX, labelY,
        label: minutes.toString(),
        isMajor: minutes % (interval * 2) === 0 || i === 0,
      });
    }

    return marks;
  }, [maxSeconds]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {label}
      </div>

      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Clock face background */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-200 dark:text-gray-700"
          />

          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(maxSeconds === 0 ? 0 : (currentSeconds / maxSeconds)) * 276.46} 276.46`}
            transform="rotate(-90 50 50)"
            className="transition-all duration-100"
            style={{ opacity: 0.3 }}
          />

          {/* Tick marks */}
          {tickMarks.map((mark, i) => (
            <g key={i}>
              <line
                x1={mark.x1}
                y1={mark.y1}
                x2={mark.x2}
                y2={mark.y2}
                stroke="currentColor"
                strokeWidth={mark.isMajor ? 2 : 1}
                className="text-gray-400 dark:text-gray-500"
              />
              {mark.isMajor && (
                <text
                  x={mark.labelX}
                  y={mark.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="6"
                  className="fill-gray-500 dark:fill-gray-400"
                >
                  {mark.label}
                </text>
              )}
            </g>
          ))}

          {/* Center dot */}
          <circle
            cx="50"
            cy="50"
            r="3"
            fill={color}
          />

          {/* Clock hand */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="12"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${handAngle} 50 50)`}
            className="transition-transform duration-100"
          />
        </svg>
      </div>

      {/* Digital readout below clock */}
      <div className="mt-2 text-2xl font-mono font-bold" style={{ color }}>
        {formatTime(currentSeconds)}
      </div>
    </div>
  );
};
