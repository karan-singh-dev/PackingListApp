import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';



import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import LogIn from './src/screens/LogIn';
import Splash from './src/screens/Splash';
import ClientSelection from './src/screens/ClintSelection';
import AppDrawer from './src/navigation/AppDrawer';
import PackingFlowStack from './src/navigation/PackingFlowStack';
import Choice from './src/components/Choice';
import SeperatePacking from './src/components/SeperatePacking';
import MixPacking from './src/components/MixPacking';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const Token = useSelector(state => state.login.Token);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {showSplash ? (
            <Stack.Screen name="Splash" component={Splash} />
          ) : Token == null ? (
            <Stack.Screen name="LogIn" component={LogIn} />
          ) : (
            <>
              <Stack.Screen name="ClintSelection" component={ClientSelection} />
              <Stack.Screen name="AppDrawer" component={AppDrawer} />
              <Stack.Screen options={{ headerShown: false }} name="Choice" component={Choice} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
