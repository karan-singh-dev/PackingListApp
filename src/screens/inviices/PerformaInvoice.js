import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux';
import ClientSelection from '../../components/ClintSelection';

const PerformaInvoice = () => {
       const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const marka = selectedClient?.marka || '';
  const client = selectedClient?.client_name || '';
    const isClientSelected = !!client;


    return (

        <View style={styles.container}>
            {!isClientSelected ? (<ClientSelection/>) : (<Text>PerformaInvoice</Text>)}
            
        </View>
    )
}

export default PerformaInvoice

const styles = StyleSheet.create({
       container: {
    flex: 1,
    backgroundColor: '#f2f3f5',
  
  },
})
