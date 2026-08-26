import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import TrackActivityScreen from '../screens/TrackActivityScreen';
import ActivitySummaryScreen from '../screens/ActivitySummaryScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import { ActivityType, LocationPoint } from '../types';

export type RootStackParamList = {
  Home: undefined;
  TrackActivity: undefined;
  ActivitySummary: { route: LocationPoint[]; activityType: ActivityType };
  ActivityDetail: { activityId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Pacer' }} />
      <Stack.Screen
        name="TrackActivity"
        component={TrackActivityScreen}
        options={{ title: 'Track Activity', headerBackVisible: false }}
      />
      <Stack.Screen
        name="ActivitySummary"
        component={ActivitySummaryScreen}
        options={{ title: 'Save Activity', headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: 'Activity' }}
      />
    </Stack.Navigator>
  );
}
