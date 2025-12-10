export enum TimerMode {
  FOCUS = 'FOCUS',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK',
  CUSTOM = 'CUSTOM'
}

export type RoastType = 'light' | 'medium' | 'dark';

export interface TimerConfig {
  mode: TimerMode;
  duration: number; // in seconds
  label: string;
}

export const MODES: Record<TimerMode, TimerConfig> = {
  [TimerMode.FOCUS]: { mode: TimerMode.FOCUS, duration: 25 * 60, label: 'Focus Brew' },
  [TimerMode.SHORT_BREAK]: { mode: TimerMode.SHORT_BREAK, duration: 5 * 60, label: 'Sip Break' },
  [TimerMode.LONG_BREAK]: { mode: TimerMode.LONG_BREAK, duration: 15 * 60, label: 'Refill Break' },
  [TimerMode.CUSTOM]: { mode: TimerMode.CUSTOM, duration: 20 * 60, label: 'Custom' },
};