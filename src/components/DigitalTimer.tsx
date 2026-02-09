interface DigitalTimerProps {
  milliseconds: number;
  label: string;
  color: string;
  showHundredths?: boolean;
}

export const DigitalTimer: React.FC<DigitalTimerProps> = ({
  milliseconds,
  label,
  color,
  showHundredths = true,
}) => {
  // Calculate time components
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((milliseconds % 1000) / 10);

  // Format with leading zeros
  const pad2 = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center py-3">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {label}
      </div>

      <div
        className="font-mono text-4xl font-bold tracking-wider flex items-baseline"
        style={{ color }}
      >
        {/* Hours */}
        <span className="w-14 text-right">{pad2(hours)}</span>
        <span className="mx-1 text-gray-400">:</span>

        {/* Minutes */}
        <span className="w-14 text-center">{pad2(minutes)}</span>
        <span className="mx-1 text-gray-400">:</span>

        {/* Seconds */}
        <span className="w-14 text-center">{pad2(seconds)}</span>

        {/* Hundredths */}
        {showHundredths && (
          <>
            <span className="mx-1 text-gray-400">.</span>
            <span className="w-10 text-left text-2xl">{pad2(hundredths)}</span>
          </>
        )}
      </div>

      {/* Labels below */}
      <div className="flex text-xs text-gray-400 mt-1" style={{ marginLeft: showHundredths ? '0' : '0' }}>
        <span className="w-14 text-right">hrs</span>
        <span className="mx-1">&nbsp;</span>
        <span className="w-14 text-center">min</span>
        <span className="mx-1">&nbsp;</span>
        <span className="w-14 text-center">sec</span>
        {showHundredths && (
          <>
            <span className="mx-1">&nbsp;</span>
            <span className="w-10 text-left"></span>
          </>
        )}
      </div>
    </div>
  );
};
