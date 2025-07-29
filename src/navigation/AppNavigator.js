import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';



import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import LogIn from '../screens/packingScreen/LogIn';
import Splash from '../screens/packingScreen/Splash';
import AppDrawer from './AppDrawer';
import CreateClient from '../components/CreateClients';
import OrderUpload from '../screens/packingScreen/OrderUpload';
import Estimate from '../screens/packingScreen/Esstimate';
import AddStock from '../screens/packingScreen/AddStock';
import StockList from '../screens/packingScreen/StockList';
import RowPackingList from '../screens/packingScreen/RowPackingList';
import DisplayPackingList from '../screens/packingScreen/PackingList';
import UpdateOrder from '../screens/packingScreen/UpdateOrder';
import UploadedOrder from '../screens/packingScreen/UploadedOrder';
import Home from '../screens/packingScreen/Home';
import CommercialInvoice from '../screens/invoiceScreen/CommercialInvoice';
import PerformaInvoice from '../screens/invoiceScreen/PerformaInvoice';
import QRScannerScreen from '../components/Scanner';
import SeperatePacking from '../components/SeperatePacking';
import MixPacking from '../components/MixPacking';

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
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="AppDrawer" component={AppDrawer} />
            <Stack.Screen name="CreateClient" component={CreateClient} />
            <Stack.Screen name="CommercialInvoice" component={CommercialInvoice} />
            <Stack.Screen name="PerformaInvoice" component={PerformaInvoice} />
            <Stack.Screen name="QRScannerScreen" component={QRScannerScreen} />
            <Stack.Screen name="SeperatePacking" component={SeperatePacking} />
            <Stack.Screen name="MixPacking" component={MixPacking} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
