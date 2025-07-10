import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  PermissionsAndroid,
  FlatList,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import API from '../components/API';
import { useFocusEffect } from '@react-navigation/native';

const windowHeight = Dimensions.get('window').height;

const Estimate = ({ navigation }) => {
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
  const [loading, setLoading] = useState(false);

  const fetchDataFromAPI = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/asstimate/`, {
        params: { client_name: client, marka },
      });
      const data = response.data;
      if (!Array.isArray(data) || data.length === 0) {
        Alert.alert('No Data', 'No estimate data found for this client.');
        return;
      }
      const extractedHeaders = Object.keys(data[0]);
      const extractedRows = data.map(item =>
        extractedHeaders.map(key => item[key] ?? '')
      );
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
      await API.post('/api/packing/packing/copy-from-estimate/', { client, marka });
    } catch (error) {
      console.error("Error copying from estimate:", error.response?.data || error.message);
      Alert.alert('Error', 'Could not copy from estimate');
    }
  };

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== "android") return true;

    try {
      const sdkInt = Platform.Version;
      if (sdkInt < 30) {
        const write = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (write !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn("❌ WRITE_EXTERNAL_STORAGE permission denied");
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error("Permission error:", err);
      return false;
    }
  };

  const downloadEstimateExcel = async (estimateData) => {
    const granted = await requestAndroidPermissions();
    if (!granted) {
      Alert.alert("Permission Denied", "Storage permission is required to save the estimate file.");
      return;
    }

    try {


      const wsData = [
        Object.keys(estimateData[0] || {}).map(k => k.toUpperCase()),
        ...estimateData.map(row => Object.values(row)),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Estimate");

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const filename = `Estimate_${Date.now()}.xlsx`;
      const filePath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${filename}`
          : `${RNFS.DocumentDirectoryPath}/${filename}`;

      await RNFS.writeFile(filePath, wbout, 'base64');

      const exists = await RNFS.exists(filePath);
      if (!exists) throw new Error("File not found after writing");

      Alert.alert(
        "Download Successful",
        `Estimate saved to:\n${filePath}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Download Failed", `Error: ${error.message}`, [{ text: "OK" }]);
    }
  };

  const getEstimateDataObjects = () => {
    if (!headers.length || !rows.length) return [];
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchDataFromAPI();
      handleCopyFromEstimate();
    }, [client, marka])
  );

  const renderRow = ({ item, index }) => (
    <View
      style={[
        styles.tableRow,
        index % 2 === 0 ? styles.rowEven : styles.rowOdd,
      ]}
    >
      {item.map((cell, cellIndex) => (
        <View key={cellIndex} style={styles.cellWrapper}>
          <Text style={styles.cellText}>{cell}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {headers.length > 0 && (
        <>
          <Text style={styles.title}>Estimate List</Text>

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
                renderItem={renderRow}
                keyExtractor={(_, index) => index.toString()}
                style={{ maxHeight: windowHeight }}
                showsVerticalScrollIndicator={true}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => {
              const estimateData = getEstimateDataObjects();
              if (!estimateData.length) {
                Alert.alert("No Data", "There is no estimate data to download.");
                return;
              }
              downloadEstimateExcel(estimateData);
            }}
          >
            <Text style={styles.downloadButtonText}>Download Estimate Excel</Text>
          </TouchableOpacity>
        </>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={{ marginTop: 10 }}>Please wait...</Text>
        </View>
      )}
    </View>
  );
};

export default Estimate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    alignSelf: 'center',
  },
  cellWrapper: {
    width: 100,
    padding: 10,
    borderRightWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
  },
  tableRow: {
    flexDirection: 'row',
  },
  rowEven: {
    backgroundColor: '#f9f9f9',
  },
  rowOdd: {
    backgroundColor: '#e6f2ff',
  },
  downloadButton: {
    margin: 10,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  headerText: {
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  cellText: {
    color: '#333',
    textAlign: 'center',
  },
});
