import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Camera, CameraType } from 'react-native-camera-kit';
import API from '../../components/API'; // Adjust path

const MrpDetailS = () => {
  const [partId, setPartId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [allowed, setAllowed] = useState(false);

  // Request camera permission
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        setAllowed(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        setAllowed(true);
      }
    })();
  }, []);

  const handleGetDetail = async () => {
    

    setLoading(true);
    try {
      const res = await API.get(`api/mrp/data/${partId}/`);
      setResult(res.data);
    } catch (error) {
      console.log(error,'error')
      Alert.alert('Item not found');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (event) => {
    const scannedValue = event?.nativeEvent?.codeStringValue?.trim();
    if (!scannedValue) return;
  console.log(scannedValue, 'scannedValue');
    let cleanValue = scannedValue;

  if (scannedValue.includes("_") || scannedValue.includes("-")) {
  
      const parts = scannedValue.split(/[_-]/);
      cleanValue = parts[0];
    }
console.log(cleanValue, 'cleanValue');
    setPartId(cleanValue);
    setShowScanner(false); 
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Part Detail</Text>

      {showScanner && allowed ? (
        <View style={{ height: 400 }}>
          <Camera
            style={{ flex: 1 }}
            cameraType={CameraType.Back}
            scanBarcode={true}
            showFrame={true}
            laserColor="red"
            frameColor="white"
            onReadCode={handleScan}
          />
          <TouchableOpacity
            onPress={() => setShowScanner(false)}
            style={{
              backgroundColor: '#222',
              padding: 10,
              marginTop: 10,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff' }}>Cancel Scanner</Text>
          </TouchableOpacity>

        </View>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Enter part number or scan"
              value={partId}
              onChangeText={setPartId}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowScanner(true)}>
              <Icon name="camera-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleGetDetail}
            style={{
              backgroundColor: '#333',
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Get Detail</Text>
          </TouchableOpacity>

        </>
      )}

      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultHeading}>Part Details</Text>
          <DetailRow label="Part No" value={result.item_code || '-'} />
          <DetailRow label="Description" value={result.item_description || '-'} />
          <DetailRow label="MRP" value={result.mrp_per_unit?.toString() || '-'} />
          <DetailRow label="HSN Code" value={result.hsn_code || '-'} />
          <DetailRow label="GST %" value={result.gst_percent?.toString() || '-'} />
        </View>
      )}
    </ScrollView>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: '#121212', // Dark background
  },
  heading: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#ffffff', // Light text
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444', // Dark gray border
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    height: 50,
    backgroundColor: '#1f1f1f',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#fff', // Light input text
  },
  loader: {
    marginTop: 20,
  },
  resultBox: {
    marginTop: 30,
    backgroundColor: '#1f1f1f',
    padding: 20,
    borderRadius: 8,
    borderColor: '#333',
    borderWidth: 1,
  },
  resultHeading: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#fff',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontWeight: '600',
    width: 120,
    color: '#ccc',
  },
  value: {
    flex: 1,
    color: '#fff',
  },
});


export default MrpDetailS;
