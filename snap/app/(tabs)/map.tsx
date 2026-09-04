import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { mockFriendLocations } from '@/lib/mocklocations';

export default function MapScreen() {
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [myLocation, setMyLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!permission) return;

    (async () => {
      if (!permission.granted) {
        if (permission.canAskAgain) {
          await requestPermission();
        } else {
          setError('Location permission was denied');
        }
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync();
        setMyLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setError(null);
      } catch {
        setError('Could not get your location');
      }
    })();
  }, [permission, requestPermission]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Try again" onPress={() => requestPermission()} />
      </View>
    );
  }

  if (!myLocation) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: myLocation.latitude,
        longitude: myLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker coordinate={myLocation} title="You" pinColor="blue" />
      {mockFriendLocations.map((friend) => (
        <Marker
          key={friend.username}
          coordinate={{ latitude: friend.latitude, longitude: friend.longitude }}
          title={friend.username}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  errorText: {
    textAlign: 'center',
    color: '#b00020',
  },
});
