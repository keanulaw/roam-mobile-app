import { ActivityStats, LocationPoint } from '../types';

const EARTH_RADIUS_METERS = 6371000;

/** Great-circle distance between two points, in meters. */
export function haversineDistance(a: LocationPoint, b: LocationPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Drop GPS noise: points that imply an unrealistic speed (e.g. a jump caused
 * by a bad fix) are excluded from distance accumulation.
 */
const MAX_PLAUSIBLE_SPEED_MS = 12; // ~43 km/h, generous ceiling for run/ride/walk

export function computeStats(route: LocationPoint[]): ActivityStats {
  if (route.length < 2) {
    return {
      distanceMeters: 0,
      durationSeconds: 0,
      averagePaceSecPerKm: null,
      averageSpeedKmh: 0,
      elevationGainMeters: 0,
    };
  }

  let distanceMeters = 0;
  let elevationGainMeters = 0;

  for (let i = 1; i < route.length; i++) {
    const prev = route[i - 1];
    const curr = route[i];

    const segmentDistance = haversineDistance(prev, curr);
    const segmentSeconds = (curr.timestamp - prev.timestamp) / 1000;
    const impliedSpeed = segmentSeconds > 0 ? segmentDistance / segmentSeconds : 0;

    if (impliedSpeed <= MAX_PLAUSIBLE_SPEED_MS) {
      distanceMeters += segmentDistance;
    }

    if (prev.altitude != null && curr.altitude != null) {
      const gain = curr.altitude - prev.altitude;
      if (gain > 0) elevationGainMeters += gain;
    }
  }

  const durationSeconds = (route[route.length - 1].timestamp - route[0].timestamp) / 1000;
  const distanceKm = distanceMeters / 1000;

  const averageSpeedKmh = durationSeconds > 0 ? distanceKm / (durationSeconds / 3600) : 0;
  const averagePaceSecPerKm = distanceKm > 0.01 ? durationSeconds / distanceKm : null;

  return {
    distanceMeters,
    durationSeconds,
    averagePaceSecPerKm,
    averageSpeedKmh,
    elevationGainMeters,
  };
}

/** Format seconds/km as "M:SS /km", or "--" if unavailable. */
export function formatPace(secPerKm: number | null): string {
  if (secPerKm == null || !Number.isFinite(secPerKm)) return '--';
  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.round(secPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

/** Format seconds as "H:MM:SS" or "M:SS". */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
}
