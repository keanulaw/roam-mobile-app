export type LocationPoint = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: number; // ms since epoch
  speed: number | null; // m/s, from GPS if available
};

export type ActivityType = 'run' | 'ride' | 'walk';

export type ActivityStats = {
  distanceMeters: number;
  durationSeconds: number;
  averagePaceSecPerKm: number | null; // null if distance is ~0
  averageSpeedKmh: number;
  elevationGainMeters: number;
};

export type Activity = {
  id: string;
  userId: string;
  type: ActivityType;
  startedAt: string; // ISO timestamp
  endedAt: string; // ISO timestamp
  stats: ActivityStats;
  route: LocationPoint[];
  title?: string;
};

export type Profile = {
  id: string;
  displayName: string;
  createdAt: string;
};
