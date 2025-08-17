import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {navigationRef} from './RootNavigation'

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
import CommercialInvoice from '../screens/main/invoiceScreen/CommercialInvoice';
import PerformaInvoice from '../screens/main/invoiceScreen/PerformaInvoice';
import QRScannerScreen from '../components/Scanner';
import SeperatePacking from '../components/SeperatePacking';
import MixPacking from '../components/MixPacking';
import CBMCalculator from '../screens/main/Cbm';
import MrpDetailS from '../screens/main/MrpDetail';
import UpdateMainStocks from '../screens/main/invoiceScreen/UpdateMainStocks';
import MainStockList from '../screens/main/invoiceScreen/MainStockList';
import Gst from '../screens/main/Gst';
import UpdatePackingList from '../screens/packingScreen/UpdatePackingList';

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
    <NavigationContainer ref={navigationRef}>
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
            <Stack.Screen name="CBM" component={CBMCalculator} />
            <Stack.Screen name="Gst" component={Gst} />
            <Stack.Screen name="Mrp" component={MrpDetailS} />
            <Stack.Screen name="UpdateMainStocks" component={UpdateMainStocks} />
            <Stack.Screen name="MainStockList" component={MainStockList} />
            <Stack.Screen name="UpdatePackingList" component={UpdatePackingList} />

          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
