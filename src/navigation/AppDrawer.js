import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Estimate from '../screens/packingScreen/Esstimate';
import StockList from '../screens/packingScreen/StockList';
import OrderUpload from '../screens/packingScreen/OrderUpload';
import DisplayPackingList from '../screens/packingScreen/PackingList';
import CustomDrawer from '../components/CustomDrawer';
import UploadedOrder from '../screens/packingScreen/UploadedOrder';
import PackingPage from '../screens/packingScreen/PackingPage';
import RowPackingList from '../screens/packingScreen/RowPackingList';
import UpdateOrder from '../screens/packingScreen/UpdateOrder';
import AddStock from '../screens/packingScreen/AddStock';

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawer {...props} />} // <-- use custom drawer
            screenOptions={{ headerShown: false }} // hide default header if you want custom UI 
        >
            <Drawer.Screen name="PackingPage" component={PackingPage} />
            <Drawer.Screen name="UploadedOrder" component={UploadedOrder} />
            <Drawer.Screen name="OrderUpdate" component={UpdateOrder} />
            <Drawer.Screen name="StockList" component={StockList} />
            <Drawer.Screen name="AddStock" component={AddStock} />
            <Drawer.Screen name="OrderUpload" component={OrderUpload} />
            <Drawer.Screen name="RowPackingList" component={RowPackingList} />
            <Drawer.Screen name="PackingList" component={DisplayPackingList} />
            <Drawer.Screen name="Estimate" component={Estimate} />
        </ Drawer.Navigator>
    );
}