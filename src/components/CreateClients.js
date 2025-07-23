import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { addClientAsync } from '../../redux/ClientDataSlice';

const CreateClient = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { loading } = useSelector((state) => state.clientData);

  // Form fields
  const [clientName, setClientName] = useState('');
  const [clientCountry, setClientCountry] = useState('');
  const [clientMarka, setClientMarka] = useState('');
  const [address, setAddress] = useState('');
  const [vesselNo, setVesselNo] = useState(null);
  const [portOfLoading, setPortOfLoading] = useState('');
  const [termsOfPayment, setTermsOfPayment] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [portOfDischarge, setPortOfDischarge] = useState('');
  const [finalDestination, setFinalDestination] = useState('');

  const vesselType = [
    { label: 'Sea', value: 'Sea' },
    { label: 'Road', value: 'Road' },
    { label: 'Air', value: 'Air' },
  ];


  const validateClientData = (data) => {
    const errors = {};

    if (!data.client_name?.trim()) {
      errors.client_name = 'Client Name is required';
    }
    if (!data.marka?.trim()) {
      errors.marka = 'Marka is required';
    }
    if (!data.country?.trim()) {
      errors.country = 'Country is required';
    }
    if (!data.address?.trim()) {
      errors.address = 'Address is required';
    }
    if (!data.vessel_no?.trim()) {
      errors.vessel_no = 'Vessel Type is required';
    }
    if (!data.port_of_loading?.trim()) {
      errors.port_of_loding = 'Port of Loding is required';
    }
    if (!data.terms_of_payment?.trim()) {
      errors.terms_of_payment = 'Terms of Payment is required';
    }
    if (!data.delivery_terms?.trim()) {
      errors.delivery_terms = 'Delivery Terms are required';
    }
    if (!data.port_of_discharge?.trim()) {
      errors.port_of_discharge = 'Port of Discharge is required';
    }
    if (!data.final_destination?.trim()) {
      errors.final_destination = 'Final Destination is required';
    }

    return errors;
  };




  const handleAddClient = async () => {






    const newClient = {
      client_name: clientName.trim(),
      country: clientCountry.trim(),
      marka: clientMarka.trim(),
      address: address.trim(),
      vessel_no: vesselNo ? vesselNo.value : '',
      port_of_loading: portOfLoading.trim(),
      terms_of_payment: termsOfPayment.trim(),
      delivery_terms: deliveryTerms.trim(),
      port_of_discharge: portOfDischarge.trim(),
      final_destination: finalDestination.trim(),
    };
console.log('newClient',);

    try {

      const errors = validateClientData(newClient);

      if (Object.keys(errors).length > 0) {
        Alert.alert('Validation Error', Object.values(errors)[0]);
        return;
      }
      await dispatch(addClientAsync(newClient)).unwrap();

      Alert.alert('Success', 'Client added successfully');
      navigation.goBack();
    } catch (err) {
      console.error('Add client error:', err);
      Alert.alert('Error', err?.message || 'Failed to add client');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>ADD A NEW CLIENT</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          placeholder="Client Name"
          style={styles.input}
          value={clientName}
          onChangeText={setClientName}
          placeholderTextColor="#ccc"
        />

        <Text style={styles.label}>Mark</Text>
        <TextInput
          placeholder="Marka"
          style={styles.input}
          value={clientMarka}
          onChangeText={setClientMarka}
          placeholderTextColor="#ccc"
        />

        <Text style={styles.label}>Country</Text>
        <TextInput
          placeholder="Country"
          style={styles.input}
          value={clientCountry}
          onChangeText={setClientCountry}
          placeholderTextColor="#ccc"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          placeholder="Address"
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholderTextColor="#ccc"
        />

        <Text style={styles.label}>Vessel Type</Text>
        <Dropdown
          data={vesselType}
          labelField="label"
          valueField="value"
          placeholder="Select Vessel Type"
          value={vesselNo}
          onChange={(item) => setVesselNo(item)}
          style={styles.dropdown}
          disable={loading}
          placeholderStyle={{ color: '#999' }}
          selectedTextStyle={{ color: '#000' }}
          itemTextStyle={{ color: '#000' }}
        />

        <Text style={styles.label}>Port Of Loding</Text>
        <TextInput
          placeholder="Port Of Loding"
          style={styles.input}
          value={portOfLoading}
          onChangeText={setPortOfLoading}
          placeholderTextColor="#ccc"
        />

        <Text style={styles.label}>Terms Of Payment</Text>
        <TextInput
          placeholder="Terms Of Payment"
          style={styles.input}
          value={termsOfPayment}
          onChangeText={setTermsOfPayment}
          placeholderTextColor="#ccc"
        />

        <Text style={styles.label}>Delivery Terms</Text>
        <TextInput
          placeholder="Delivery Terms"
          style={styles.input}
          value={deliveryTerms}
          onChangeText={setDeliveryTerms}
          placeholderTextColor="#ccc"
        />

        <Text style={styles.label}>Port Of Discharge</Text>
        <TextInput
          placeholder="Port Of Discharge"
          style={styles.input}
          value={portOfDischarge}
          onChangeText={setPortOfDischarge}
          placeholderTextColor="#ccc"
        />

        <Text style={styles.label}>Final Destination</Text>
        <TextInput
          placeholder="Final Destination"
          style={styles.input}
          value={finalDestination}
          onChangeText={setFinalDestination}
          placeholderTextColor="#ccc"
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleAddClient}
          >
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 15,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#F7F7F7',
    marginBottom: 12,
    color: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  primaryButton: {
    backgroundColor: '#007BFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreateClient;
