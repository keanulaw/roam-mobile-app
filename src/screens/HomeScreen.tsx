import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { Activity } from '../types';
import { formatDistance, formatDuration, formatPace } from '../utils/activityStats';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [recent, setRecent] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setRecent(data.map(mapRowToActivity));
    }
    setLoading(false);
  }, []);

  // Refresh every time the screen regains focus (e.g. after saving a run).
  useFocusEffect(
    useCallback(() => {
      loadRecent();
    }, [loadRecent])
  );

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.startButton}
        onPress={() => navigation.navigate('TrackActivity')}
      >
        <Text style={styles.startButtonText}>Start Activity</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Recent activity</Text>

      <FlatList
        data={recent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              No activities yet — tap Start Activity to record your first one.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.activityRow}
            onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
          >
            <Text style={styles.activityType}>{item.type.toUpperCase()}</Text>
            <Text style={styles.activityStats}>
              {formatDistance(item.stats.distanceMeters)} ·{' '}
              {formatDuration(item.stats.durationSeconds)} ·{' '}
              {formatPace(item.stats.averagePaceSecPerKm)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function mapRowToActivity(row: any): Activity {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    stats: row.stats,
    route: row.route,
    title: row.title ?? undefined,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  startButton: {
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 24 },
  activityRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 14,
  },
  activityType: { fontWeight: '700', fontSize: 13, color: '#111', letterSpacing: 0.5 },
  activityStats: { color: '#555', marginTop: 4 },
});
