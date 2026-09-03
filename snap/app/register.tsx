import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ApiError, register, setAccessToken } from '@/lib/api';

// Samma nyckel som i app/index.tsx.
const TOKEN_KEY = 'accessToken';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = username.length > 0 && password.length > 0 && !loading;

  async function handleRegister() {
    setLoading(true);
    setError(null);
    try {
      const res = await register(username, password);
      await SecureStore.setItemAsync(TOKEN_KEY, res.tokens.access_token);
      setAccessToken(res.tokens.access_token);
      router.replace('/camera');
    } catch (e) {
      // ApiError.message är backendens text (t.ex. "User already exists").
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        autoCapitalize="none"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        disabled={!canSubmit}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>Register</Text>
      </Pressable>

      {loading && <ActivityIndicator style={styles.spacer} />}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Link href="/login" style={styles.link}>
        Already have an account? Log in
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  spacer: {
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: '#fdecec',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#b00020',
  },
  link: {
    textAlign: 'center',
    color: '#0066cc',
    marginTop: 8,
  },
});
