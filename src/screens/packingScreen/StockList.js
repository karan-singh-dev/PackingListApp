import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import API from '../../components/API';

const deviceHeight = Dimensions.get('window').height;

const StockList = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatePartNo, setUpdatePartNo] = useState(null);
  const [updateQty, setUpdateQty] = useState('');
  const navigation = useNavigation();
  const user = useSelector(state => state.userInfo.user);
  const client = useSelector(state => state?.clientData?.selectedClient);
  const client_id = client?.id;
const totalQuantity = stockData.reduce((sum, item) => sum + (item.qty || 0), 0);
  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/packing/stock/');
      const filteredData = response.data.filter((row) => row.client === client.id);
      setStockData(filteredData);
    } catch (error) {
      console.error('API fetch error:', error);
      Alert.alert('Error', 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStockData();
    }, [])
  );

  const handleUpdate = async (part_no) => {
    const qtyValue = parseInt(updateQty, 10);
    if (isNaN(qtyValue)) {
      Alert.alert("Invalid Quantity", "Please enter a valid number.");
      return;
    }

    try {
      const response = await API.post("/api/packing/stock/update-qty/", {
        part_no,
        qty: qtyValue,
        client_id: client_id
      });
      // 5️⃣ Sync stock
      await API.post('/api/packing/packing/sync-stock/');

      Alert.alert("Update Stock", response.data.message);
      setUpdatePartNo(null);
      setUpdateQty("");
      fetchStockData();
    } catch (error) {
      Alert.alert("Error", "Failed to update stock.");
      console.error(error);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return stockData;
    const query = searchQuery.toLowerCase();
    return stockData.filter(
      item =>
        (item.part_no && item.part_no.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
    );
  }, [searchQuery, stockData]);

  const renderTableHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      {[
        { label: 'Sr No.', width: 50 },
        { label: 'Part No', width: 120 },
        { label: 'Description', width: 200 },
        { label: 'Qty', width: 90 },
        { label: 'Brand', width: 90 },
      ].map((header, i) => (
        <Text
          key={i}
          style={[
            styles.cell,
            styles.headerCell,
            { width: header.width },
            i === 3 && { borderRightWidth: 0 }, // remove right border for last column
          ]}
        >
          {header.label}
        </Text>
      ))}
      {user.permission && (
        <Text
          style={[
            styles.cell,
            styles.headerCell,
            { width: 150, borderRightWidth: 0 },
          ]}
        >
          Update
        </Text>
      )}
    </View>
  );


  const renderTableRow = ({ item, index }) => (
    <View
      style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}
    >
      {[
        { value: index + 1, width: 50 },
        { value: item.part_no || 'N/A', width: 120 },
        { value: item.description || 'N/A', width: 200 },
        { value: item.qty?.toString() || '0', width: 90 },
        { value: item.brand_name || 'N/A', width: 90 },
      ].map((cell, i) => (
        <Text
          key={i}
          style={[
            styles.cell,
            { width: cell.width },
            i === 3 && { borderRightWidth: 0 }, // remove right border for last column
          ]}
        >
          {cell.value}
        </Text>
      ))}

      {user.permission && (
        <View
          style={[
            styles.cell,
            { width: 150, alignItems: 'center', borderRightWidth: 0 }, // last column
          ]}
        >
          {updatePartNo === item.part_no ? (
            <View style={{ alignItems: 'center' }}>
              <TextInput
                keyboardType="numeric"
                style={styles.updateInput}
                value={updateQty}
                onChangeText={setUpdateQty}
              />
              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: '#3b82f6' }]}
                onPress={() => handleUpdate(item.part_no)}
              >
                <Text style={styles.updateButtonText}>Update Stock</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setUpdatePartNo(null);
                  setUpdateQty('');
                }}
              >
                <Text style={{ color: 'red', fontSize: 12, marginTop: 2 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: '#22c55e' }]}
              onPress={() => setUpdatePartNo(item.part_no)}
            >
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );


  return (
    <LinearGradient colors={['#012B4B', '#004C8C']} style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
          <Icon name="menu" size={30} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>📋 Stock List</Text>
        </View>
      </View>

      {/* Search */}
      <TextInput
        placeholder="Search by Part Number or Description"
        placeholderTextColor="#ccc"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />

      {/* Table */}
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : filteredData.length === 0 ? (
        <Text style={styles.emptyText}>No stock data available.</Text>
      ) : (
        <ScrollView horizontal>
          <View style={styles.tableCard}>
            {renderTableHeader()}
            <FlatList
              data={filteredData}
              keyExtractor={(_, index) => String(index)}
              renderItem={renderTableRow}
              style={{ maxHeight: deviceHeight - 200 }}
            />
            <View style={{padding: 10, backgroundColor: '#f4f6f9', borderTopWidth: 1, borderColor: '#e5e7eb', alignItems: 'center',}}>
                <Text style={{ color: '#555', fontSize: 15 }}>Total Quantity: {totalQuantity}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  menuButton: { marginRight: 10 },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', flex: 1 },
  searchInput: {
    height: 40,
    borderRadius: 8,
    marginHorizontal: 16,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#f0f4f7',
    color: '#333'
  },
  tableCard: {
   
    borderRadius: 12,
    marginHorizontal: 10,
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  headerRow: { backgroundColor: '#0a74da', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  rowEven: { backgroundColor: '#f9f9f9' },
  rowOdd: { backgroundColor: '#e6f2ff' },
  cell: {
    padding: 10,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
    color: '#333',
    fontSize: 12,
  },
  headerCell: { fontWeight: 'bold', color: '#fff' },
  updateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
    width: 100,
    textAlign: 'center',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  updateButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelText: { color: 'red', fontSize: 12, marginTop: 2 },
  emptyText: { color: '#fff', textAlign: 'center', fontSize: 16, marginTop: 50 },
});

export default StockList;
