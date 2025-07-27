import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, Modal, StyleSheet, Alert, ScrollView, TouchableOpacity,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  fetchClients, addClientAsync, deleteClientAsync, setSelectedClient,
} from '../../redux/ClientDataSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const generateKey = (client) => `${client.client_name}_${client.country}`;

const ClientSelection = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { clients, loading, error } = useSelector((state) => state.clientData);
  const [selectedClientKey, setSelectedClientKey] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientCountry, setClientCountry] = useState('');
  const [clientMArka, setClientMArka] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmClientName, setConfirmClientName] = useState('');


  useFocusEffect(
    useCallback(() => {
      dispatch(fetchClients());
      console.log('clients', clients);


    }, [dispatch])
  );
 console.log('clients', clients);

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

  const handleDeleteClient = async () => {
    if (!selectedClientData) return;

    if (confirmClientName.toLowerCase().trim() !== selectedClientData.client_name.toLowerCase().trim()) {
      Alert.alert('Error', 'Client name does not match.');
      return;
    }

    try {
      await dispatch(deleteClientAsync(selectedClientData.id)).unwrap();
      Alert.alert('Deleted', 'Client deleted successfully');
      setDeleteModalVisible(false);    // ✅ close modal BEFORE clearing selected
      setConfirmClientName('');
      setSelectedClientKey(null);
      dispatch(setSelectedClient(null));
    } catch (err) {
      console.error("Delete client error:", err);
      Alert.alert('Error', err?.message || 'Failed to delete client');
      setDeleteModalVisible(false);    // ✅ also close modal on error
      setConfirmClientName('');
    }
  };



  const handleClientSelection = (clientKey) => {
    setSelectedClientKey(clientKey);
    const selected = clients.find(c => generateKey(c) === clientKey);


  };

  const selectedClientData = clients.find(c => generateKey(c) === selectedClientKey);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>

        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Client Details</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.label, { color: '#fff' }]}>Clients:</Text>

        <Dropdown
          data={clients.map((c) => ({
            label: `${c.client_name} (${c.marka})`,
            value: generateKey(c),
          }))}
          labelField="label"
          valueField="value"
          placeholder={loading ? 'Loading...' : 'Select client'}
          value={selectedClientKey}
          onChange={(item) => handleClientSelection(item.value)}
          style={styles.dropdown}
          disable={loading}
          keyExtractor={(item) => item.value}
          textStyle={{ color: '#000' }}
          selectedTextStyle={{ color: '#000' }}
          placeholderStyle={{ color: '#000' }}
          itemTextStyle={{ color: '#000' }}
        />

        {error && <Text style={styles.errorText}>Error: {error}</Text>}
        {!loading && clients.length === 0 && (
          <Text style={styles.errorText}>No clients found. Add one to start.</Text>
        )}



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
                dispatch(setSelectedClient(selectedClientData));

              }}
            >
              <Text style={styles.primaryButtonText}>
                GO WITH {selectedClientData.client_name.toUpperCase()} ({selectedClientData.marka.toUpperCase()})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={() => setDeleteModalVisible(true)}>
              <Text style={styles.deleteButtonText}>DELETE CLIENT</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Delete Modal */}
      {/* Delete Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedClientData ? (
              <>
                <Text style={styles.modalTitle}>Confirm Deletion</Text>
                <Text style={{ marginBottom: 10, color: '#000' }}>
                  Type "{selectedClientData.client_name}" to confirm deletion.
                </Text>
                <TextInput
                  placeholder="Client Name"
                  placeholderTextColor="#ccc"
                  style={styles.input}
                  value={confirmClientName}
                  onChangeText={setConfirmClientName}
                />
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteClient}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={() => setDeleteModalVisible(false)}>
                  <Text style={styles.primaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View>
                <Text style={styles.modalTitle}>No client selected.</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => setDeleteModalVisible(false)}>
                  <Text style={styles.primaryButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
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
  headerContainer: {
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

export default ClientSelection;
