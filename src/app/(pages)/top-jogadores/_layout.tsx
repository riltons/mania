import { Stack } from "expo-router";
import { View } from "react-native";

export default function TopJogadoresLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Top Jogadores",
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
}