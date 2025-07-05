import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import NavigationPage from '../screens/NavigationPage';
import DisplayPackingList from '../screens/PackingList';
import AddStock from '../screens/AddStock';
import Esstimate from '../screens/Esstimate';
import RowPackingList from '../screens/RowPackingList';
import OrderUpload from '../screens/OrderUpload';
import Choice from '../components/Choice';
import SeperatePacking from '../components/SeperatePacking';
import MixPacking from '../components/MixPacking';
import StockList from '../screens/StockList';
import ClientSelection from '../screens/ClintSelection';




const Drawer = createDrawerNavigator();

export default function AppDrawer() {
    return (
        <Drawer.Navigator initialRouteName="NavigationPage">
            <Drawer.Screen name="NavigationPage" component={NavigationPage} />
            <Drawer.Screen name="ClintSelection" component={ClientSelection} />
            <Drawer.Screen name="OrderUpload" component={OrderUpload} />
            <Drawer.Screen name="Esstimate" component={Esstimate} />
            <Drawer.Screen name="AddStock" component={AddStock} />
            <Drawer.Screen name="StockList" component={StockList} />
            <Drawer.Screen name="RowPackingList" component={RowPackingList} />
            <Drawer.Screen name="PackingList" component={DisplayPackingList} />

            <Drawer.Screen
                options={{
                    headerShown: false,
                    drawerItemStyle: { display: 'none' },
                }}
                name="SeperatePacking" component={SeperatePacking}
            />
            <Drawer.Screen
                options={{
                    headerShown: false,
                    drawerItemStyle: { display: 'none' },
                }}
                name="MixPacking"
                component={MixPacking} />

        </Drawer.Navigator>
    );
}
