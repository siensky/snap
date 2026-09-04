import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, getFriends, sendSnap, type ApiFriend } from '@/lib/api';

export default function SelectRecipientsScreen() {
  const { photoUri, caption } = useLocalSearchParams<{
    photoUri: string;
    caption?: string;
  }>();

  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const all = await getFriends();
        setFriends(all.filter((f) => f.mutual));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function toggle(username: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(username)) {
        next.delete(username);
      } else {
        next.add(username);
      }
      return next;
    });
  }

  async function handleSend() {
    if (selected.size === 0 || !photoUri) return;
    setSending(true);
    setError(null);
    try {
      await sendSnap({
        recipients: Array.from(selected),
        photo: { uri: photoUri, mimetype: 'image/jpeg' },
        text: caption || undefined,
      });
      router.dismissAll();
      router.navigate('/conversations');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setSending(false);
    }
  }

  const canSend = selected.size > 0 && !sending;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Send to</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          style={styles.list}
          data={friends}
          keyExtractor={(item) => item.username}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => toggle(item.username)}>
              <Text style={styles.name}>{item.username}</Text>
              <View
                style={[
                  styles.checkbox,
                  selected.has(item.username) && styles.checkboxChecked,
                ]}
              />
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No friends yet</Text>}
        />
      )}

      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={[styles.send, !canSend && styles.sendDisabled]}
      >
        <Text style={styles.sendText}>{sending ? 'Sending…' : 'Skicka'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  back: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#0066cc',
    fontWeight: 'bold',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#fdecec',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#b00020',
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  name: {
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#888',
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
  },
  send: {
    alignSelf: 'flex-end',
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  sendDisabled: {
    backgroundColor: '#888',
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
