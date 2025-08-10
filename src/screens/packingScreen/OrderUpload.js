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
import ExcelJS from 'exceljs';
import RNFS from 'react-native-fs';
import API from '../../components/API';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Checklist from '../../components/Checklist';

const OrderUpload = ({ navigation }) => {
  const { height: windowHeight } = useWindowDimensions();
  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const marka = selectedClient.marka;
  const client = selectedClient.client_name;
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

      // Convert file to base64
      const filePath = file.uri.replace('file://', '');
      const b64 = await RNFS.readFile(filePath, 'base64');

      // Convert base64 to ArrayBuffer
      const buffer = Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;

      // Load workbook using ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0]; // first sheet

      // Extract headers (first row) and data
      const headerRow = worksheet.getRow(1).values.slice(1); // skip index 0
      const rowData = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        const rowValues = row.values.slice(1); // skip first empty index
        rowData.push(rowValues);
      });
      console.log(rowData);

      setHeaders(headerRow);
      setRows(rowData);
    } catch (err) {
      console.error('Error reading file:', err);
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

      const response = await API.post('/api/orderitem/upload-excel/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        Alert.alert('Success', 'File uploaded successfully!');
        setSuccess(true)
      } else {
        setSuccess(false)
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
      Alert.alert('file not uploaded')
    }
    try {
      setLoading(true)
      const res = await API.post('/api/asstimate/genrate/', {
        client_name: client,
        marka: marka,
      });

      if (res.status === 200) {
        console.log('hello', res);

        setProceeded(false)
        setSuccess(false)
        setLoading(false)
        setHeaders([]);
        setRows([]);
        setSelectedFile(null);
        if (res.data?.missing_data && res.data.missing_data.length > 0) {
          setLoading(false)
          const missing = Array.isArray(res.data.missing_data)
            ? res.data.missing_data.join('\n') // each on new line
            : String(res.data.missing_data);

          Alert.alert(
            null,
            `The part number mentioned below is no longer serviceable.\n\nPlease note this part no.\n${missing}`
          );
        }
        navigation.navigate('Estimate');

      }
      else {
        setLoading(false)
        Alert.alert('Error', 'Failed to generate estimate');
      }
    } catch (error) {
      setLoading(false)
      console.error('Estimate error:', error);
      Alert.alert('Error', 'Could not generate estimate');
    }
  };

  return (
    (<View style={styles.container}>
      {!proceeded ? (<Checklist name={['part_no', 'description', 'qty']}
        onProceed={() => setProceeded(true)} />) : (<>
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
              <Icon name="menu" size={30} color="#000" />
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
            <>
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
            </>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.pickButton}
              onPress={handleFilePick}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Pick Order File</Text>
            </TouchableOpacity>

            {selectedFile && (
              !success ? (<TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUpload}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Upload File</Text>
              </TouchableOpacity>) : (<TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: '#e74d10ff' }]}
                onPress={generateEstimate}
              >
                <Text style={styles.uploadButtonText}>Generate Estimate</Text>
              </TouchableOpacity>
              )

            )}
          </View>

          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={{ marginTop: 10, color: '#fff' }}>Please wait...</Text>
            </View>
          )}
        </>)}
    </View>)
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 12,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  pickButton: {
    flex: 1,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
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
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 10,
    width: '40%'
  },
  input: {
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
    marginBottom: 10,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center'
  },
  dollarBox: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',

  },
  dollarmain: {
    borderTopColor: '#ccc',
    borderTopWidth: 1,
    marginTop: 20,
  },
  dollerMainHeading: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600'
  },
  pickButtonText: {
    padding: 10,
    borderRadius: 8,
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  }



});

export default OrderUpload;
