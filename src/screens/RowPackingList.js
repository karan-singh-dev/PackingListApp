import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';

import API from '../components/API';
import { setNextCaseNumber, setPackingType } from '../../redux/PackigListSlice';
import { useFocusEffect } from '@react-navigation/native';

const COLUMN_WIDTH = 140;

const RowPackingList = ({ navigation, route }) => {
  
  const dispatch = useDispatch();
  const [allData, setAllData] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState( route.params?.scannedCode);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { height: windowHeight } = useWindowDimensions();
  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const PackingType = useSelector((state) => state.packing.PackingType);
  // const scannedCode = route.params?.scannedCode;
  const PackingTypeRef = useRef(PackingType);
  PackingTypeRef.current = PackingType;

  const client = selectedClient.client_name;
  const marka = selectedClient.marka;

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await API.get("api/packing/packing-details/", {
        params: { client, marka },
      });
      if (res.data.length > 0) {
        if (res.data[res.data.length - 1].cbm === "0.0000") {
          // console.log(res.data[res.data.length - 1].cbm)
          dispatch(setPackingType("Mix"));
          dispatch(setNextCaseNumber((res.data[res.data.length - 1].case_no_end).toString()));
        }
        else {
          dispatch(setPackingType(null));
          dispatch(setNextCaseNumber((res.data[res.data.length - 1].case_no_end + 1).toString()));
        }
      }
      else {
        dispatch(setNextCaseNumber((1).toString()));
        dispatch(setPackingType(null));
      }

    } catch (error) {
      console.error("Failed to fetch packing data:", error);
      setHasError(true);
    } finally {
      setLoading(false)
    }
  };


  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [client, marka])
  );

  const fetchDataFromAPI = async () => {
    try {
      if (!refreshing) setLoading(true);
      setHasError(false);
      const response = await API.get('/api/packing/packing/', {
        params: { client, marka },
      });
      setData(response.data);
    } catch (error) {
      console.error('API Fetch Error:', error);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  

  useFocusEffect(
    useCallback(() => {
      fetchData();
      fetchDataFromAPI();
      setSearchQuery('')
    }, [client, marka])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDataFromAPI();
  }, []);

  const handleStartPacking = (item) => {
    setSelectedItem(item);
    console.log("🚀 handleStartPacking called with:", item);

    if (PackingTypeRef.current === null) {
      setChoiceModalVisible(true);
    } else if (PackingTypeRef.current === 'seperate') {
      navigation.navigate('SeperatePacking', { item: item.part_no });
    } else if (PackingTypeRef.current === 'Mix') {
      navigation.navigate('MixPacking', { item: item.part_no });
    } else {
      console.warn('Unknown PackingType:', PackingTypeRef.current);
    }
  };

  const handlePackingChoice = (option) => {
    dispatch(setPackingType(option));
    setChoiceModalVisible(false);
    if (option === 'seperate') {
      navigation.navigate('SeperatePacking', { item: selectedItem.part_no });
    } else if (option === 'Mix') {
      navigation.navigate('MixPacking', { item: selectedItem.part_no });
    }
  };

  const filteredData = data.filter((item) =>
    item.part_no.toLowerCase().includes(searchQuery.toLowerCase())
  );


  useFocusEffect(
    useCallback(() => {
      if (scannedCode) {
        setSearchQuery(scannedCode);
        setScannedCode('');
      }
    }, [scannedCode])
  );


   useFocusEffect(
    React.useCallback(() => {
      if(data.length==0) return;
      if (route.params?.scannedCode) {
        const code = route.params.scannedCode;
        console.log('🔍 Received scannedCode:', code);
        setSearchQuery(code);
        console.log(data);
        
        const matched = data.find(
          item => item.part_no?.toLowerCase() === code.toLowerCase()
        );
        console.log('matched',matched);
        

        if (matched) {
          handleStartPacking(matched);
        } else {
          Alert.alert('Not Found', `No item found for: ${code}`);
        }

        // Clear scannedCode to avoid reprocessing on focus
        navigation.setParams({ scannedCode: undefined });
      }
    }, [data,route.params?.scannedCode])
  );






  const headers = ['Part No', 'Description', 'Qty', 'Stock Qty', 'Action'];

  const renderItem = useCallback(({ item, index }) => (
    <View
      style={[
        styles.tableRow,
        index % 2 === 0 ? styles.rowEven : styles.rowOdd,
      ]}
    >
      <View style={[styles.cellWrapper, { width: COLUMN_WIDTH }]}>
        <Text style={styles.cellText}>{item.part_no}</Text>
      </View>
      <View style={[styles.cellWrapper, { width: COLUMN_WIDTH }]}>
        <Text style={styles.cellText}>{item.description || '—'}</Text>
      </View>
      <View style={[styles.cellWrapper, { width: COLUMN_WIDTH }]}>
        <Text style={styles.cellText}>{item.qty}</Text>
      </View>
      <View style={[styles.cellWrapper, { width: COLUMN_WIDTH }]}>
        <Text style={styles.cellText}>{item.stock_qty}</Text>
      </View>
      <View style={[styles.cellWrapper, { width: COLUMN_WIDTH }]}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleStartPacking(item)}
        >
          <Text style={styles.buttonText}>Start Packing</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), []);

  if (loading && !refreshing) {
    return (
      <View style={[styles.centeredContainer, { flex: 1 }]}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={[styles.centeredContainer, { flex: 1 }]}>
        <Text style={styles.messageText}>Something went wrong.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDataFromAPI}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (filteredData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>📦 Row Packing List</Text>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Part Number"
            placeholderTextColor={"#ccc"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
         
        </View>
        <Text style={styles.messageText}>No item available</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.tableRowHeader}>
              {headers.map((header, i) => (
                <View key={i} style={[styles.cellWrapper, { width: COLUMN_WIDTH }]}>
                  <Text style={styles.headerText}>{header}</Text>
                </View>
              ))}
            </View>

            <FlatList
              data={filteredData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#2196F3']}
                />
              }
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={10}
              removeClippedSubviews={true}
              style={{ maxHeight: windowHeight * 0.75 }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }
  



 const printData=(abc)=>{
  console.log("DaTA",abc);
  
 }



  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
          <Icon name="menu" size={30} color="#000" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}> Row Packing Details</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Part Number"
          placeholderTextColor={"#ccc"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
        style={{ padding: 10 }}
        onPress={() => navigation.navigate('QRScannerScreen')}
      >
        <Icon name="camera-outline" size={24} color="#666" />
      </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.tableRowHeader}>
            {headers.map((header, i) => (
              <View key={i} style={[styles.cellWrapper, { width: COLUMN_WIDTH }]}>
                <Text style={styles.headerText}>{header}</Text>
              </View>
            ))}
          </View>

          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2196F3']}
              />
            }
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            removeClippedSubviews={true}
            style={{ maxHeight: windowHeight * 0.75 }}
          />
        </View>
      </ScrollView>

      <Modal visible={choiceModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select your packing type</Text>

            <TouchableOpacity
              style={styles.optionContainer}
              onPress={() => handlePackingChoice('seperate')}
            >
              <View style={styles.radioCircle} />
              <Text style={styles.optionText}>Separate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionContainer}
              onPress={() => handlePackingChoice('Mix')}
            >
              <View style={styles.radioCircle} />
              <Text style={styles.optionText}>Mix</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setChoiceModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  heading: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#333" },
  headerContainer: { marginBottom: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 20, backgroundColor: '#fff' },
  menuButton: { marginLeft: 15 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
  },
  cameraButton: {
    paddingHorizontal: 8,
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    elevation: 2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  cellWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
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
    fontWeight: '700',
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  cellText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    minWidth: 100,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  centeredContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 25,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RowPackingList;
