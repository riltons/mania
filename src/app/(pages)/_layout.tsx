import { Stack } from 'expo-router';
import React from 'react';

export default function PagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding/index" />
      <Stack.Screen name="jogador/[id]/jogos" />
      <Stack.Screen name="competicao/[id]" />
      <Stack.Screen name="comunidade/[id]" />
    </Stack>
  );
}