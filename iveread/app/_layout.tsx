import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { CalendarRecordsProvider } from '@/contexts/calendar-context';
import { ProfileProvider } from '@/contexts/profile-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <CalendarRecordsProvider>
        <ProfileProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
            <Stack.Screen name="password-reset" options={{ headerShown: false }} />
            <Stack.Screen name="friends" options={{ headerShown: false }} />
            <Stack.Screen name="add-record" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ProfileProvider>
      </CalendarRecordsProvider>
    </ThemeProvider>
  );
}
