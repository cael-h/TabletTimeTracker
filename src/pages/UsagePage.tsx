import { useState, useEffect, useRef, useCallback } from 'react';
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
  User,
  UserX,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { Child } from '../types';

type TimerMode = 'face' | 'digital';
type TimerState = 'idle' | 'running' | 'paused' | 'finished';

export const UsagePage: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { addTransaction, getBalance } = useTransactions();
  const { identity } = useIdentity();

  // Selected child state
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);

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
  const flashIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get child's current balance
  const childBalance = selectedChild ? getBalance(selectedChild.id) : 0;

  // Calculate max time for countdown (in milliseconds)
  const maxTimeMs = customMinutes !== null
    ? customMinutes * 60 * 1000
    : childBalance * 60 * 1000;

  // Calculate remaining time
  const remainingMs = Math.max(0, maxTimeMs - elapsedMs);

  // Round up to nearest 10 minutes for face clock scale
  const faceClockMaxMinutes = (() => {
    const minutes = customMinutes !== null ? customMinutes : childBalance;
    if (minutes <= 0) return 10;
    // If custom time is exact multiple of 10, use it directly
    if (customMinutes !== null && customMinutes % 10 === 0) return customMinutes;
    return Math.ceil(minutes / 10) * 10;
  })();

  // Timer update effect
  useEffect(() => {
    let animationFrame: number;

    const updateTimer = () => {
      if (timerState === 'running' && startTime !== null) {
        const now = Date.now();
        const newElapsed = pausedElapsed + (now - startTime);
        setElapsedMs(newElapsed);

        // Check if time's up
        if (newElapsed >= maxTimeMs && maxTimeMs > 0) {
          setTimerState('finished');
          triggerAlarm();
        } else {
          animationFrame = requestAnimationFrame(updateTimer);
        }
      }
    };

    if (timerState === 'running') {
      animationFrame = requestAnimationFrame(updateTimer);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [timerState, startTime, pausedElapsed, maxTimeMs]);

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
    // Start flashing
    setIsFlashing(true);
    flashIntervalRef.current = setInterval(() => {
      setIsFlashing(prev => !prev);
    }, 500);

    // Vibration
    if (navigator.vibrate) {
      // Vibrate pattern: vibrate 500ms, pause 200ms, repeat
      navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
    }

    // Sound
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

      // Play a sequence of beeps
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
      // Play alternating high-low beeps
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
      navigator.vibrate(0); // Stop vibration
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
      // Calculate minutes actually used (round up to nearest minute)
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
                      Timer only mode
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
              {settings?.children.map(child => (
                <button
                  key={child.id}
                  onClick={() => {
                    setSelectedChild(child);
                    setCustomMinutes(null); // Reset to use balance
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

        {/* Time Configuration */}
        {selectedChild && (
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
        )}

        {/* Timer Mode Toggle */}
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
            /* Face Clock Timers - Side by Side */
            <div className="flex justify-around items-start py-4">
              <FaceClockTimer
                currentSeconds={Math.floor(elapsedMs / 1000)}
                maxSeconds={faceClockMaxMinutes * 60}
                label="Elapsed"
                color="#22c55e"
              />
              {(selectedChild || customMinutes !== null) && maxTimeMs > 0 && (
                <FaceClockTimer
                  currentSeconds={Math.floor(remainingMs / 1000)}
                  maxSeconds={faceClockMaxMinutes * 60}
                  label="Remaining"
                  color={remainingMs < 60000 ? '#ef4444' : '#6366f1'}
                  isCountingDown
                />
              )}
            </div>
          ) : (
            /* Digital Timers - Stacked */
            <div className="py-4 space-y-4">
              <DigitalTimer
                milliseconds={elapsedMs}
                label="Elapsed"
                color="#22c55e"
              />
              {(selectedChild || customMinutes !== null) && maxTimeMs > 0 && (
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
              disabled={selectedChild !== null && childBalance <= 0 && customMinutes === null}
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
