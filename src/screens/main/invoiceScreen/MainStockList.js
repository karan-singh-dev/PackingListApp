import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import API from '../../../components/API';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClients } from '../../../redux/slices/ClientDataSlice';

const deviceHeight = Dimensions.get('window').height;
const deviceWidth = Dimensions.get('window').width;

const MainStockList = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientData, setClientData] = useState({});
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.userInfo.user);
  const { clients } = useSelector((state) => state.clientData);

  useEffect(() => {
    if (clients && Array.isArray(clients)) {
      const clientsObject = clients.reduce((acc, item) => {
        acc[item.id] = `${item.client_name} (${item.marka})`;
        return acc;
      }, {});
      setClientData(clientsObject);
    }
  }, [clients]);

  // Fetch stock data
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
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStockData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchClients());
      fetchStockData();
    }, [])
  );

  // Search filter
  const filteredData = useMemo(() => {
    if (!searchQuery) return stockData;
    const query = searchQuery.toLowerCase();
    return stockData.filter(
      (item) =>
        (item.part_no && item.part_no.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
    );
  }, [searchQuery, stockData]);

  // Table header
  const renderTableHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.cell, styles.headerCell, styles.partNoCell]}>Part No</Text>
      <Text style={[styles.cell, styles.headerCell, styles.descCell]}>Description</Text>
      <Text style={[styles.cell, styles.headerCell, styles.qtyCell]}>Qty</Text>
      <Text style={[styles.cell, styles.headerCell, styles.brandCell]}>Brand</Text>
      <Text style={[styles.cell, styles.headerCell, styles.clientCell]}>Clients</Text>
    </View>
  );

  // Table rows
  const renderTableRow = ({ item, index }) => (
    <View
      style={[
        styles.row,
        index % 2 === 0 ? styles.rowEven : styles.rowOdd,
      ]}
    >
      <Text style={[styles.cell, styles.partNoCell]} numberOfLines={1}>{item.part_no || 'N/A'}</Text>
      <Text style={[styles.cell, styles.descCell]} numberOfLines={2}>{item.description || 'N/A'}</Text>
      <Text style={[styles.cell, styles.qtyCell]}>{item.qty?.toString() || '0'}</Text>
      <Text style={[styles.cell, styles.brandCell]} numberOfLines={1}>{item.brand_name || 'N/A'}</Text>
      <Text style={[styles.cell, styles.clientCell]} numberOfLines={2}>{clientData[item.client] || 'N/A'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock List</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          placeholder="Search by Part Number or Description"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredData.length} {filteredData.length === 1 ? 'item' : 'items'} found
        </Text>
      </View>

      {/* Table */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Loading stock data...</Text>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inventory" size={60} color="#D1D5DB" />
          <Text style={styles.emptyText}>No stock data available</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term' : 'Check back later for updates'}
          </Text>
        </View>
      ) : (
        <View style={styles.tableWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.tableContainer}>
              {renderTableHeader()}
              <FlatList
                data={filteredData}
                keyExtractor={(_, index) => String(index)}
                renderItem={renderTableRow}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                style={styles.table}
                initialNumToRender={20}
                maxToRenderPerBatch={30}
                windowSize={10}
                removeClippedSubviews={true}
                showsVerticalScrollIndicator={true}
              />
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E40AF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  refreshButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  tableWrapper: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    minHeight: 50,
  },
  headerRow: {
    backgroundColor: '#1E40AF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginBottom: 2,
  },
  rowEven: {
    backgroundColor: '#FFF',
  },
  rowOdd: {
    backgroundColor: '#F9FAFB',
  },
  cell: {
    padding: 10,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
    color: '#374151',
    fontSize: 12,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#FFF',
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  partNoCell: {
    width: 100,
  },
  descCell: {
    width: 180,
    flexShrink: 1,
  },
  qtyCell: {
    width: 60,
    textAlign: 'center',
  },
  brandCell: {
    width: 90,
  },
  clientCell: {
    width: 150,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
});

export default MainStockList;
