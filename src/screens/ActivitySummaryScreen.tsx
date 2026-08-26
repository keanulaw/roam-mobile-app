import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { supabase } from '../lib/supabase';
import { computeStats, formatDistance, formatDuration, formatPace } from '../utils/activityStats';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ActivitySummary'>;

export default function ActivitySummaryScreen({ route: navRoute, navigation }: Props) {
  const { route, activityType } = navRoute.params;
  const [saving, setSaving] = useState(false);
  const stats = computeStats(route);

  const save = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      Alert.alert('Not signed in', 'You need to be signed in to save an activity.');
      return;
    }

    const { error } = await supabase.from('activities').insert({
      user_id: user.id,
      type: activityType,
      started_at: new Date(route[0].timestamp).toISOString(),
      ended_at: new Date(route[route.length - 1].timestamp).toISOString(),
      stats,
      route,
    });

    setSaving(false);
    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }
    navigation.popToTop();
  };

  const discard = () => {
    Alert.alert('Discard activity?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.popToTop() },
    ]);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: route[0].latitude,
          longitude: route[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Polyline
          coordinates={route.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
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

      <View style={styles.controls}>
        <Pressable style={styles.discardButton} onPress={discard} disabled={saving}>
          <Text style={styles.discardButtonText}>Discard</Text>
        </Pressable>
        <Pressable style={styles.saveButton} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
        </Pressable>
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
    flexWrap: 'wrap',
  },
  stat: { alignItems: 'center', minWidth: '25%', marginVertical: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  controls: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  discardButton: {
    flex: 1,
    backgroundColor: '#eee',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  discardButtonText: { color: '#c0392b', fontSize: 16, fontWeight: '700' },
  saveButton: {
    flex: 2,
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
