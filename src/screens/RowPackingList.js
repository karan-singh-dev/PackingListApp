import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import API from '../components/API'; // use your centralized API instance

const COLUMN_WIDTH = 140;

const RowPackingList = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { height: windowHeight } = useWindowDimensions();
  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const client = selectedClient.client_name;
  const marka = selectedClient.marka;

  const fetchDataFromAPI = async () => {
    try {
      if (!refreshing) setLoading(true);
      setHasError(false);
      const response = await API.get('/api/packing/packing/', {
        params: { client, marka }
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

  useEffect(() => {
    fetchDataFromAPI();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDataFromAPI();
  }, []);

  const handleStartPacking = (item) => {
    navigation.navigate('Choice', { item: item.part_no });
  };

  const filteredData = data.filter((item) =>
    item.part_no.toLowerCase().includes(searchQuery.toLowerCase())
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
      <View style={[styles.centeredContainer, { flex: 1 }]}>
        <Text style={styles.messageText}>No data available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDataFromAPI}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>📦 Row Packing List</Text>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by Part Number"
        placeholderTextColor={"#ccc"}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 14,
    color: '#333',
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
});

export default RowPackingList;
