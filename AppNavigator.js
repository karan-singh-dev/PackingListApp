import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';



import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import LogIn from './src/screens/LogIn';
import Splash from './src/screens/Splash';
import ClientSelection from './src/components/ClintSelection';
import AppDrawer from './src/navigation/AppDrawer';
import CreateClient from './src/components/CreateClients';
import Invoicestack from './src/screens/inviices/Navigation/Invoicestack';
import PerformaInvoice from './src/screens/inviices/PerformaInvoice';
import CommercialInvoice from './src/screens/inviices/CommercialInvoice';
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
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showSplash ? (
          <Stack.Screen name="Splash" component={Splash} />
        ) : Token == null ? (
          <Stack.Screen name="LogIn" component={LogIn} />
        ) : (
          <>
            <Stack.Screen name="AppDrawer" component={AppDrawer} />
            <Stack.Screen name="CreateClient" component={CreateClient} />
            <Stack.Screen name="CommercialInvoice" component={CommercialInvoice} />
            <Stack.Screen name="PerformaInvoice" component={PerformaInvoice} />
            <Stack.Screen name="SeperatePacking" component={SeperatePacking} />
            <Stack.Screen name="MixPacking" component={MixPacking} />

          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
