import { Stack } from '@tamagui/core';
import { Text, TouchableOpacity } from 'react-native';

export default function Index() {
  return (
    <Stack flex={1} justifyContent="center" alignItems="center" padding="$4" backgroundColor="$background">
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Welcome to ATS Pro</Text>
      <Text style={{ fontSize: 16, marginBottom: 16 }}>Tamagui successfully integrated!</Text>
      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 8,
        }}
        onPress={() => console.log('Button pressed!')}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Get Started</Text>
      </TouchableOpacity>
    </Stack>
  );
}
