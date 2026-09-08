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
  addFriend,
  deleteFriend,
  getFriendRequests,
  searchUsers,
  type AddFriendResponse,
  type UserSearchResult,
} from '@/lib/api';
import { useHandleApiError } from '@/lib/auth';

export default function AddFriendScreen() {
  const handleApiError = useHandleApiError();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [requests, setRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Senaste addFriend-svaret visas rakt av: 'pending' | 'friends'.
  const [status, setStatus] = useState<AddFriendResponse['status'] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const trimmed = query.trim();

  const loadRequests = useCallback(async () => {
    try {
      setRequests(await getFriendRequests());
    } catch (e) {
      const message = await handleApiError(e);
      if (message) setError(message);
    }
  }, [handleApiError]);

  useEffect(() => {
    (async () => {
      await loadRequests();
      setLoading(false);
    })();
  }, [loadRequests, reloadKey]);

  // Sök bara när fältet inte är tomt — undvik setState på tom query (lint).
  useEffect(() => {
    if (trimmed === '') {
      return;
    }
    let active = true;
    (async () => {
      setSearching(true);
      try {
        const found = await searchUsers(query);
        if (active) setResults(found);
      } catch (e) {
        if (active) {
          const message = await handleApiError(e);
          if (message) setError(message);
        }
      } finally {
        if (active) setSearching(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [query, trimmed, reloadKey, handleApiError]);

  async function handleAdd(username: string) {
    setError(null);
    setStatus(null);
    setAdding(true);
    try {
      const res = await addFriend(username);
      setStatus(res.status);
    } catch (e) {
      const message = await handleApiError(e);
      if (!message) return;
      setError(message);
    } finally {
      setAdding(false);
      setReloadKey((k) => k + 1);
    }
  }

  async function toggleAdd(user: UserSearchResult) {
    if (user.requested) {
      setError(null);
      setStatus(null);
      try {
        await deleteFriend(user.username);
      } catch (e) {
        const message = await handleApiError(e);
        if (!message) return;
        setError(message);
      } finally {
        setReloadKey((k) => k + 1);
      }
      return;
    }
    await handleAdd(user.username);
  }

  const visibleResults = trimmed === '' ? [] : results;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Add friend</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Search users"
          autoCapitalize="none"
          value={query}
          onChangeText={setQuery}
        />
        <Pressable
          style={[styles.action, (!trimmed || adding) && styles.actionMuted]}
          disabled={!trimmed || adding}
          onPress={() => handleAdd(trimmed)}
        >
          <Text style={styles.actionText}>{adding ? '…' : 'Add'}</Text>
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {status && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Results</Text>
          {searching && <ActivityIndicator />}
        </View>
        {trimmed !== '' && !searching && visibleResults.length === 0 && (
          <Text style={styles.muted}>No users found</Text>
        )}
        {visibleResults.map((user) => (
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
              <Pressable
                style={[styles.action, adding && styles.actionMuted]}
                disabled={adding}
                onPress={() => handleAdd(username)}
              >
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
  errorBox: {
    backgroundColor: '#fdecec',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#b00020',
  },
  statusBox: {
    backgroundColor: '#e7f6ec',
    borderRadius: 8,
    padding: 12,
  },
  statusText: {
    color: '#0d6b2c',
    fontWeight: 'bold',
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
