import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useTransactions } from '../hooks/useTransactions';
import { useIdentity } from '../contexts/IdentityContext';
import { FaceClockTimer } from '../components/FaceClockTimer';
import { DigitalTimer } from '../components/DigitalTimer';
import {
  Play,
  Pause,
  Square,
  Clock,
  Timer,
  UserX,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Hourglass,
  StopCircle,
} from 'lucide-react';
import type { Child } from '../types';

type TimerMode = 'face' | 'digital';
type TimerState = 'idle' | 'running' | 'paused' | 'finished';
type UsageMode = 'timer' | 'stopwatch';

const LAST_TIMER_CHILD_KEY = 'ttt-last-timer-child';

export const UsagePage: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { addTransaction, getBalance } = useTransactions();
  const { identity } = useIdentity();

  // Selected child state
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [childInitialized, setChildInitialized] = useState(false);

  // Usage mode (timer vs stopwatch) — only relevant when no child selected
  const [usageMode, setUsageMode] = useState<UsageMode>('timer');

  // Timer configuration
  const [timerMode, setTimerMode] = useState<TimerMode>('face');
  const [customMinutes, setCustomMinutes] = useState<number | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedElapsed, setPausedElapsed] = useState(0);

  // Alarm state
  const [isFlashing, setIsFlashing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const flashIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Deduplicate children by ID (memoized so useEffect deps are stable)
  const children = useMemo(
    () => (settings?.children ?? []).filter(
      (child, index, arr) => arr.findIndex(c => c.id === child.id) === index
    ),
    [settings?.children],
  );

  // Restore last selected child from localStorage
  useEffect(() => {
    if (children.length === 0 || childInitialized) return;

    const lastId = localStorage.getItem(LAST_TIMER_CHILD_KEY);
    if (lastId) {
      const match = children.find(c => c.id === lastId);
      if (match) {
        setSelectedChild(match);
        setChildInitialized(true);
        return;
      }
    }

    // Fall back to alphabetically first child
    if (children.length > 0) {
      const sorted = [...children].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setSelectedChild(sorted[0]);
    }
    setChildInitialized(true);
  }, [children, childInitialized]);

  // Persist selected child to localStorage
  useEffect(() => {
    if (!childInitialized) return;
    if (selectedChild) {
      localStorage.setItem(LAST_TIMER_CHILD_KEY, selectedChild.id);
    } else {
      localStorage.removeItem(LAST_TIMER_CHILD_KEY);
    }
  }, [selectedChild, childInitialized]);

  // Get child's current balance
  const childBalance = selectedChild ? getBalance(selectedChild.id) : 0;

  // Whether we have a countdown target
  const hasCountdown = selectedChild
    ? true // child selected: always countdown from balance or custom
    : usageMode === 'timer' && customMinutes !== null && customMinutes > 0;

  // Calculate max time for countdown (in milliseconds)
  const maxTimeMs = hasCountdown
    ? (customMinutes !== null ? customMinutes : childBalance) * 60 * 1000
    : 0;

  // Calculate remaining time
  const remainingMs = Math.max(0, maxTimeMs - elapsedMs);

  // Round up to nearest 10 minutes for face clock scale
  const faceClockMaxMinutes = (() => {
    const minutes = customMinutes !== null ? customMinutes : childBalance;
    if (minutes <= 0) return 10;
    if (customMinutes !== null && customMinutes % 10 === 0) return customMinutes;
    return Math.ceil(minutes / 10) * 10;
  })();

  // Timer update effect — rAF for smooth visuals, setInterval as background fallback for alarm
  useEffect(() => {
    let animationFrame: number;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const checkElapsed = () => {
      if (timerState === 'running' && startTime !== null) {
        const newElapsed = pausedElapsed + (Date.now() - startTime);
        setElapsedMs(newElapsed);

        if (newElapsed >= maxTimeMs && maxTimeMs > 0) {
          setTimerState('finished');
          triggerAlarm();
          return true; // signal: timer finished
        }
      }
      return false;
    };

    const updateTimer = () => {
      if (!checkElapsed()) {
        animationFrame = requestAnimationFrame(updateTimer);
      }
    };

    if (timerState === 'running') {
      animationFrame = requestAnimationFrame(updateTimer);

      // Fallback: check every second even when tab is backgrounded (rAF pauses)
      if (maxTimeMs > 0) {
        intervalId = setInterval(() => {
          checkElapsed();
        }, 1000);
      }
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timerState, startTime, pausedElapsed, maxTimeMs, triggerAlarm]);

  // Cleanup flash interval on unmount
  useEffect(() => {
    return () => {
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
      }
    };
  }, []);

  // Trigger alarm (sound + vibration + flash)
  const triggerAlarm = useCallback(() => {
    setIsFlashing(true);
    flashIntervalRef.current = setInterval(() => {
      setIsFlashing(prev => !prev);
    }, 500);

    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
    }

    if (soundEnabled) {
      playAlarmSound();
    }
  }, [soundEnabled]);

  // Play alarm sound using Web Audio API
  const playAlarmSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      const playBeep = (startTime: number, frequency: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      };

      const now = ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        playBeep(now + i * 0.4, i % 2 === 0 ? 880 : 660);
      }
    } catch (e) {
      console.error('Error playing alarm sound:', e);
    }
  };

  // Stop alarm
  const stopAlarm = () => {
    setIsFlashing(false);
    if (flashIntervalRef.current) {
      clearInterval(flashIntervalRef.current);
      flashIntervalRef.current = null;
    }
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  };

  // Start timer
  const handleStart = () => {
    if (timerState === 'idle' || timerState === 'finished') {
      setElapsedMs(0);
      setPausedElapsed(0);
      setStartTime(Date.now());
      setTimerState('running');
      stopAlarm();
    } else if (timerState === 'paused') {
      setStartTime(Date.now());
      setTimerState('running');
    }
  };

  // Pause timer
  const handlePause = () => {
    if (timerState === 'running') {
      setPausedElapsed(elapsedMs);
      setStartTime(null);
      setTimerState('paused');
    }
  };

  // Stop timer and record transaction
  const handleStop = async () => {
    stopAlarm();

    if (elapsedMs > 0 && selectedChild && user) {
      const minutesUsed = Math.ceil(elapsedMs / 60000);

      if (minutesUsed > 0) {
        try {
          await addTransaction({
            childId: selectedChild.id,
            amount: -minutesUsed,
            reason: 'Tablet Time',
            category: 'Redemption',
            user: identity || 'Timer',
            userId: user.uid,
            unit: 'minutes',
          });
        } catch (error) {
          console.error('Error recording usage:', error);
        }
      }
    }

    // Reset timer
    setTimerState('idle');
    setElapsedMs(0);
    setPausedElapsed(0);
    setStartTime(null);
  };

  // Handle custom time input
  const handleCustomTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCustomInput(false);
  };

  // Reset custom time to use balance
  const handleUseBalance = () => {
    setCustomMinutes(null);
    setShowCustomInput(false);
  };

  // Whether start button should be disabled
  const startDisabled = selectedChild
    ? childBalance <= 0 && customMinutes === null
    : usageMode === 'timer' && (customMinutes === null || customMinutes <= 0);

  // Whether to show the remaining/countdown clock
  const showRemaining = maxTimeMs > 0;

  return (
    <div
      className={`min-h-screen pb-24 transition-colors duration-300 ${
        isFlashing
          ? 'bg-red-500 dark:bg-red-600'
          : 'bg-gray-50 dark:bg-gray-900'
      }`}
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Tablet Time
          </h1>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {soundEnabled ? (
              <Volume2 size={20} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <VolumeX size={20} className="text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Child Selector */}
        <div className="card">
          <button
            onClick={() => setShowChildSelector(!showChildSelector)}
            className="w-full flex items-center justify-between p-2"
          >
            <div className="flex items-center gap-3">
              {selectedChild ? (
                <>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: selectedChild.color || '#6366f1' }}
                  >
                    {selectedChild.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedChild.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Balance: {childBalance} min
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <UserX size={20} className="text-gray-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      No User Selected
                    </div>
                    <div className="text-sm text-gray-500">
                      {usageMode === 'timer' ? 'Timer mode' : 'Stopwatch mode'}
                    </div>
                  </div>
                </>
              )}
            </div>
            {showChildSelector ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {showChildSelector && (
            <div className="border-t dark:border-gray-700 pt-2 mt-2 space-y-1">
              {/* No user option */}
              <button
                onClick={() => {
                  setSelectedChild(null);
                  setShowChildSelector(false);
                }}
                className={`w-full flex items-center gap-3 p-2 rounded-lg ${
                  selectedChild === null
                    ? 'bg-primary-100 dark:bg-primary-900/30'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <UserX size={16} className="text-gray-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">No User (Timer Only)</span>
              </button>

              {/* Child options */}
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => {
                    setSelectedChild(child);
                    setCustomMinutes(null);
                    setShowChildSelector(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg ${
                    selectedChild?.id === child.id
                      ? 'bg-primary-100 dark:bg-primary-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: child.color || '#6366f1' }}
                  >
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{child.name}</span>
                  <span className="text-sm text-gray-500 ml-auto">
                    {getBalance(child.id)} min
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timer/Stopwatch toggle — only when no child selected */}
        {!selectedChild && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                setUsageMode('timer');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                usageMode === 'timer'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Hourglass size={18} />
              Timer
            </button>
            <button
              onClick={() => {
                setUsageMode('stopwatch');
                setCustomMinutes(null);
                setShowCustomInput(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                usageMode === 'stopwatch'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <StopCircle size={18} />
              Stopwatch
            </button>
          </div>
        )}

        {/* Time Configuration — shown for child (countdown from balance) or no-user timer mode */}
        {selectedChild ? (
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Countdown Time
              </span>
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-sm text-primary-600 dark:text-primary-400"
              >
                {showCustomInput ? 'Cancel' : 'Set Custom'}
              </button>
            </div>

            {showCustomInput ? (
              <form onSubmit={handleCustomTimeSubmit} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={customMinutes ?? ''}
                    onChange={(e) => setCustomMinutes(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Minutes"
                    min="1"
                    max={childBalance}
                    className="input-field flex-1"
                  />
                  <span className="text-gray-500">min</span>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary flex-1 py-2">
                    Set
                  </button>
                  <button
                    type="button"
                    onClick={handleUseBalance}
                    className="btn-secondary flex-1 py-2"
                  >
                    Use Balance
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {customMinutes !== null ? (
                  <span>{customMinutes} minutes</span>
                ) : (
                  <span>{childBalance} minutes (full balance)</span>
                )}
              </div>
            )}
          </div>
        ) : usageMode === 'timer' ? (
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Timer Duration
              </span>
            </div>

            {showCustomInput || customMinutes === null ? (
              <form onSubmit={(e) => { e.preventDefault(); setShowCustomInput(false); }} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={customMinutes ?? ''}
                    onChange={(e) => setCustomMinutes(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Minutes"
                    min="1"
                    className="input-field flex-1"
                  />
                  <span className="text-gray-500">min</span>
                </div>
                {customMinutes !== null && customMinutes > 0 && (
                  <button type="submit" className="btn-primary w-full py-2">
                    Set
                  </button>
                )}
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {customMinutes} minutes
                </div>
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="text-sm text-primary-600 dark:text-primary-400"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Display Mode Toggle (Face Clock / Digital) */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setTimerMode('face')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              timerMode === 'face'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Clock size={18} />
            Face Clock
          </button>
          <button
            onClick={() => setTimerMode('digital')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              timerMode === 'digital'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Timer size={18} />
            Digital
          </button>
        </div>

        {/* Timer Display */}
        <div className="card">
          {timerMode === 'face' ? (
            <div className="flex justify-around items-start py-4">
              <FaceClockTimer
                currentSeconds={Math.floor(elapsedMs / 1000)}
                maxSeconds={showRemaining ? faceClockMaxMinutes * 60 : Math.max(Math.floor(elapsedMs / 1000), 600)}
                label="Elapsed"
                color="#22c55e"
              />
              {showRemaining && (
                <FaceClockTimer
                  currentSeconds={Math.floor(remainingMs / 1000)}
                  maxSeconds={faceClockMaxMinutes * 60}
                  label="Remaining"
                  color={remainingMs < 60000 ? '#ef4444' : '#6366f1'}
                />
              )}
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <DigitalTimer
                milliseconds={elapsedMs}
                label="Elapsed"
                color="#22c55e"
              />
              {showRemaining && (
                <>
                  <div className="border-t dark:border-gray-700" />
                  <DigitalTimer
                    milliseconds={remainingMs}
                    label="Remaining"
                    color={remainingMs < 60000 ? '#ef4444' : '#6366f1'}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {timerState === 'idle' || timerState === 'finished' ? (
            <button
              onClick={handleStart}
              disabled={startDisabled}
              className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white flex items-center justify-center shadow-lg transition-colors"
            >
              <Play size={36} fill="white" />
            </button>
          ) : (
            <>
              {timerState === 'running' ? (
                <button
                  onClick={handlePause}
                  className="w-16 h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white flex items-center justify-center shadow-lg transition-colors"
                >
                  <Pause size={28} fill="white" />
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg transition-colors"
                >
                  <Play size={28} fill="white" />
                </button>
              )}
              <button
                onClick={handleStop}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors"
              >
                <Square size={28} fill="white" />
              </button>
            </>
          )}
        </div>

        {/* Status message */}
        {timerState === 'finished' && (
          <div className="text-center">
            <p className="text-xl font-bold text-red-600 dark:text-red-400 animate-pulse">
              Time's Up!
            </p>
            <button
              onClick={stopAlarm}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg"
            >
              Dismiss Alarm
            </button>
          </div>
        )}

        {timerState !== 'idle' && selectedChild && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {Math.ceil(elapsedMs / 60000)} minute(s) will be deducted when stopped
          </p>
        )}
      </div>
    </div>
  );
};
