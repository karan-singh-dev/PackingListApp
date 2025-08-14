import React, { useState, useMemo, useCallback } from 'react';
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
import API from '../../../components/API'; // keep your original path
import { useSelector } from 'react-redux';

const deviceHeight = Dimensions.get('window').height;

const MainStockList = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatePartNo, setUpdatePartNo] = useState(null);
  const [updateQty, setUpdateQty] = useState('');
  const navigation = useNavigation();
  const user =useSelector(state => state.userInfo.user)
 
 // Replace with real auth

  const fetchStockData = async () => {
    try {
      const response = await API.get('/api/packing/stock/');
      if (!Array.isArray(response.data)) {
        throw new Error('Unexpected response format');
      }
      setStockData(response.data);
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
      Alert.alert('Invalid Quantity', 'Please enter a valid number.');
      return;
    }

    try {
      const response = await API.post('/api/packing/stock/update-qty/', {
        part_no,
        qty: qtyValue,
      });

      Alert.alert('Update Stock', response.data.message);
      setUpdatePartNo(null);
      setUpdateQty('');
      fetchStockData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update stock.');
      console.error(error);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return stockData;
    const query = searchQuery.toLowerCase();
    return stockData.filter(
      (item) =>
        (item.part_no && item.part_no.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
    );
  }, [searchQuery, stockData]);

  const renderTableHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.cell, styles.headerCell, { width: 120 }]}>Part No</Text>
      <Text style={[styles.cell, styles.headerCell, { width: 200 }]}>Description</Text>
      <Text style={[styles.cell, styles.headerCell, { width: 90 }]}>Qty</Text>
      <Text style={[styles.cell, styles.headerCell, { width: 90 }]}>Brand</Text>
      {user.is_staff && (
        <Text style={[styles.cell, styles.headerCell, { width: 150 }]}>Update</Text>
      )}
    </View>
  );

  const renderTableRow = ({ item, index }) => (
    <View
      style={[
        styles.row,
        index % 2 === 0 ? styles.rowEven : styles.rowOdd,
      ]}
    >
      <Text style={[styles.cell, { width: 120 }]}>{item.part_no || 'N/A'}</Text>
      <Text style={[styles.cell, { width: 200 }]}>{item.description || 'N/A'}</Text>
      <Text style={[styles.cell, { width: 90 }]}>{item.qty?.toString() || '0'}</Text>
      <Text style={[styles.cell, { width: 90 }]}>{item.brand_name || 'N/A'}</Text>

      {user.is_staff && (
        <View style={[styles.cell, { width: 150, alignItems: 'center' }]}>
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
                <Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>Cancel</Text>
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
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
          <Icon name="menu" size={30} color="#000" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>📋 Stock List</Text>
        </View>
      </View>

      <TextInput
        placeholder="Search by Part Number or Description"
        placeholderTextColor="#ccc"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : filteredData.length === 0 ? (
        <Text style={styles.emptyText}>No stock data available.</Text>
      ) : (
        <ScrollView horizontal>
          <View>
            {renderTableHeader()}
            <FlatList
              data={filteredData}
              keyExtractor={(_, index) => String(index)}
              renderItem={renderTableRow}
              style={styles.table}
              contentContainerStyle={{ paddingBottom: 100 }}
              initialNumToRender={20}
              maxToRenderPerBatch={30}
              windowSize={10}
              removeClippedSubviews={true}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  headerContainer: {
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  menuButton: { marginLeft: 15 },
  heading: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginHorizontal: 16,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  table: {
    height: deviceHeight - 160,
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    backgroundColor: '#4CAF50',
  },
  rowEven: {
    backgroundColor: '#f9f9f9',
  },
  rowOdd: {
    backgroundColor: '#e6f2ff',
  },
  cell: {
    padding: 10,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
    color: '#333',
    fontSize: 12,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  updateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
    width: 100,
    textAlign: 'center',
    borderRadius: 4,
  },
  updateButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default MainStockList;
