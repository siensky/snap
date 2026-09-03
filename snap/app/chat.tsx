import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  // Vem chatten gäller (skickas med från conversations-listan).
  const { username } = useLocalSearchParams<{ username?: string }>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header med naturlig toppmarginal för notch/statusbar. */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
        <Text style={styles.title}>{username ?? 'Chat'}</Text>
        {/* Osynlig spegel av Close så titeln hamnar centrerad. */}
        <Text style={[styles.close, styles.hidden]}>Close</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.placeholder}>
          No messages yet
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  close: {
    color: '#0066cc',
    fontWeight: 'bold',
    fontSize: 16,
  },
  hidden: {
    opacity: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    color: '#888',
  },
});
