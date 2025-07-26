import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CommercialInvoice from '../CommercialInvoice';
import PerformaInvoice from '../PerformaInvoice';
const Stack = createNativeStackNavigator();

export default function Invoicestack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CommercialInvoice" component={CommercialInvoice} />
            <Stack.Screen name="PerformaInvoice" component={PerformaInvoice} />
        </Stack.Navigator>
    )
}
