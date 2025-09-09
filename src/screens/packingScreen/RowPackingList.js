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
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useRoute } from '@react-navigation/native';

import API from '../../components/API';
import { setNextCaseNumber, setPackingType } from '../../redux/slices/PackigListSlice';
import { opacity } from 'react-native-reanimated/lib/typescript/Colors';

const COLUMN_WIDTH = 150;

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
      if (!lastItem) {
        dispatch(setNextCaseNumber('1'));
        dispatch(setPackingType(null));
        return;
      }

      if (lastItem.cbm === '0.0000') {
        console.log('CBM is 0, cannot determine packing type', lastItem);
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

  const fetchPackingData = async () => {
    try {
      if (!refreshing) setLoading(true);
      setHasError(false);
      const response = await API.get('/api/packing/packing/', {
        params: { client, marka },
      });
      setData(response.data);
      console.log(response.data, '<-- fetched packing data');
    } catch (error) {
      console.error('Data fetch error:', error);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPackingData();
      fetchPackingMeta();
      setSearchQuery('');
    }, [client, marka])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
      fetchPackingMeta();
    fetchPackingData();
  }, []);

  useEffect(() => {
    const code = route.params?.scannedCode;
    if (!code || !data.length) return;

    setSearchQuery(code);
    const matched = data.find((item) => item.part_no?.toLowerCase() === code.toLowerCase());
    if (matched) {
      handleStartPacking(matched);
    } else {
     Alert.alert('Item not in order', `No item found for: ${code}`);
    }

    navigation.setParams({ scannedCode: undefined });
  }, [route.params?.scannedCode, data]);

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

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.part_no.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const headers = ['Part No', 'Description', 'Qty', 'Stock Qty', 'Action'];

  const renderHeader = () => (
    <View style={styles.tableRowHeader}>
      {headers.map((header, i) => (
        <View
          key={i}
          style={[styles.cellWrapper, headers[i] === 'Action' && { borderRightWidth: 0 }, { width: COLUMN_WIDTH }]}
        >
          <Text style={styles.headerText}>{header}</Text>
        </View>
      ))}
    </View>
  );

  const renderItem = useCallback(({ item, index }) => (
    <View style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
      {['part_no', 'description', 'qty', 'stock_qty'].map((key, i) => (
        <View
          key={i}
          style={[styles.cellWrapper, { width: COLUMN_WIDTH }]}
        >
          <Text style={styles.cellText}>{item[key] || '0'}</Text>
        </View>
      ))}
      <View style={[styles.cellWrapper, { width: COLUMN_WIDTH, borderRightWidth: 0 }]}>
        <TouchableOpacity style={[styles.button]} disabled={item.stock_qty === 0} onPress={() => handleStartPacking(item)}>
          <LinearGradient colors={['#007bff', '#0056b3']} style={styles.gradientBtn}>
            <Text style={styles.buttonText}>Start Packing</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  ), []);

  if (loading && !refreshing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.messageText}>Something went wrong.</Text>
        <TouchableOpacity style={styles.button} onPress={fetchPackingData}>
          <LinearGradient colors={['#007bff', '#0056b3']} style={styles.gradientBtn}>
            <Text style={styles.buttonText}>Retry</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#012B4B', '#004C8C']} style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
          <Icon name="menu" size={30} color="#fff" />
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
          <Icon name="camera-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
  <View style={[styles.tableCard, { alignSelf: 'flex-start', flex: 0 }]}>
    {renderHeader()}
    <FlatList
      data={filteredData}
      keyExtractor={(item, index) => index.toString()}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#fff']} />
      }
      initialNumToRender={20}
      maxToRenderPerBatch={20}
      windowSize={10}
      removeClippedSubviews
      // Limit FlatList height to content or a max value
      style={{ maxHeight: windowHeight * 0.78, flexGrow: 0 }}
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
  heading: { fontSize: 22, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginBottom: 10, borderWidth: 1, borderColor: '#fff', borderRadius: 8, paddingHorizontal: 10 },
  searchInput: { flex: 1, height: 40, fontSize: 14, color: '#fff' },
  tableCard: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 10, marginBottom: 20, elevation: 4 },
  tableRowHeader: { flexDirection: 'row', backgroundColor: '#2196F3', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  tableRow: { flexDirection: 'row' },
  cellWrapper: { width: COLUMN_WIDTH, padding: 15, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  rowEven: { backgroundColor: '#f9f9f9' },
  rowOdd: { backgroundColor: '#e6f2ff' },
  headerText: { fontWeight: 'bold', color: '#fff', fontSize: 15, textAlign: 'center' },
  cellText: { fontSize: 12, color: '#333', textAlign: 'center' },
  button: { width: '100%', borderRadius: 8, overflow: 'hidden' },
  gradientBtn: { paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageText: { fontSize: 16, color: '#fff', marginBottom: 12, textAlign: 'center' },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,50,0.5)' },
  modalContent: { backgroundColor: 'white', margin: 20, padding: 25, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1E3A8A' },
  optionContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  radioCircle: { height: 24, width: 24, borderRadius: 12, borderWidth: 2, borderColor: '#2563EB', marginRight: 10 },
  optionText: { fontSize: 16, color: '#1E3A8A' },
  cancelButton: { marginTop: 20, paddingVertical: 12, backgroundColor: '#ccc', borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
});

export default RowPackingList;
