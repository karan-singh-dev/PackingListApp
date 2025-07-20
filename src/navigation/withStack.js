import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function withStack(ScreenComponent) {
  return () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={ScreenComponent} />
    </Stack.Navigator>
  );
}
