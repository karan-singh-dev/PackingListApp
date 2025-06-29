import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import { API } from '@env'; // Ensure API is correctly configured
import axios from 'axios';
import { useSelector } from 'react-redux';

const AddStock = ({ navigation }) => {
  const { height: windowHeight } = useWindowDimensions();
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  selectedClient = useSelector((state) => state.clientData.selectedClient);
  const marka = selectedClient.marka;
  const client = selectedClient.client_name
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
      console.error('Error:', err);
      Alert.alert('Error', 'Could not read or parse file');
    }
  };

  useEffect(() => {
    handleFilePick();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Select file first');
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
console.log(API,'API===============')
      const res = await axios.post(`${API}api/packing/stock/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log(res,'upload stock')
      Alert.alert("Success", "Stock Excel uploaded successfully");
console.log(API,'API===============')
      try {
        await axios.post(`${API}api/packing/packing/sync-stock/`);
        Alert.alert("Success", "Stock quantities synced.");
        navigation.navigate("StockList");
      } catch (error) {
        Alert.alert("Sync Failed", error.message);
      }

      setHeaders([]);
      setRows([]);
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload error", error);
      Alert.alert("Upload Failed", error.response?.data?.error || error.message);
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
              <ScrollView style={{ maxHeight: windowHeight * 0.5 }}>
                {rows.map((row, rowIndex) => (
                  <View
                    key={rowIndex}
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
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            disabled={loading}
          >
            <Text style={styles.uploadButtonText}>Upload Stock</Text>
          </TouchableOpacity>
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
});

export default AddStock;
