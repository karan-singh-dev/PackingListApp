import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Modal, StyleSheet, Alert, ScrollView, TouchableOpacity,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import {
  fetchClients, addClientAsync, deleteClientAsync, setSelectedClient,
} from '../../redux/ClientDataSlice';
import API from './API';
import { resetNextCaseNumberToOne, setNextCaseNumber } from '../../redux/PackigListSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const generateKey = (client) => `${client.client_name}_${client.country}`;

const CreateClient = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { clients, loading, error } = useSelector((state) => state.clientData);
  const [selectedClientKey, setSelectedClientKey] = useState(null);
  const [modalVisible, setModalVisible] = useState(true);
  const [clientName, setClientName] = useState('');
  const [clientCountry, setClientCountry] = useState('');
  const [clientMArka, setClientMArka] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmClientName, setConfirmClientName] = useState('');

//   useEffect(() => {
//     setModalVisible(true)
//   }, [dispatch]);

  const handleAddClient = async () => {
    if (!clientName.trim() || !clientCountry.trim() || !clientMArka.trim()) {
      Alert.alert('Validation Error', 'All fields are required');
      return;
    }

    const newClient = {
      client_name: clientName.trim(),
      country: clientCountry.trim(),
      marka: clientMArka.trim(),
    };

    try {
      await dispatch(addClientAsync(newClient)).unwrap();

const newClientKey = generateKey(newClient);
    setSelectedClientKey(newClientKey); // ✅ This sets the new client as selected


      Alert.alert('Success', 'Client added successfully');
      setClientName('');
      setClientCountry('');
      setClientMArka('');
      setModalVisible(false);
    } catch (err) {
      console.error("Add client error:", err);
      Alert.alert('Error', err?.message || 'Failed to add client');
    }
  };




 



  const selectedClientData = clients.find(c => generateKey(c) === selectedClientKey);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
     
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>ADD A NEW CLIENT</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
       

        {selectedClientData && (
          <View style={styles.clientCard}>
            <View style={styles.clientRow}>
              <Icon name="account" size={25} color="#333" />
              <Text style={styles.clientText}>Name: {selectedClientData.client_name}</Text>
            </View>
            <View style={styles.clientRow}>
              <Icon name="earth" size={25} color="#333" />
              <Text style={styles.clientText}>Country: {selectedClientData.country}</Text>
            </View>
            <View style={styles.clientRow}>
              <Icon name="tag" size={25} color="#333" />
              <Text style={styles.clientText}>Marka: {selectedClientData.marka}</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                navigation.goBack() 
                             
              }}
            >
              <Text style={styles.primaryButtonText}>
                GO WITH {selectedClientData.client_name.toUpperCase()} ({selectedClientData.marka.toUpperCase()})
              </Text>
            </TouchableOpacity>

           
          </View>
        )}
      </ScrollView>
      {/* Add Client Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Client</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              placeholder="Client Name"
              style={styles.input}
              value={clientName}
              onChangeText={setClientName}
              placeholderTextColor={'#ccc'}
            />
            <Text style={styles.label}>Mark</Text>
            <TextInput
              placeholder="Marka"
              style={styles.input}
              value={clientMArka}
              onChangeText={setClientMArka}
              placeholderTextColor={'#ccc'}
            />
            <Text style={styles.label}>Country</Text>
            <TextInput
              placeholder="Country"
              style={styles.input}
              value={clientCountry}
              onChangeText={setClientCountry}
              placeholderTextColor={'#ccc'}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleAddClient}>
              <Text style={styles.primaryButtonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => navigation.goBack()}>
              <Text style={styles.deleteButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#012B4B',
  },
  headerContainer:{
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  menuButton: {
    marginLeft: 15
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff"
  },
  scrollContent: {
    paddingBottom: 40,
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
  primaryButton: {
    backgroundColor: '#007BFF',
    borderRadius: 6,
    paddingVertical: 15,
    marginTop: 10,
    alignItems: 'center',
    marginBottom: 10
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    paddingVertical: 12,
    marginTop: 10,
    alignItems: 'center',
    marginBottom: 10
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clientCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    elevation: 3,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  clientText: {
    fontSize: 18,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#222',
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
  errorText: {
    color: 'red',
    marginTop: 5,
  },
});

export default CreateClient;
