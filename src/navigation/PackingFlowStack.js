import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Choice from '../components/Choice';
import RowPackingList from '../screens/RowPackingList';
import SeperatePacking from '../components/SeperatePacking';
import MixPacking from '../components/MixPacking';

const Stack = createNativeStackNavigator();

export default function PackingFlowStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RowPackingList" component={RowPackingList} />
            <Stack.Screen name="Choice" component={Choice} />
            <Stack.Screen name="SeperatePacking" component={SeperatePacking} />
            <Stack.Screen name="MixPacking" component={MixPacking} />
        </Stack.Navigator>
    );
}
