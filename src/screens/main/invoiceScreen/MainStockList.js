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

import API from '../../../components/API';

const deviceHeight = Dimensions.get('window').height;

const MainStockList = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const fetchStockData = async () => {
    try {
      const response = await API.get('/api/packing/stock/');
      console.log(response.data);
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
      fetchStockData();;
    }, [])
  );



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
      <Text style={[styles.cell, styles.headerCell, { width: 120 }]}>Part Number</Text>
      <Text style={[styles.cell, styles.headerCell, { width: 200 }]}>Description</Text>
      <Text style={[styles.cell, styles.headerCell, { width: 90 }]}>Qty</Text>
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
        placeholderTextColor={"#ccc"}
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
  headerContainer: { marginBottom: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 20, backgroundColor: '#fff' },
  menuButton: { marginLeft: 15 },
  heading: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#333" },
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
});

export default MainStockList;
