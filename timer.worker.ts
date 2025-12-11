/* eslint-disable no-restricted-globals */

// We define the message types for type safety
type TimerCommand = 'START' | 'PAUSE' | 'RESET';

interface WorkerMessage {
  type: TimerCommand;
  payload?: number; // duration in seconds for START
}

let timerId: number | null = null;
let endTime: number | null = null;
let remainingTime = 0;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'START':
      if (timerId) clearInterval(timerId);
      
      // We use a target end time rather than just decrementing a counter.
      // This prevents drift if the thread sleeps.
      remainingTime = payload || remainingTime;
      endTime = Date.now() + (remainingTime * 1000);

      timerId = self.setInterval(() => {
        if (!endTime) return;

        const now = Date.now();
        const timeLeft = Math.ceil((endTime - now) / 1000);

        if (timeLeft <= 0) {
          // Timer finished
          if (timerId) clearInterval(timerId);
          timerId = null;
          self.postMessage({ type: 'COMPLETE' });
        } else {
          // Tick
          self.postMessage({ type: 'TICK', payload: timeLeft });
        }
      }, 100); // Check every 100ms for responsiveness, but only emit on seconds
      break;

    case 'PAUSE':
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      // Calculate where we stopped so we can resume correctly
      if (endTime) {
        const now = Date.now();
        remainingTime = Math.ceil((endTime - now) / 1000);
      }
      break;

    case 'RESET':
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      remainingTime = 0;
      endTime = null;
      break;
  }
};

export {};
