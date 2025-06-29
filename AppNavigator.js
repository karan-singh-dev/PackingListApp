import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Esstimate from './src/screens/Esstimate';
import AddStock from './src/screens/AddStock';
import NavigationPage from './src/screens/NavigationPage';
import StockList from './src/screens/StockList';
import RowPackingList from './src/screens/RowPackingList';
import OrderUpload from './src/screens/OrderUpload';
import DisplayPackingList from './src/screens/PackingList';
import ClintSelection from './src/screens/ClintSelection';
import Choice from './src/components/Choice';
import SeperatePacking from './src/components/SeperatePacking';
import MixPacking from './src/components/MixPacking';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import LogIn from './src/screens/LogIn';
import Splash from './src/screens/Splash';

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
              <Stack.Screen name="ClintSelection" component={ClintSelection} />
              <Stack.Screen name="NavigationPage" component={NavigationPage} />
              <Stack.Screen name="PackingList" component={DisplayPackingList} />
              <Stack.Screen name="AddStock" component={AddStock} />
              <Stack.Screen name="Esstimate" component={Esstimate} />
              <Stack.Screen name="StockList" component={StockList} />
              <Stack.Screen name="RowPackingList" component={RowPackingList} />
              <Stack.Screen name="OrderUpload" component={OrderUpload} />
              <Stack.Screen name="Choice" component={Choice} />
              <Stack.Screen name="SeperatePacking" component={SeperatePacking} />
              <Stack.Screen name="MixPacking" component={MixPacking} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
