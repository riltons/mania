import { Redirect } from 'expo-router';

export default function TabsIndex() {
  // Redireciona para o dashboard quando o usuário acessa /(tabs)
  return <Redirect href="/dashboard" />;
}