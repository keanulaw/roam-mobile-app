import { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { computeStats, formatDistance, formatDuration, formatPace } from '../utils/activityStats';
import { RootStackParamList } from '../navigation/RootNavigator';
import { ActivityType } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TrackActivity'>;

const ACTIVITY_TYPES: ActivityType[] = ['run', 'ride', 'walk'];

export default function TrackActivityScreen({ navigation }: Props) {
  const { status, route, permissionError, start, pause, resume, stop } = useLocationTracking();
  const [activityType, setActivityType] = useState<ActivityType>('run');

  const stats = computeStats(route);
  const lastPoint = route[route.length - 1];

  useEffect(() => {
    if (permissionError) Alert.alert('Location', permissionError);
  }, [permissionError]);

  const handleStop = async () => {
    const finalRoute = await stop();
    if (finalRoute.length < 2) {
      Alert.alert('Too short', 'Not enough GPS data was recorded to save this activity.');
      return;
    }
    navigation.replace('ActivitySummary', { route: finalRoute, activityType });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation
        followsUserLocation={status === 'tracking'}
        initialRegion={
          lastPoint
            ? {
                latitude: lastPoint.latitude,
                longitude: lastPoint.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : undefined
        }
      >
        {route.length > 1 && (
          <Polyline
            coordinates={route.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
            strokeWidth={4}
            strokeColor="#111"
          />
        )}
      </MapView>

      <View style={styles.statsBar}>
        <Stat label="Distance" value={formatDistance(stats.distanceMeters)} />
        <Stat label="Duration" value={formatDuration(stats.durationSeconds)} />
        <Stat label="Pace" value={formatPace(stats.averagePaceSecPerKm)} />
      </View>

      {status === 'idle' && (
        <View style={styles.typeRow}>
          {ACTIVITY_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setActivityType(t)}
              style={[styles.typeChip, activityType === t && styles.typeChipActive]}
            >
              <Text
                style={[styles.typeChipText, activityType === t && styles.typeChipTextActive]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.controls}>
        {status === 'idle' && (
          <Pressable style={styles.primaryButton} onPress={start}>
            <Text style={styles.primaryButtonText}>Start</Text>
          </Pressable>
        )}
        {status === 'tracking' && (
          <>
            <Pressable style={styles.secondaryButton} onPress={pause}>
              <Text style={styles.secondaryButtonText}>Pause</Text>
            </Pressable>
            <Pressable style={styles.stopButton} onPress={handleStop}>
              <Text style={styles.primaryButtonText}>Stop</Text>
            </Pressable>
          </>
        )}
        {status === 'paused' && (
          <>
            <Pressable style={styles.primaryButton} onPress={resume}>
              <Text style={styles.primaryButtonText}>Resume</Text>
            </Pressable>
            <Pressable style={styles.stopButton} onPress={handleStop}>
              <Text style={styles.primaryButtonText}>Stop</Text>
            </Pressable>
          </>
        )}
      </View>
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
  map: { flex: 1 },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  typeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingBottom: 12 },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  typeChipActive: { backgroundColor: '#111' },
  typeChipText: { color: '#333', fontWeight: '600', textTransform: 'capitalize' },
  typeChipTextActive: { color: '#fff' },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#eee',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#111', fontSize: 16, fontWeight: '700' },
  stopButton: {
    flex: 1,
    backgroundColor: '#c0392b',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
});
