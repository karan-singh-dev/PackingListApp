import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { addClientAsync } from '../redux/slices/ClientDataSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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
  const [selectedGSTs, setSelectedGSTs] = useState([]);
  const [gstValue, setGstValue] = useState(null);
  const [rupees, setRupees] = useState(0);


  const gstOptions = [
    { label: '5%', value: '5' },
    { label: '12%', value: '12' },
    { label: '18%', value: '18' },
    { label: '28%', value: '28' },
  ];

  const handleGstSelect = (value) => {
    const alreadySelected = selectedGSTs.find(item => item.gst === value);
    if (!alreadySelected) {
      setSelectedGSTs([...selectedGSTs, { gst: value, discount: '' }]);
    }
    setGstValue(null);
  };


  const handleDiscountChange = (index, value) => {
    const updated = [...selectedGSTs];
    updated[index].discount = value;
    setSelectedGSTs(updated);
  };

  const handleRemoveGst = (index) => {
    const updated = [...selectedGSTs];
    updated.splice(index, 1);
    setSelectedGSTs(updated);
  };


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
      gst: selectedGSTs,
      rupees: parseInt(rupees)
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
          <Text style={styles.label}>Add GST details</Text>
        {selectedGSTs.map((item, index) => (
          <View key={index} style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text>Gst </Text>
              <TextInput
                style={[styles.gstinput]}
                value={item.gst}
                editable={false}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text>Discount</Text>
              <TextInput
                style={[styles.gstinput,]}
                placeholder="Discount %"
                keyboardType="numeric"
                placeholderTextColor={'#8a8686ff'}
                value={item.discount}
                onChangeText={(text) => handleDiscountChange(index, text)}
              />
            </View>
            <View style={{ justifyContent: 'center', marginTop: 20 }}>
              <TouchableOpacity onPress={() => handleRemoveGst(index)} style={styles.removeIcon}>
                <Icon name="close-circle" size={24} color="#dc3545" />
              </TouchableOpacity>
            </View>
          </View>
        ))}


        <View style={{}}>
        
          <Dropdown
            style={styles.dropdown}
            data={gstOptions.filter(opt => !selectedGSTs.some(sel => sel.gst === opt.value))}
            labelField="label"
            valueField="value"
            placeholder="Add Tax & Discount Detail  +"
            
            value={gstValue}
            onChange={(item) => handleGstSelect(item.value)}
            renderRightIcon={() => null}
          />
        </View>
        <View style={styles.dollarmain}>
          <Text style={[styles.modalheading]}>Conversion Rate</Text>
          <View style={styles.dollarBox}>
            <Text style={{ fontSize: 16 }}>1 Dollar($) :</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={rupees}
              placeholder='Rupees (₹)'
              placeholderTextColor={'#6e6d6dff'}
              keyboardType="numeric"
              onChangeText={(text) => setRupees(text)}
            />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleAddClient}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
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

  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  dropdown: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 20,
    width:'65%'

  },
  gstinput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
  },
  removeIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  modalheading: {
    fontSize: 16,
    fontWeight: '600',
  },
  dollarBox: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
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
