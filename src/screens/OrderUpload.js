import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
  FlatList
} from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import API from '../components/API';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';

const OrderUpload = ({ navigation }) => {
  const { height: windowHeight } = useWindowDimensions();
  const selectedClient = useSelector((state) => state.clientData.selectedClient);

  if (!selectedClient) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Please select a client first.</Text>
      </View>
    );
  }

  const marka = selectedClient.marka;
  const client = selectedClient.client_name;

  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFilePick = async () => {
    try {
      setLoading(true);
      const res = await pick({
        allowMultiSelection: false,
        type: [types.xlsx, types.xls],
      });

      if (!res || !res[0]) {
        Alert.alert('No file selected');
        return;
      }

      const file = res[0];
      setSelectedFile(file);
      const filePath = file.uri.replace('file://', '');
      const b64 = await RNFS.readFile(filePath, 'base64');

      const wb = XLSX.read(b64, { type: 'base64' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (data.length === 0) {
        Alert.alert('No data found in file');
        return;
      }

      console.log(data.length, 'rows read from excel');

      const headerRow = Object.keys(data[0]);
      const rowData = data.map(obj => headerRow.map(key => obj[key] ?? ''));

      setHeaders(headerRow);
      setRows(rowData);
    } catch (err) {
      console.error('Error reading file:', err);
      Alert.alert('Error', 'Could not read or parse file');
    } finally {
      setLoading(false);
    }
  };


  useFocusEffect(
    useCallback(() => {
      handleFilePick();
    }, [client, marka])
  );

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Select file first');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      });
      formData.append('client_name', client);
      formData.append('marka', marka);

      const response = await API.post('/api/orderitem/upload-excel/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        console.log('Upload success:', response.data);
        Alert.alert('Success', 'File uploaded successfully!');
        await generateEstimate();
        setHeaders([]);
        setRows([]);
        setSelectedFile(null);
      } else {
        Alert.alert('Error', 'File upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      Alert.alert('Error', 'Could not upload file');
    } finally {
      setLoading(false); // Hide loader after upload finishes
    }
  };

  const generateEstimate = async () => {
    try {
      const res = await API.post('/api/asstimate/genrate/', {
        client_name: client,
        marka: marka,
      });

      if (res.status === 200) {
        console.log(res.data.message || 'Items merged successfully');
        navigation.navigate('Esstimate');
      } else {
        console.log('Failed to generate estimate');
        Alert.alert('Error', 'Failed to generate estimate');
      }
    } catch (error) {
      console.error('Estimate error:', error);
      Alert.alert('Error', 'Could not generate estimate');
    }
  };

  return (
    <View style={styles.container}>
      {headers.length > 0 && (
        <>
          <Text style={styles.title}>ORDER LIST</Text>

          <ScrollView horizontal>
            <View>
              {/* Table Header */}
              <View style={styles.tableRowHeader}>
                {headers.map((header, index) => (
                  <View key={index} style={styles.cellWrapper}>
                    <Text style={styles.headerText}>{header}</Text>
                  </View>
                ))}
              </View>

              {/* FlatList for rows */}
              <FlatList
                data={rows}
                keyExtractor={(_, index) => `row-${index}`}
                style={{ maxHeight: windowHeight * 0.9 }}
                renderItem={({ item: row, index: rowIndex }) => (
                  <View
                    style={[
                      styles.tableRow,
                      rowIndex % 2 === 0 ? styles.rowEven : styles.rowOdd,
                    ]}
                  >
                    {row.map((cell, cellIndex) => (
                      <View key={cellIndex} style={styles.cellWrapper}>
                        <Text style={styles.cellText}>{cell}</Text>
                      </View>
                    ))}
                  </View>
                )}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            disabled={loading}
          >
            <Text style={styles.uploadButtonText}>Upload Order</Text>
          </TouchableOpacity>
        </>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ marginTop: 10, color: '#fff' }}>Please wait...</Text>
        </View>
      )}
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 20,
    textAlign: 'center',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
  },
  tableRow: {
    flexDirection: 'row',
  },
  cellWrapper: {
    width: 150,
    padding: 10,
    borderRightWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowEven: {
    backgroundColor: '#f9f9f9',
  },
  rowOdd: {
    backgroundColor: '#e6f2ff',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  cellText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  uploadButton: {
    margin: 16,
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});

export default OrderUpload;
