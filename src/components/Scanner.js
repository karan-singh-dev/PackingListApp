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
    if (!scannedValue) {
      console.log('❌ No scanned value');
      return;
    }

    console.log('📸 Scanned:', scannedValue);

    // Navigate back to RowPackingList with scannedCode
    navigation.navigate('RowPackingList', { scannedCode: scannedValue });
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
