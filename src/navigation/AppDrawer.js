import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import NavigationPage from '../screens/NavigationPage';
import DisplayPackingList from '../screens/PackingList';
import AddStock from '../screens/AddStock';
import Esstimate from '../screens/Esstimate';
import RowPackingList from '../screens/RowPackingList';
import OrderUpload from '../screens/OrderUpload';
import SeperatePacking from '../components/SeperatePacking';
import MixPacking from '../components/MixPacking';
import StockList from '../screens/StockList';
import ClientSelection from '../screens/ClintSelection';
import Estimate from '../screens/Esstimate';

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
    return (
        <Drawer.Navigator initialRouteName="NavigationPage">
            <Drawer.Screen
                name="NavigationPage"
                component={NavigationPage}
                options={{
                    drawerLabel: 'Home',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="home-outline" color={color} size={size} />
                    ),
                }}
            />
            <Drawer.Screen
                name="ClintSelection"
                component={ClientSelection}
                options={{
                    drawerLabel: 'Client Selection',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="account-multiple" color={color} size={size} />
                    ),
                }}
            />
            <Drawer.Screen
                name="OrderUpload"
                component={OrderUpload}
                options={{
                     headerShown: false,
                    drawerLabel: 'Order Upload',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="upload" color={color} size={size} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Estimate"
                component={Estimate}
                options={{
                     headerShown: false,
                    drawerLabel: 'Estimate',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="file-document-outline" color={color} size={size} />
                    ),
                }}
            />
            <Drawer.Screen
                name="AddStock"
                component={AddStock}
                options={{
                    headerShown: false,
                    drawerLabel: 'Add Stock',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="plus-box" color={color} size={size} />
                    ),
                }}
            />
            <Drawer.Screen
                name="StockList"
                component={StockList}
                options={{
                    headerShown: false,
                    drawerLabel: 'Stock List',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="format-list-bulleted" color={color} size={size} />
                    ),
                }}
            />
            <Drawer.Screen
                name="RowPackingList"
                component={RowPackingList}
                options={{
                     headerShown: false,
                    drawerLabel: 'Row Packing List',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="view-grid" color={color} size={size} />
                    ),
                }}
            />
            <Drawer.Screen
                name="PackingList"
                component={DisplayPackingList}
                options={{
                    headerShown: false,
                    drawerLabel: 'Packing List',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="clipboard-list-outline" color={color} size={size} />
                    ),
                }}
            />
            <Drawer.Screen
                name="SeperatePacking"
                component={SeperatePacking}
                options={{
                    headerShown: false,
                    drawerItemStyle: { display: 'none' },
                }}
            />
            <Drawer.Screen
                name="MixPacking"
                component={MixPacking}
                options={{
                    headerShown: false,
                    drawerItemStyle: { display: 'none' },
                }}
            />
        </Drawer.Navigator>
    );
}
