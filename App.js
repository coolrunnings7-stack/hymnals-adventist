import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ScrollView
} from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a3a5c', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
        Hymnals of the{'\n'}Adventist Movement
      </Text>
      <Text style={{ color: '#e8b04a', fontSize: 16, marginTop: 12 }}>
        Loading...
      </Text>
    </SafeAreaView>
  );
}
