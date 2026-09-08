import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import Swipeable, {
  SwipeDirection,
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFriends, type ApiFriend } from '@/lib/api';
import { useAuth, useHandleApiError } from '@/lib/auth';

// Mutual-rad: swajpa åt höger -> chat. Pending-rad: ingen chat, annan look.
function FriendRow({ friend }: { friend: ApiFriend }) {
  const swipeRef = useRef<SwipeableMethods>(null);

  if (!friend.mutual) {
    return (
      <View style={[styles.row, styles.pendingRow]}>
        <Text style={[styles.name, styles.pendingName]}>{friend.username}</Text>
        <Text style={styles.pendingLabel}>Pending</Text>
      </View>
    );
  }

  return (
    <Swipeable
      ref={swipeRef}
      leftThreshold={40}
      renderLeftActions={() => (
        <View style={styles.leftAction}>
          <Text style={styles.leftActionText}>Chat</Text>
        </View>
      )}
      onSwipeableWillOpen={(direction) => {
        // OBS: direction = swajp-riktningen. Drar man raden åt höger (så att
        // vänster-panelen "Chat" visas) är den RIGHT, inte LEFT.
        if (direction === SwipeDirection.RIGHT) {
          swipeRef.current?.close();
          router.push({ pathname: '/chat', params: { username: friend.username } });
        }
      }}
    >
      <View style={styles.row}>
        <Text style={styles.name}>{friend.username}</Text>
        <Text style={styles.friendLabel}>Friends</Text>
      </View>
    </Swipeable>
  );
}

export default function ConversationsScreen() {
  const { signOut } = useAuth();
  const handleApiError = useHandleApiError();
  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Hämtar om varje gång skärmen får fokus, så att t.ex. en accepterad
  // vänförfrågan från AddFriend-vyn syns direkt.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setError(null);
      (async () => {
        try {
          const all = await getFriends();
          if (active) setFriends(all);
        } catch (e) {
          const message = await handleApiError(e);
          if (active && message) setError(message);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [handleApiError]),
  );

  // Loggar ut. Stack.Protected skickar till login när session blir null.
  async function handleLogout() {
    await signOut();
  }

  // Filtrera listan på det som skrivs i sökfältet.
  const visible = friends.filter((f) =>
    f.username.toLowerCase().includes(search.trim().toLowerCase()),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Link href="/add-friend" style={styles.addButton}>
        + Add friend
      </Link>
      <Pressable onPress={handleLogout}>
        <Text style={styles.logout}>Logout</Text>
      </Pressable>

      <TextInput
        style={styles.search}
        placeholder="Search friends"
        autoCapitalize="none"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={visible}
        keyExtractor={(item) => item.username}
        renderItem={({ item }) => <FriendRow friend={item} />}
        ListEmptyComponent={<Text style={styles.empty}>No friends yet</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#b00020',
  },
  addButton: {
    color: '#0066cc',
    fontWeight: 'bold',
    paddingVertical: 4,
  },
  logout: {
    color: '#b00020',
    fontWeight: 'bold',
    paddingVertical: 4,
  },
  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  row: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  name: {
    fontSize: 16,
  },
  pendingRow: {
    backgroundColor: '#f5f5f5',
  },
  pendingName: {
    color: '#888',
  },
  pendingLabel: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 13,
  },
  friendLabel: {
    color: '#0066cc',
    fontWeight: 'bold',
    fontSize: 13,
  },
  leftAction: {
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  leftActionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
  },
});
