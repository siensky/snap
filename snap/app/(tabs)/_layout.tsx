import { Tabs } from "expo-router";

// Flik-navigation: Map, Camera, Conversations.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="map" options={{ title: "Map" }} />
      <Tabs.Screen name="conversations" options={{ title: "Chats" }} />
      <Tabs.Screen name="camera" options={{ title: "Camera" }} />
    </Tabs>
  );
}
