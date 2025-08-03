import React, { useEffect, useState } from 'react';
import { View, Alert, PermissionsAndroid, Platform } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';

export default function QRScannerScreen({ navigation }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    (async () => {
      let granted = true;
      if (Platform.OS === 'android') {
        const perm = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        granted = perm === PermissionsAndroid.RESULTS.GRANTED;
      }
      if (!granted) {
        Alert.alert('Permission denied');
        return;
      }
      setAllowed(true);
    })();
  }, []);
  const handleScan = (event) => {
    const scannedValue = event?.nativeEvent?.codeStringValue?.trim();
    console.log('scannedValue',scannedValue);
    
    if (!scannedValue) {
      console.log('❌ No scanned value');
      return;
    }

    let cleanValue = "";

    if (scannedValue.includes("|")) {
      // Pipe-separated → take the part starting with 'S'
      const parts = scannedValue.split("|");
      console.log(parts);
      
      cleanValue =parts[1];
    }
    else if (scannedValue.includes("_")) {
      // Pipe-separated → take the part starting with 'S'
      const parts = scannedValue.split("_");
      console.log(parts);
      
      cleanValue =parts[0];
    } 
    // Ensure only alphanumeric characters (safety)
    cleanValue = cleanValue.replace(/[^A-Za-z0-9]/g, "");

    console.log('📸 Scanned:', cleanValue);

    navigation.navigate('AppDrawer', {
      screen: 'RowPackingList',
      params: { scannedCode: cleanValue }
    });
  };




  if (!allowed) return <View style={{ flex: 1, backgroundColor: 'black' }} />;

  return (
    <Camera
      style={{ flex: 1 }}
      cameraType={CameraType.Back}
      scanBarcode={true}
      showFrame={true}
      laserColor="red"
      frameColor="white"
      onReadCode={handleScan}
    />
  );
}
