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
  Modal,
  TextInput
} from 'react-native';
import { pick, types } from '@react-native-documents/picker';

import * as ExcelJS from 'exceljs';
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
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const [partNo, setPartNo] = useState('');
  const [description, setDescription] = useState('');
  const [qty, setQty] = useState('');
  const [brandName, setBrandName] = useState('');

  const selectedClient = useSelector((state) => state?.clientData?.selectedClient);
  const marka = selectedClient?.marka || '';
  const client = selectedClient?.client_name || '';
  const client_id = selectedClient?.id || '';

  const resetSingleStockInputs = () => {
    setPartNo('');
    setDescription('');
    setQty('');
    setBrandName('');
  };

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

      const binaryString = atob(b64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const buffer = bytes.buffer;

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) return Alert.alert('Error', 'No worksheet found');

      const headerRow = worksheet.getRow(1).values.slice(1);
      const rowData = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowValues = row.values.slice(1).map(v => (v != null ? v : ''));
        rowData.push(rowValues);
      });
      if (rowData.length === 0) return Alert.alert('No data found in file');

      

      setHeaders(headerRow);
      setRows(rowData);
    } catch (err) {
      console.error('Error reading file with ExcelJS:', err);
      Alert.alert('Error', 'Could not read or parse file');
    }
  };

const handleStockUpload = async () => {
  try {
    setLoading(true);
    const formData = new FormData();

    formData.append("client_id", String(client_id));

    let endpoint = "";

    if (selectedFile) {
      // File upload case
      formData.append("file", {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || "application/octet-stream",
      });
      endpoint = "/api/packing/stock/upload/";
    } else {
      // Single upload case
      formData.append("part_no", String(partNo));
      formData.append("description", String(description));
      formData.append("qty", String(qty));
      formData.append("brand_name", String(brandName));
      endpoint = "/api/packing/stock/upload-single/";
    }

    // Debug log
    for (let pair of formData._parts) {
      console.log(pair[0] + ": " + pair[1]);
    }

    // Upload
    await API.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Sync after upload
    await API.post("/api/packing/packing/sync-stock/");

    Alert.alert("Success", "Stock uploaded and synced");

    // Reset states
    setHeaders([]);
    setRows([]);
    setSelectedFile(null);
    setShowSingleModal(false);
    resetSingleStockInputs();

    navigation.navigate("StockList");
  } catch (err) {
    console.error("Upload error:", err.response?.data || err.message);
    Alert.alert(
      "Upload Failed",
      err.response?.data?.error || err.response?.data?.message || err.message
    );
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
      {showChecklist ? (
        <Checklist
          name={['part_no','description','qty','brand_name']}
          onProceed={() => { setShowChecklist(false); handleFilePick(); }}
        />
      ) : (
        <>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
              <Icon name="menu" size={30} color="#000" />
            </TouchableOpacity>
            <Text style={styles.heading}>Upload Stock</Text>
          </View>

          {!selectedFile && (
            <View style={styles.centerMessageContainer}>
              <Text style={styles.subtext}>Pick a file or use Single Stock Update</Text>
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
                  contentContainerStyle={{ paddingBottom: 100 }}
                />
              </View>
            </ScrollView>
          )}

          <View style={styles.bottomBar}>
            {!selectedFile && (
              <>
                <TouchableOpacity style={styles.pickButton} onPress={() => setShowSingleModal(true)}>
                  <Text style={styles.pickButtonText}>Single Stock</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadButton} onPress={() => setShowChecklist(true)}>
                  <Text style={styles.uploadButtonText}>Pick File</Text>
                </TouchableOpacity>
              </>
            )}

            {headers.length > 0 && (
              <TouchableOpacity style={styles.uploadButton} onPress={handleStockUpload} disabled={loading}>
                <Text style={styles.uploadButtonText}>Upload Stock</Text>
              </TouchableOpacity>
            )}
          </View>

          <Modal visible={showSingleModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalheading}>Stock Details</Text>
                <Text style={styles.label}>Part No</Text>
                <TextInput style={styles.input} placeholder="Enter Part No" value={partNo} onChangeText={setPartNo} />

                <Text style={styles.label}>Description</Text>
                <TextInput style={styles.input} placeholder="Enter Description" value={description} onChangeText={setDescription} />

                <Text style={styles.label}>Quantity</Text>
                <TextInput style={styles.input} placeholder="Enter Quantity" keyboardType="numeric" value={qty} onChangeText={setQty} />

                <Text style={styles.label}>Brand Name</Text>
                <TextInput style={styles.input} placeholder="Enter Brand Name" value={brandName} onChangeText={setBrandName} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                  <TouchableOpacity onPress={() => { setShowSingleModal(false); resetSingleStockInputs(); }}>
                    <Text style={{ color: 'red', fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={ handleStockUpload }>
                    <Text style={{ color: 'green', fontWeight: 'bold' }}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={{ marginTop: 10, color: '#fff' }}>Uploading...</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 20, paddingHorizontal: 10, marginBottom: 10 },
  menuButton: { marginRight: 10 },
  heading: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', flex: 1, color: '#333' },
  subtext: { fontSize: 16, color: '#666', textAlign: 'center' },
  centerMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tableRowHeader: { flexDirection: 'row', backgroundColor: '#2196F3' },
  tableRow: { flexDirection: 'row' },
  cellWrapper: { width: 150, padding: 10, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  rowEven: { backgroundColor: '#f9f9f9' },
  rowOdd: { backgroundColor: '#e6f2ff' },
  headerText: { fontWeight: 'bold', color: '#fff', fontSize: 12, textAlign: 'center' },
  cellText: { fontSize: 12, color: '#333', textAlign: 'center' },
  bottomBar: { flexDirection: 'row', padding: 16, justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fff', position: 'absolute', bottom: 0, left: 0, right: 0 },
  pickButton: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  uploadButton: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, flex: 1, marginLeft: 8, alignItems: 'center' },
  pickButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  uploadButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  input: { borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, marginTop: 5 },
  modalheading: { marginBottom: 10, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  label: { marginTop: 10, fontSize: 14, fontWeight: '500', color: '#333' }
});

export default AddStock;
