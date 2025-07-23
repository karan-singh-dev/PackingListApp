import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Home from '../screens/Home';
import PackingStack from './PackingStack'; // ✅ Stack with internal hidden screens
import Estimate from '../screens/Esstimate';
import AddStock from '../screens/AddStock';
import StockList from '../screens/StockList';
import OrderUpload from '../screens/OrderUpload';
import DisplayPackingList from '../screens/PackingList';

import Invoicestack from '../screens/inviices/Navigation/Invoicestack';
import CommercialInvoice from '../screens/inviices/CommercialInvoice';
import PerformaInvoice from '../screens/inviices/PerformaInvoice';

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
    return (
        <Drawer.Navigator screenOptions={{ headerShown: false, }} initialRouteName="Home">
            <Drawer.Screen
                name="Home"
                component={Home}
                options={{
                    drawerLabel: 'Home',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="home-outline" color={color} size={size} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Packing"
                component={PackingStack} // ← contains PackingPage inside it
                options={{
                    drawerLabel: 'Packing',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="box" color={color} size={size} />
                    ),
                }}
            />

            <Drawer.Screen
                name="Estimate"
                component={Estimate}
                options={{
                    drawerLabel: 'Estimate',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="file-document-outline" color={color} size={size} />
                    ),
                }}
            />
            <Drawer.Screen
                name="OrderUpload"
                component={OrderUpload}
                options={{
                    drawerLabel: 'Order Upload',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="upload" color={color} size={size} />
                    ),
                }}
            />
            <Drawer.Screen
                name="AddStock"
                component={AddStock}
                options={{
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
                    drawerLabel: 'Stock List',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="format-list-bulleted" color={color} size={size} />
                    ),
                }}
            />
            <Drawer.Screen
                name="PackingList"
                component={DisplayPackingList}
                options={{
                    drawerLabel: 'Packing List',
                    drawerIcon: ({ color, size }) => (
                        <Icon name="clipboard-list-outline" color={color} size={size} />
                    ),
                }}
            />
             
           
        </Drawer.Navigator>
    );
}