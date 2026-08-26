import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LocationPoint } from '../types';

export const LOCATION_TRACKING_TASK = 'pacer-location-tracking';

// In-memory buffer that the background task writes to and the hook reads
// from. A module-level array (rather than React state) is required because
// TaskManager.defineTask runs outside the React tree, including while the
// app is backgrounded.
let pointBuffer: LocationPoint[] = [];
let isTaskTracking = false;

if (!TaskManager.isTaskDefined(LOCATION_TRACKING_TASK)) {
  TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }) => {
    if (error || !isTaskTracking) return;
    const { locations } = (data as { locations: Location.LocationObject[] }) ?? {
      locations: [],
    };
    for (const loc of locations) {
      pointBuffer.push({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude,
        timestamp: loc.timestamp,
        speed: loc.coords.speed,
      });
    }
  });
}

export type TrackingStatus = 'idle' | 'tracking' | 'paused';

export function useLocationTracking() {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [route, setRoute] = useState<LocationPoint[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mirror the background buffer into React state a few times a second so
  // the UI (map polyline, live stats) can re-render.
  useEffect(() => {
    if (status !== 'tracking') return;
    pollRef.current = setInterval(() => {
      setRoute([...pointBuffer]);
    }, 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status]);

  const requestPermissions = useCallback(async () => {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') {
      setPermissionError('Location permission is required to track an activity.');
      return false;
    }
    // Background permission lets tracking continue with the screen locked.
    // On iOS this must be requested after foreground permission is granted.
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') {
      // Not fatal — foreground-only tracking still works while the app is open.
      setPermissionError(
        'Background location was denied. Tracking will pause if you lock your phone.'
      );
    } else {
      setPermissionError(null);
    }
    return true;
  }, []);

  const start = useCallback(async () => {
    const ok = await requestPermissions();
    if (!ok) return;

    pointBuffer = [];
    setRoute([]);
    isTaskTracking = true;

    await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 5, // meters
      timeInterval: 3000, // ms — ignored on iOS, used on Android
      foregroundService: {
        notificationTitle: 'Pacer is tracking your activity',
        notificationBody: 'Recording your route in the background.',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });

    setStatus('tracking');
  }, [requestPermissions]);

  const pause = useCallback(() => {
    isTaskTracking = false;
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    isTaskTracking = true;
    setStatus('tracking');
  }, []);

  const stop = useCallback(async () => {
    isTaskTracking = false;
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
    }
    const finalRoute = [...pointBuffer];
    pointBuffer = [];
    setRoute([]);
    setStatus('idle');
    return finalRoute;
  }, []);

  return { status, route, permissionError, start, pause, resume, stop };
}
