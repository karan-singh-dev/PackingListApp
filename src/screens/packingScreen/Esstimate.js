import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import * as ExcelJS from 'exceljs';
import RNFS from 'react-native-fs';
import API from '../../components/API';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const windowHeight = Dimensions.get('window').height;

const Estimate = ({ navigation }) => {
  const selectedClient = useSelector((state) => state?.clientData?.selectedClient);

  if (!selectedClient) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.heading}>Please select a client first.</Text>
      </View>
    );
  }

  const marka = selectedClient.marka;
  const client = selectedClient.client_name;

  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDataFromAPI = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/asstimate/`, { params: { client_name: client, marka } });
      const data = response.data;
console.log("Fetched Estimate Data:", data);
      if (!Array.isArray(data) || data.length === 0) {
        setHeaders([]);
        setRows([]);
        return;
      }

      const extractedHeaders = Object.keys(data[0]).filter(key => key !== 'id' && key !== 'client');
      const extractedRows = data.map(item => extractedHeaders.map(key => item[key] ?? ''));

      setHeaders(extractedHeaders);
      setRows(extractedRows);
    } catch (error) {
      console.error('API Fetch Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Could not fetch estimate data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFromEstimate = async () => {
    try {
      setLoading(true);
      const res = await API.post('/api/packing/packing/copy-from-estimate/', { client, marka });
      if (res.status === 200) navigation.navigate('RowPackingList');
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error copying from estimate:", error.response?.data || error.message);
      Alert.alert('Error', 'Could not copy from estimate');
    }
  };

  const downloadEstimateExcel = async (estimateData) => {
    try {
      setLoading(true);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Estimate');

      const headersRow = Object.keys(estimateData[0] || {}).map(k => k.toUpperCase());
      worksheet.addRow(headersRow).font = { bold: true };
      worksheet.getRow(1).alignment = { horizontal: 'center' };

      estimateData.forEach(row => worksheet.addRow(Object.values(row)));

      worksheet.columns.forEach(col => {
        let maxLength = 10;
        col.eachCell({ includeEmpty: true }, cell => {
          const val = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, val.length);
        });
        col.width = maxLength + 2;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const binary = String.fromCharCode(...new Uint8Array(buffer));
      const base64 = global.btoa(binary);

      const filename = `Estimate_${Date.now()}.xlsx`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${filename}`;
      await RNFS.writeFile(filePath, base64, 'base64');
      Alert.alert("Download Successful", `Estimate saved to:\n${filePath}`);
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Download Failed", `Error: ${error.message}`);
    } finally { setLoading(false); }
  };

  const getEstimateDataObjects = () => {
    if (!headers.length || !rows.length) return [];
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => { obj[header] = row[index]; });
      return obj;
    });
  };

  useFocusEffect(useCallback(() => { fetchDataFromAPI(); }, [client, marka]));

  const renderRow = ({ item, index }) => (
    <View style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
      <View style={[styles.cellWrapper, { borderRightWidth: 0 }]}>
        <Text style={styles.cellText}>{index + 1}</Text>
      </View>
      {item.map((cell, i) => (
        <View
          key={i}
          style={[
            styles.cellWrapper,
            i === item.length - 1 ? { borderRightWidth: 0 } : null, // remove border for last cell
          ]}
        >
          <Text style={styles.cellText}>{cell}</Text>
        </View>
      ))}
    </View>
  );


  return (
    <LinearGradient colors={['#012B4B', '#004C8C']} style={styles.container}>
      {headers.length > 0 ? (
        <>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
              <Icon name="menu" size={30} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Estimate List</Text>
            </View>
          </View>

          <ScrollView horizontal>
            <View style={styles.tableCard}>
              <View style={styles.tableRowHeader}>
                <View style={[styles.cellWrapper, { flex: 0.5 }]}>
                  <Text style={styles.headerText}>Sr No.</Text>
                </View>
                {headers.map((header, index) => (
                  <View
                    key={index}
                    style={[
                      styles.cellWrapper,
                      index === headers.length - 1 ? { borderRightWidth: 0 } : null, // remove border for last header
                    ]}
                  >
                    <Text style={styles.headerText}>{header}</Text>
                  </View>
                ))}
              </View>

              <FlatList
                data={rows}
                renderItem={renderRow}
                keyExtractor={(_, index) => index.toString()}
                style={{ maxHeight: windowHeight * 0.75 }}
                showsVerticalScrollIndicator={true}
              />
            </View>
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => {
                const data = getEstimateDataObjects();
                if (!data.length) return Alert.alert("No Data", "No estimate data to download.");
                downloadEstimateExcel(data);
              }}
            >
              <Text style={styles.buttonText}>Download Estimate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.downloadButton, { backgroundColor: '#ff512f' }]} onPress={handleCopyFromEstimate}>
              <Text style={styles.buttonText}>Start Packing</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.centerMessageContainer}>
          <Text style={styles.heading}>No Estimate Data Found</Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ marginTop: 10, color: '#fff' }}>Please wait...</Text>
        </View>
      )}
    </LinearGradient>
  );
};

export default Estimate;

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 20, paddingHorizontal: 10, marginBottom: 10 },
  menuButton: { marginRight: 10 },
  heading: { fontSize: 22, fontWeight: 'bold', flex: 1, textAlign: 'center', color: '#fff' },
  tableCard: { backgroundColor: '#fff', borderRadius: 12, margin: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  tableRowHeader: { flexDirection: 'row', backgroundColor: '#2196F3', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  tableRow: { flexDirection: 'row' },
  cellWrapper: { width: 120, padding: 10, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  rowEven: { backgroundColor: '#f9f9f9' },
  rowOdd: { backgroundColor: '#e6f2ff' },
  headerText: { fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  cellText: { color: '#333', textAlign: 'center' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20, paddingHorizontal: 10 },
  downloadButton: { flex: 1, marginHorizontal: 5, padding: 12, borderRadius: 8, backgroundColor: '#28a745', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  centerMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,50,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
});
