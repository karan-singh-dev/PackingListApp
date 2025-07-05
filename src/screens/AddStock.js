import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import { useSelector } from 'react-redux';
import API from '../components/API'; // <-- Your centralized axios instance

const AddStock = ({ navigation }) => {
  const { height: windowHeight } = useWindowDimensions();
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const marka = selectedClient?.marka || '';
  const client = selectedClient?.client_name || '';

  const handleFilePick = async () => {
    try {
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
      const data = XLSX.utils.sheet_to_json(ws);

      if (data.length === 0) {
        Alert.alert('No data found in file');
        return;
      }

      const headerRow = Object.keys(data[0]);
      const rowData = data.map(obj => headerRow.map(key => obj[key] ?? ''));

      setHeaders(headerRow);
      setRows(rowData);
    } catch (err) {
      console.error('Error reading file:', err);
      Alert.alert('Error', 'Could not read or parse file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Select file first');
      return;
    }

    if (!API.defaults.baseURL) {
      Alert.alert("Configuration Error", "API endpoint is not configured properly.");
      return;
    }

    try {
      setLoading(true);
      console.log("Stock upload start");

      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      });
      formData.append('client_name', client);
      formData.append('marka', marka);

      const uploadResponse = await API.post('/api/packing/stock/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Upload response:', uploadResponse?.data);

      Alert.alert("Success", "Stock Excel uploaded successfully");

      try {
        await API.post('/api/packing/packing/sync-stock/');
        Alert.alert("Success", "Stock quantities synced.");
        setHeaders([]);
        setRows([]);
        setSelectedFile(null);
        navigation.navigate("StockList");
      } catch (syncError) {
        console.error("Sync error:", syncError);
        Alert.alert("Sync Failed", syncError.response?.data?.error || syncError.message);
      }
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      Alert.alert(
        "Upload Failed",
        uploadError.response?.data?.error ||
        uploadError.response?.data?.detail ||
        uploadError.message ||
        "An unknown error occurred during upload."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>


      {headers.length > 0 && (
        <>
          <Text style={styles.title}>STOCK LIST</Text>

          <ScrollView horizontal>
            <View>
              <View style={styles.tableRowHeader}>
                {headers.map((header, index) => (
                  <View key={index} style={styles.cellWrapper}>
                    <Text style={styles.headerText}>{header}</Text>
                  </View>
                ))}
              </View>

              <FlatList
                data={rows}
                keyExtractor={(_, index) => index.toString()}
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

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.pickButton, styles.buttonFlex]} onPress={handleFilePick}>
              <Text style={styles.pickButtonText}>Pick File</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadButton, styles.buttonFlex]}
              onPress={handleUpload}
              disabled={loading}
            >
              <Text style={styles.uploadButtonText}>Upload Stock</Text>
            </TouchableOpacity>
          </View>
        </>
      )}


      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ marginTop: 10, color: '#fff' }}>Uploading...</Text>
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
  pickButton: {
    margin: 16,
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: '#007bff',
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
  buttonRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 16,
    gap: 12, // requires RN 0.71+; remove if unsupported and use marginRight on left button
  },
  buttonFlex: {
    flex: 1,
  },

});

export default AddStock;
