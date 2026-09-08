import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFriends, sendSnap, type ApiFriend } from '@/lib/api';
import { useHandleApiError } from '@/lib/auth';

export default function SelectRecipientsScreen() {
  const handleApiError = useHandleApiError();
  const { photoUri, caption } = useLocalSearchParams<{
    photoUri: string;
    caption?: string;
  }>();

  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const all = await getFriends();
        // Lyckat skick kräver mutual: true — listan visar bara dem.
        setFriends(all.filter((f) => f.mutual));
      } catch (e) {
        const message = await handleApiError(e);
        if (message) setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [handleApiError]);

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

  // Extra namn (inte i mutual-listan) så 400 från sendSnap kan triggas.
  function addExtra() {
    const name = extra.trim();
    if (!name) return;
    setSelected((current) => new Set(current).add(name));
    setExtra('');
  }

  async function handleSend() {
    if (selected.size === 0 || !photoUri || sending) return;
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
      const message = await handleApiError(e);
      if (message) setError(message);
    } finally {
      setSending(false);
    }
  }

  const friendNames = new Set(friends.map((f) => f.username));
  const extras = Array.from(selected).filter((name) => !friendNames.has(name));
  const canSend = selected.size > 0 && !sending;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Send to</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Username"
          autoCapitalize="none"
          value={extra}
          onChangeText={setExtra}
          editable={!sending}
        />
        <Pressable
          style={[styles.add, (!extra.trim() || sending) && styles.addDisabled]}
          disabled={!extra.trim() || sending}
          onPress={addExtra}
        >
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>

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
          data={[...friends.map((f) => f.username), ...extras]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => toggle(item)}
              disabled={sending}
            >
              <Text style={styles.name}>{item}</Text>
              <View
                style={[
                  styles.checkbox,
                  selected.has(item) && styles.checkboxChecked,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  search: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  add: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addDisabled: {
    backgroundColor: '#888',
  },
  addText: {
    color: '#fff',
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
