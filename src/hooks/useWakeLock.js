'use client';

import { useEffect } from 'react';

export function useWakeLock() {
  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      try {
        if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Screen Wake Lock is active');
        }
      } catch (err) {
        console.error(`Wake Lock error: ${err.name}, ${err.message}`);
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    // Request on mount
    requestWakeLock();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock !== null) {
        wakeLock.release().then(() => {
          wakeLock = null;
          console.log('Screen Wake Lock released');
        });
      }
    };
  }, []);
}

export default useWakeLock;
