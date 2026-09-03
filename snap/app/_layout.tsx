import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

export default function RootLayout() {

  return (
    // GestureHandlerRootView krävs för swipe-gester (ReanimatedSwipeable i conversations).
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Chatten ligger ovanpå flikarna och glider in från höger, helskärm (Snapchat-stil). */}
        <Stack.Screen
          name="chat"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
