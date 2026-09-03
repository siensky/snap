import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { setAccessToken } from '@/lib/api';

// Nyckeln vi sparar access-token under i SecureStore. Samma sträng i login/register.
const TOKEN_KEY = 'accessToken';

// Loggar ut: nollar mockens minne och raderar den sparade token.
// Exporteras så en knapp kan använda den senare.
export async function logout() {
  setAccessToken(null);
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Startpunkt / auth-gate.
// Har användaren en sparad token -> läs in den och gå till camera.
// Annars -> gå till login.
export default function Index() {
  const [status, setStatus] = useState<'checking' | 'in' | 'out'>('checking');

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        setAccessToken(token);
        setStatus('in');
      } else {
        setStatus('out');
      }
    })();
  }, []);

  if (status === 'checking') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'in') {
    return <Redirect href="/camera" />;
  }

  return <Redirect href="/login" />;
}
