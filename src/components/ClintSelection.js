import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import {
  fetchClients,
  deleteClientAsync,
  setSelectedClient,
} from '../redux/slices/ClientDataSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const generateKey = (client) => `${client.client_name}_${client.country}`;

const ClientSelection = () => {
  const dispatch = useDispatch();

  const { clients, loading, error } = useSelector((state) => state.clientData);
  const [selectedClientKey, setSelectedClientKey] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmClientName, setConfirmClientName] = useState('');
 const user = useSelector((state) => state.userInfo.user);
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchClients());
    }, [dispatch])
  );

  const selectedClientData = clients.find(
    (c) => generateKey(c) === selectedClientKey
  );

  const handleDeleteClient = async () => {
    if (!selectedClientData) return;

    if (
      confirmClientName.toLowerCase().trim() !==
      selectedClientData.client_name.toLowerCase().trim()
    ) {
      Alert.alert('Error', 'Client name does not match.');
      return;
    }

    try {
      await dispatch(deleteClientAsync(selectedClientData.id)).unwrap();
      Alert.alert('Deleted', 'Client deleted successfully');
      setDeleteModalVisible(false);
      setConfirmClientName('');
      setSelectedClientKey(null);
      dispatch(setSelectedClient(null));
    } catch (err) {
      console.error('Delete client error:', err);
      Alert.alert('Error', err?.message || 'Failed to delete client');
      setDeleteModalVisible(false);
      setConfirmClientName('');
    }
  };

  const handleClientSelection = (clientKey) => {
    setSelectedClientKey(clientKey);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.heading}>Select Client</Text>

        {/* Dropdown */}
        <Text style={styles.label}>Clients:</Text>
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
          textStyle={{ color: '#000' }}
          selectedTextStyle={{ color: '#000' }}
          placeholderStyle={{ color: '#666' }}
          itemTextStyle={{ color: '#000' }}
          maxHeight={400}
          
        />

        {error && <Text style={styles.errorText}>Error: {error}</Text>}
        {!loading && clients.length === 0 && (
          <Text style={styles.errorText}>No clients found. Add one to start.</Text>
        )}

        {/* Client Card */}
        {selectedClientData && (
          <View style={styles.clientCard}>
            <View style={styles.clientRow}>
              <Icon name="account" size={22} color="#1E40AF" />
              <Text style={styles.clientText}>
                {selectedClientData.client_name}
              </Text>
            </View>
            <View style={styles.clientRow}>
              <Icon name="earth" size={22} color="#1E40AF" />
              <Text style={styles.clientText}>
                {selectedClientData.country}
              </Text>
            </View>
            <View style={styles.clientRow}>
              <Icon name="tag" size={22} color="#1E40AF" />
              <Text style={styles.clientText}>
                {selectedClientData.marka}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => dispatch(setSelectedClient(selectedClientData))}
            >
              <Text style={styles.primaryButtonText}>
                Continue with {selectedClientData.client_name}
              </Text>
            </TouchableOpacity>

            {user?.is_staff && <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setDeleteModalVisible(true)}
            >
              <Text style={styles.deleteButtonText}>Delete Client</Text>
            </TouchableOpacity>}
          </View>
        )}
      </ScrollView>

      {/* Delete Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedClientData ? (
              <>
                <Text style={styles.modalTitle}>Confirm Deletion</Text>
                <Text style={styles.modalMessage}>
                  Type "{selectedClientData.client_name}" to confirm deletion.
                </Text>
                <TextInput
                  placeholder="Client Name"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={confirmClientName}
                  onChangeText={setConfirmClientName}
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteClient}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View>
                <Text style={styles.modalTitle}>No client selected.</Text>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Close</Text>
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
    backgroundColor: '#012B4B', // solid dark blue
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#E5E7EB',
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 20,
    elevation: 4,
  },
  clientCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  clientText: {
    fontSize: 16,
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#FCA5A5',
    marginTop: 5,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827',
  },
  modalMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
    color: '#000',
  },
});

export default ClientSelection;
