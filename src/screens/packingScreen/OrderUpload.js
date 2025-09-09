import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import * as ExcelJS from 'exceljs';
import RNFS from 'react-native-fs';
import API from '../../components/API';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Checklist from '../../components/Checklist';
import LinearGradient from 'react-native-linear-gradient';

const OrderUpload = ({ navigation }) => {
  const { height: windowHeight } = useWindowDimensions();
  const selectedClient = useSelector((state) => state?.clientData?.selectedClient);
  const marka = selectedClient?.marka;
  const client = selectedClient?.client_name;
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [proceeded, setProceeded] = useState(false);
  const [success, setSuccess] = useState(false);

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
      const binaryString = atob(b64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      const buffer = bytes.buffer;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) return Alert.alert('Error', 'No worksheet found');
      const headerRow = worksheet.getRow(1).values.slice(1);
      const rowData = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowValues = row.values.slice(1).map(v => {
          if (v == null) return '';
          if (typeof v === 'object') {
            if ('result' in v) return v.result;
            return '';
          }
          return v;
        });
        rowData.push(rowValues);
      });
      if (rowData.length === 0) return Alert.alert('No data found in file');
      setHeaders(headerRow);
      setRows(rowData);
    } catch (err) {
      console.error('Error reading file with ExcelJS:', err);
      Alert.alert('Error', 'Could not read or parse file');
    } finally {
      setLoading(false);
    }
  };

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
      console.log("Form Data:", formData);
      const response = await API.post('/api/orderitem/upload-excel/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log("Upload Response:", response.data);
      if (response.status === 200) {
        Alert.alert('Success', 'File uploaded successfully!');
        setSuccess(true);
      } else {
        setSuccess(false);
        Alert.alert('Error', 'File upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      Alert.alert('Error', 'Could not upload file');
    } finally {
      setLoading(false);
    }
  };

  const generateEstimate = async () => {
    if (!success) {
      Alert.alert('File not uploaded');
      return;
    }
    try {
      setLoading(true);
      const res =await API.post('/api/asstimate/genrate/', {
                      client_name: client,
                      marka: marka
                  });
      console.log("Estimate Response:", res.data);
      if (res.status === 200) {
        setProceeded(false);
        setSuccess(false);
        setHeaders([]);
        setRows([]);
        setSelectedFile(null);
        if (res.data?.missing_data && res.data.missing_data.length > 0) {
          const missing = Array.isArray(res.data.missing_data)
            ? res.data.missing_data.join('\n')
            : String(res.data.missing_data);
          Alert.alert(
            null,
            `The part number mentioned below is no longer serviceable.\n\nPlease note this part no.\n${missing}`
          );
        }
        navigation.navigate('Estimate');
      } else {
        Alert.alert('Error', 'Failed to generate estimate');
      }
    } catch (error) {
      console.error('Estimate error:', error);
      Alert.alert('Error', 'Could not generate estimate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#012B4B', '#004C8C']} style={styles.container}>
      {!proceeded ? (
        <Checklist name={['part_no', 'description', 'qty']} onProceed={() => setProceeded(true)} />
      ) : (
        <>
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
              <Icon name="menu" size={30} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Upload Order</Text>
            </View>
          </View>

          {/* Pick Prompt */}
          {!selectedFile && (
            <View style={styles.centerMessageContainer}>
              <Text style={styles.subtext}>Pick a file to update Order</Text>
            </View>
          )}

          {/* Table */}
          {headers.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tableCard}>
                <View style={styles.tableRowHeader}>
                  {headers.map((header, index) => (
                    <View key={index} style={styles.cellWrapper}>
                      <Text style={styles.headerText}>{header}</Text>
                    </View>
                  ))}
                </View>
                <FlatList
                  data={rows}
                  keyExtractor={(_, index) => `row-${index}`}
                  style={{ maxHeight: windowHeight * 0.75 }}
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
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleFilePick} disabled={loading}>
              <LinearGradient colors={['#007bff', '#0056b3']} style={styles.gradientBtn}>
                <Text style={styles.buttonText}>Pick Order File</Text>
              </LinearGradient>
            </TouchableOpacity>

            {selectedFile &&
              (!success ? (
                <TouchableOpacity style={styles.button} onPress={handleUpload} disabled={loading}>
                  <LinearGradient colors={['#28a745', '#1e7e34']} style={styles.gradientBtn}>
                    <Text style={styles.buttonText}>Upload File</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.button} onPress={generateEstimate}>
                  <LinearGradient colors={['#ff512f', '#dd2476']} style={styles.gradientBtn}>
                    <Text style={styles.buttonText}>Generate Estimate</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
          </View>

          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={{ marginTop: 10, color: '#fff' }}>Please wait...</Text>
            </View>
          )}
        </>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    color: '#fff',
  },
  subtext: { fontSize: 16, color: '#ddd', textAlign: 'center' },
  centerMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  tableRowHeader: { flexDirection: 'row', backgroundColor: '#2196F3', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  tableRow: { flexDirection: 'row' },
  cellWrapper: { width: 150, padding: 10, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  rowEven: { backgroundColor: '#f9f9f9' },
  rowOdd: { backgroundColor: '#e6f2ff' },
  headerText: { fontWeight: 'bold', color: '#fff', fontSize: 12, textAlign: 'center' },
  cellText: { fontSize: 12, color: '#333', textAlign: 'center' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20, paddingHorizontal: 10 },
  button: { flex: 1, marginHorizontal: 5, borderRadius: 8, overflow: 'hidden' },
  gradientBtn: { padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,50,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 999,
  },
});

export default OrderUpload;
