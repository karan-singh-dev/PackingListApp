import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import API from '../../components/API';
import Checklist from '../../components/Checklist';


const AddStock = ({ navigation }) => {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
    const [proceeded, setProceeded] = useState(false);

  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const marka = selectedClient?.marka || '';
  const client = selectedClient?.client_name || '';

  const handleFilePick = async () => {
    try {
      const res = await pick({
        allowMultiSelection: false,
        type: [types.xlsx, types.xls],
      });

      if (!res || !res[0]) return Alert.alert('No file selected');

      const file = res[0];
      setSelectedFile(file);

      const filePath = file.uri.replace('file://', '');
      const b64 = await RNFS.readFile(filePath, 'base64');
      const wb = XLSX.read(b64, { type: 'base64' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      if (data.length === 0) return Alert.alert('No data found in file');

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
    if (!selectedFile) return Alert.alert('Select file first');

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

      await API.post('/api/packing/stock/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await API.post('/api/packing/packing/sync-stock/');

      Alert.alert('Success', 'Stock uploaded and synced');
      setHeaders([]);
      setRows([]);
      setSelectedFile(null);
      setProceeded(false)
      navigation.navigate('StockList');
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRow = ({ item, index }) => (
    <View style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
      {item.map((cell, i) => (
        <View key={i} style={styles.cellWrapper}>
          <Text style={styles.cellText}>{cell}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {!proceeded ? (<Checklist name={['part_no','description','qty','brand_name']}
        onProceed={() => setProceeded(true)}/>) : (<><View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
          <Icon name="menu" size={30} color="#000" />
        </TouchableOpacity>
        <Text style={styles.heading}>Upload Stock</Text>
      </View>

     
      {!selectedFile && (
        <View style={styles.centerMessageContainer}>
          <Text style={styles.subtext}>Pick a file to update stock</Text>
        </View>
      )}

     
      {headers.length > 0 && (
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
              renderItem={renderRow}
              scrollEnabled={true}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          </View>
        </ScrollView>
      )}

     
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.pickButton} onPress={handleFilePick}>
          <Text style={styles.pickButtonText}>Pick File</Text>
        </TouchableOpacity>

        {headers.length > 0 && (
          <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={loading}>
            <Text style={styles.uploadButtonText}>Upload Stock</Text>
          </TouchableOpacity>
        )}
      </View>

      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ marginTop: 10, color: '#fff' }}>Uploading...</Text>
        </View>
      )}
      </>
)}
    </View>
  )
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  menuButton: { marginRight: 10 },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    color: '#333',
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  centerMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  rowEven: { backgroundColor: '#f9f9f9' },
  rowOdd: { backgroundColor: '#e6f2ff' },
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
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  pickButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  pickButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
