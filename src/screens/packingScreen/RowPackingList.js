import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useRoute } from '@react-navigation/native';

import API from '../../components/API';
import { setNextCaseNumber, setPackingType } from '../../redux/slices/PackigListSlice';

const COLUMN_WIDTH = 140;

const RowPackingList = ({ navigation }) => {
  const dispatch = useDispatch();
  const route = useRoute();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { height: windowHeight } = useWindowDimensions();
  const selectedClient = useSelector((state) => state?.clientData?.selectedClient);
  const PackingType = useSelector((state) => state.packing.PackingType);

  const client = selectedClient?.client_name;
  const marka = selectedClient?.marka;

  const fetchPackingMeta = async () => {
    try {
      const res = await API.get('api/packing/packing-details/', {
        params: { client, marka },
      });
      const lastItem = res.data[res.data.length - 1];
console.log('packing data ======>', res);
console.log('packing data ======>',  client, marka);
      if (!lastItem) {
        dispatch(setNextCaseNumber('1'));
        dispatch(setPackingType(null));
        return;
      }

      if (lastItem.cbm === '0.0000') {
        dispatch(setPackingType('Mix'));
        dispatch(setNextCaseNumber(lastItem.case_no_end.toString()));
      } else {
        dispatch(setPackingType(null));
        dispatch(setNextCaseNumber((lastItem.case_no_end + 1).toString()));
      }
    } catch (error) {
      console.error('Meta fetch error:', error);
      setHasError(true);
    }
  };

  /** --- Fetch Packing Data --- */
  const fetchPackingData = async () => {
    try {
      if (!refreshing) setLoading(true);
      setHasError(false);
      const response = await API.get('/api/packing/packing/', {
        params: { client, marka },
      });
      setData(response.data);
      console.log(response.data, 'rowPacking Data');
    } catch (error) {
      console.error('Data fetch error:', error);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /** --- Combined fetch on screen focus --- */
  useFocusEffect(
    useCallback(() => {
      fetchPackingData();
      fetchPackingMeta();
      
      setSearchQuery('');
    }, [client, marka])
  );

  /** --- Handle pull to refresh --- */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPackingData();
  }, []);

  /** --- Handle scan code navigation param --- */
useEffect(() => {
  const code = route.params?.scannedCode;
  if (!code || !data.length) return;

  console.log(code, 'code');

  setSearchQuery(code);

  const matched = data.find((item) => item.part_no?.toLowerCase() === code.toLowerCase());
  if (matched) {
    handleStartPacking(matched);
  } else {
    Alert.alert('Not Found', `No item found for: ${code}`);
  }

  // Param clear karna ho to:
  navigation.setParams({ scannedCode: undefined });
}, [route.params?.scannedCode, data]);


  /** --- Start Packing Logic --- */
  const handleStartPacking = (item) => {
    setSelectedItem(item);
    if (!PackingType) {
      setChoiceModalVisible(true);
      return;
    }
    navigateByPackingType(PackingType, item.part_no);
  };

  const handlePackingChoice = (option) => {
    dispatch(setPackingType(option));
    setChoiceModalVisible(false);
    navigateByPackingType(option, selectedItem.part_no);
  };

  const navigateByPackingType = (type, partNo) => {
    const routeName = type === 'seperate' ? 'SeperatePacking' : 'MixPacking';
    navigation.navigate(routeName, { item: partNo });
  };

  /** --- Filtered Data --- */
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.part_no.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  /** --- Render Table Header --- */
  const headers = ['Part No', 'Description', 'Qty', 'Stock Qty', 'Action'];

  const renderHeader = () => (
    <View style={styles.tableRowHeader}>
      {headers.map((header, i) => (
        <View key={i} style={[styles.cellWrapper, { width: COLUMN_WIDTH }]}>
          <Text style={styles.headerText}>{header}</Text>
        </View>
      ))}
    </View>
  );

  /** --- Render Each Row --- */
  const renderItem = useCallback(({ item, index }) => (
    <View style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
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
        <TouchableOpacity style={styles.button} onPress={() => handleStartPacking(item)}>
          <Text style={styles.buttonText}>Start Packing</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), []);

  /** --- Conditional UI Rendering --- */
  if (loading && !refreshing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.messageText}>Something went wrong.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPackingData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /** --- Main UI --- */
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
          <Icon name="menu" size={30} color="#000" />
        </TouchableOpacity>
        <Text style={styles.heading}>Row Packing Details</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Part Number"
          placeholderTextColor="#ccc"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={{ padding: 10 }} onPress={() => navigation.navigate('QRScannerScreen')}>
          <Icon name="camera-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {renderHeader()}
          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            removeClippedSubviews
            style={{ maxHeight: windowHeight * 0.75 }}
          />
        </View>
      </ScrollView>

      {/* Packing Choice Modal */}
      <Modal visible={choiceModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select your packing type</Text>
            <TouchableOpacity style={styles.optionContainer} onPress={() => handlePackingChoice('seperate')}>
              <View style={styles.radioCircle} />
              <Text style={styles.optionText}>Separate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionContainer} onPress={() => handlePackingChoice('Mix')}>
              <View style={styles.radioCircle} />
              <Text style={styles.optionText}>Mix</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setChoiceModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  /* Keep your styles same as original */
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  headerContainer: { marginBottom: 30, flexDirection: 'row', alignItems: 'center', paddingTop: 20 },
  menuButton: { marginLeft: 15 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginBottom: 16 },
  searchInput: { flex: 1, height: 40, fontSize: 14, color: '#333' },
  tableRowHeader: { flexDirection: 'row', backgroundColor: '#4CAF50', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 40, borderBottomWidth: 1, borderColor: '#ddd' },
  cellWrapper: { paddingVertical: 12, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  rowEven: { backgroundColor: '#f9f9f9' },
  rowOdd: { backgroundColor: '#e6f2ff' },
  headerText: { fontWeight: '700', color: '#fff', fontSize: 14, textAlign: 'center' },
  cellText: { fontSize: 14, color: '#333', textAlign: 'center' },
  button: { backgroundColor: '#2196F3', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, minWidth: 100 },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageText: { fontSize: 16, color: '#666', marginBottom: 12, textAlign: 'center' },
  retryButton: { backgroundColor: '#2196F3', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', margin: 20, padding: 25, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  optionContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  radioCircle: { height: 24, width: 24, borderRadius: 12, borderWidth: 2, borderColor: '#007BFF', marginRight: 10 },
  optionText: { fontSize: 16, color: '#333' },
  cancelButton: { marginTop: 20, paddingVertical: 12, backgroundColor: '#ccc', borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
});

export default RowPackingList;
