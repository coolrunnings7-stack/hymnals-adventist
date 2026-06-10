// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';

import HymnBrowserScreen   from '../screens/HymnBrowserScreen';
import HymnDetailScreen    from '../screens/HymnDetailScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function BrowseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HymnBrowser" component={HymnBrowserScreen} />
      <Stack.Screen name="HymnDetail"  component={HymnDetailScreen} />
    </Stack.Navigator>
  );
}

// Placeholder screens for other tabs
const FavoritesScreen   = () => null;
const WorshipSetsScreen = () => null;
const SettingsScreen    = () => null;

export default function AppNavigator() {
  const isDark = useColorScheme() === 'dark';
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? Colors.surfaceDark : Colors.surface,
            borderTopColor: isDark ? Colors.borderDark : Colors.border,
            borderTopWidth: 0.5,
          },
          tabBarActiveTintColor:   Colors.primary,
          tabBarInactiveTintColor: isDark ? Colors.textSecondaryDark : Colors.textSecondary,
          tabBarIcon: ({ focused, color, size }) => {
            const icons: Record<string, [string, string]> = {
              Browse:    ['musical-notes',          'musical-notes-outline'],
              Favorites: ['heart',                  'heart-outline'],
              Sets:      ['list',                   'list-outline'],
              Settings:  ['settings',               'settings-outline'],
            };
            const [active, inactive] = icons[route.name] ?? ['help', 'help-outline'];
            return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Browse"    component={BrowseStack} />
        <Tab.Screen name="Favorites" component={FavoritesScreen} />
        <Tab.Screen name="Sets"      component={WorshipSetsScreen} options={{ title: 'Worship Sets' }} />
        <Tab.Screen name="Settings"  component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
