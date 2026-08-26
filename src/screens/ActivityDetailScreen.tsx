import { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { supabase } from '../lib/supabase';
import { Activity } from '../types';
import { formatDistance, formatDuration, formatPace } from '../utils/activityStats';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityDetail'>;

export default function ActivityDetailScreen({ route }: Props) {
  const { activityId } = route.params;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (!cancelled && !error && data) {
        setActivity({
          id: data.id,
          userId: data.user_id,
          type: data.type,
          startedAt: data.started_at,
          endedAt: data.ended_at,
          stats: data.stats,
          route: data.route,
          title: data.title ?? undefined,
        });
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.centered}>
        <Text>Activity not found.</Text>
      </View>
    );
  }

  const { stats, route: points } = activity;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: points[0].latitude,
          longitude: points[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Polyline
          coordinates={points.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
          strokeWidth={4}
          strokeColor="#111"
        />
      </MapView>

      <View style={styles.statsBar}>
        <Stat label="Distance" value={formatDistance(stats.distanceMeters)} />
        <Stat label="Duration" value={formatDuration(stats.durationSeconds)} />
        <Stat label="Pace" value={formatPace(stats.averagePaceSecPerKm)} />
        <Stat label="Elev gain" value={`${Math.round(stats.elevationGainMeters)} m`} />
      </View>

      <Text style={styles.dateText}>
        {new Date(activity.startedAt).toLocaleString()} · {activity.type}
      </Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  map: { flex: 1 },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexWrap: 'wrap',
  },
  stat: { alignItems: 'center', minWidth: '25%', marginVertical: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  dateText: { textAlign: 'center', color: '#888', paddingBottom: 20, paddingTop: 4 },
});
