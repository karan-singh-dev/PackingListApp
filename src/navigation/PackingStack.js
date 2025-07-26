
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PackingPage from '../screens/PackingPage';
import OrderUpload from '../screens/OrderUpload';
import Estimate from '../screens/Esstimate';
import AddStock from '../screens/AddStock';
import StockList from '../screens/StockList';
import RowPackingList from '../screens/RowPackingList';
import DisplayPackingList from '../screens/PackingList';
import SeperatePacking from '../components/SeperatePacking';
import MixPacking from '../components/MixPacking';
import QRScannerScreen from '../components/Scanner';
import UpdateOrder from '../screens/UpdateOrder';
import UploadedOrder from '../screens/UploadedOrder';

const Stack = createNativeStackNavigator();

export default function PackingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PackingPage" component={PackingPage} />
      <Stack.Screen name="OrderUpload" component={OrderUpload} />
      <Stack.Screen name="Estimate" component={Estimate} />
      <Stack.Screen name="AddStock" component={AddStock} />
      <Stack.Screen name="StockList" component={StockList} />
      <Stack.Screen name="RowPackingList" component={RowPackingList} />
      <Stack.Screen name="PackingList" component={DisplayPackingList} />
      <Stack.Screen name="QRScannerScreen" component={QRScannerScreen} />
      <Stack.Screen name="SeperatePacking" component={SeperatePacking} />
      <Stack.Screen name="MixPacking" component={MixPacking} />
      <Stack.Screen name="OrderUpdate" component={UpdateOrder} />
         <Stack.Screen name="UploadedOrder" component={UploadedOrder} />
    </Stack.Navigator>
  );
}
