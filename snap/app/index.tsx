import { Redirect } from 'expo-router';

// Inloggad startpunkt. Utan token släpper Stack.Protected aldrig hit
// utan skickar till login.
export default function Index() {
  return <Redirect href="/camera" />;
}
