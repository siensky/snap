import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ApiError,
  addFriend,
  deleteFriend,
  getFriendRequests,
  searchUsers,
  type UserSearchResult,
} from '@/lib/api';

export default function AddFriendScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [requests, setRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumpas efter varje ändring för att tvinga om-läsning från mocken.
  const [reloadKey, setReloadKey] = useState(0);

  const loadRequests = useCallback(async () => {
    try {
      setRequests(await getFriendRequests());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  }, []);

  // Ladda inkommande vänförfrågningar (mount + efter varje ändring).
  useEffect(() => {
    (async () => {
      await loadRequests();
      setLoading(false);
    })();
  }, [loadRequests, reloadKey]);

  // Sök när texten ändras eller efter en ändring. `active` skyddar mot svar
  // som kommer i fel ordning. Ingen optimistisk lokal state – mocken är källan.
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }
    let active = true;
    setSearching(true);
    (async () => {
      try {
        const found = await searchUsers(query);
        if (active) setResults(found);
      } catch (e) {
        if (active) {
          setError(e instanceof ApiError ? e.message : 'Something went wrong');
        }
      } finally {
        if (active) setSearching(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [query, reloadKey]);

  // Add <-> Pending. Efter anropet läses allt om från mocken.
  async function toggleAdd(user: UserSearchResult) {
    setError(null);
    try {
      if (user.requested) {
        await deleteFriend(user.username);
      } else {
        await addFriend(user.username);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setReloadKey((k) => k + 1);
    }
  }

  // Acceptera en förfrågan = lägg till tillbaka. Blir det inte 'friends' fanns
  // förfrågan inte längre – säg till istället för att låtsas att det gick.
  async function accept(username: string) {
    setError(null);
    try {
      const res = await addFriend(username);
      if (res.status !== 'friends') {
        setError(`Could not accept ${username} — the request is no longer available`);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setReloadKey((k) => k + 1);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Add friend</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search users"
        autoCapitalize="none"
        value={query}
        onChangeText={setQuery}
      />

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Results</Text>
          {searching && <ActivityIndicator />}
        </View>
        {query.trim() !== '' && !searching && results.length === 0 && (
          <Text style={styles.muted}>No users found</Text>
        )}
        {results.map((user) => (
          <View key={user.username} style={styles.row}>
            <Text style={styles.name}>{user.username}</Text>
            <Pressable
              style={[styles.action, user.requested && styles.actionMuted]}
              onPress={() => toggleAdd(user)}
            >
              <Text style={styles.actionText}>
                {user.requested ? 'Pending' : 'Add'}
              </Text>
            </Pressable>
          </View>
        ))}

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Requests</Text>
        {loading ? (
          <ActivityIndicator />
        ) : requests.length === 0 ? (
          <Text style={styles.muted}>No requests</Text>
        ) : (
          requests.map((username) => (
            <View key={username} style={styles.row}>
              <Text style={styles.name}>{username}</Text>
              <Pressable style={styles.action} onPress={() => accept(username)}>
                <Text style={styles.actionText}>Accept</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  close: {
    color: '#0066cc',
    fontWeight: 'bold',
    fontSize: 16,
  },
  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  errorBox: {
    backgroundColor: '#fdecec',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#b00020',
  },
  scroll: {
    gap: 8,
    paddingBottom: 24,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
  },
  sectionSpacing: {
    marginTop: 16,
  },
  muted: {
    color: '#888',
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
  action: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionMuted: {
    backgroundColor: '#888',
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
