import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import API from '../../components/API';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { Dimensions } from 'react-native';

const windowHeight = Dimensions.get('window').height;

const LossReportScreen = () => {
  const selectedClient = useSelector((state) => state.clientData?.selectedClient);
  const client = selectedClient?.client_name || '';
  const marka = selectedClient?.marka || 'N/A';
  const [estimateData, setEstimateData] = useState([]);
  const [packedData, setPackedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Fetch estimate data
  const fetchEstimateData = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/asstimate/`, { params: { client_name: client, marka } });
      const data = response.data;
      console.log('Fetched Estimate Data:', data);
      if (!Array.isArray(data) || data.length === 0) {
        setEstimateData([]);
        Alert.alert('Warning', 'No estimate data found');
        return;
      }
      setEstimateData(data);
    } catch (error) {
      console.error('API Fetch Error (Estimate):', error.response?.data || error.message);
      Alert.alert('Error', 'Could not fetch estimate data');
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch packed data
  const fetchPackedData = async () => {
    try {
      setLoading(true);
      const res = await API.get('api/packing/packing-details/', { params: { client, marka } });
      console.log('Fetched Packed Data:', res.data);
      if (!Array.isArray(res.data) || res.data.length === 0) {
        setPackedData([]);
        Alert.alert('Warning', 'No packed data found');
        return;
      }
      setPackedData(res.data);
    } catch (error) {
      console.error('Failed to fetch packing data:', error);
      setHasError(true);
      Alert.alert('Error', 'Could not fetch packed data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch both datasets on component mount
  useEffect(() => {
    if (client && marka) {
      fetchEstimateData();
      fetchPackedData();
    } else {
      Alert.alert('Error', 'Client or Marka not provided');
    }
  }, [client, marka]);

  // Group packed data by part_no and sum quantities and MRP totals
  const packedTotals = {};
  packedData.forEach((item) => {
    const partNo = item.part_no;
    if (!packedTotals[partNo]) {
      packedTotals[partNo] = { qty: 0, mrpTotal: 0 };
    }
    packedTotals[partNo].qty += item.total_packing_qty;
    packedTotals[partNo].mrpTotal += parseFloat(item.total_mrp || 0);
  });

  // Compute loss data based on estimate
  const lossData = estimateData.map((item) => {
    const partNo = item.part_no;
    const estQty = item.qty;
    const estMrpTotal = parseFloat(item.total_amt_mrp || 0);
    const packed = packedTotals[partNo] || { qty: 0, mrpTotal: 0 };
    const lossQty = estQty - packed.qty;
    const lossMrp = estMrpTotal - packed.mrpTotal;
    return {
      part_no: partNo,
      description: item.description,
      est_qty: estQty,
      est_mrp: estMrpTotal,
      packed_qty: packed.qty,
      packed_mrp: packed.mrpTotal,
      loss_qty: lossQty,
      loss_mrp: lossMrp,
    };
  });

  // Calculate total loss MRP
  const totalLossMrp = lossData.reduce((sum, item) => sum + item.loss_mrp, 0);

  const tableWidth = 960; // Sum of column widths: 150 + 250 + 100 + 120 + 100 + 120 + 100 + 120

  const renderHeader = () => (
    <View style={[styles.tableRowHeader, { width: tableWidth }]}>
      <View style={[styles.cellWrapper, styles.partNoCell]}>
        <Text style={styles.headerText}>Part No</Text>
      </View>
      <View style={[styles.cellWrapper, styles.descCell]}>
        <Text style={styles.headerText}>Description</Text>
      </View>
      <View style={[styles.cellWrapper, styles.qtyCell]}>
        <Text style={styles.headerText}>Est Qty</Text>
      </View>
      <View style={[styles.cellWrapper, styles.mrpCell]}>
        <Text style={styles.headerText}>Est MRP</Text>
      </View>
      <View style={[styles.cellWrapper, styles.qtyCell]}>
        <Text style={styles.headerText}>Packed Qty</Text>
      </View>
      <View style={[styles.cellWrapper, styles.mrpCell]}>
        <Text style={styles.headerText}>Packed MRP</Text>
      </View>
      <View style={[styles.cellWrapper, styles.qtyCell]}>
        <Text style={styles.headerText}>Loss Qty</Text>
      </View>
      <View style={[styles.cellWrapper, styles.mrpCell, { borderRightWidth: 0 }]}>
        <Text style={styles.headerText}>Loss MRP</Text>
      </View>
    </View>
  );

  const renderItem = ({ item, index }) => (
    <View style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd, { width: tableWidth }]}>
      <View style={[styles.cellWrapper, styles.partNoCell]}>
        <Text style={styles.cellText}>{item.part_no}</Text>
      </View>
      <View style={[styles.cellWrapper, styles.descCell]}>
        <Text style={styles.cellText} numberOfLines={2}>{item.description}</Text>
      </View>
      <View style={[styles.cellWrapper, styles.qtyCell]}>
        <Text style={styles.cellText}>{item.est_qty}</Text>
      </View>
      <View style={[styles.cellWrapper, styles.mrpCell]}>
        <Text style={styles.cellText}>{item.est_mrp.toFixed(2)}</Text>
      </View>
      <View style={[styles.cellWrapper, styles.qtyCell]}>
        <Text style={styles.cellText}>{item.packed_qty}</Text>
      </View>
      <View style={[styles.cellWrapper, styles.mrpCell]}>
        <Text style={styles.cellText}>{item.packed_mrp.toFixed(2)}</Text>
      </View>
      <View style={[styles.cellWrapper, styles.qtyCell]}>
        <Text style={[styles.cellText, item.loss_qty < 0 ? styles.lossText : styles.normalText]}>
          {item.loss_qty}
        </Text>
      </View>
      <View style={[styles.cellWrapper, styles.mrpCell, { borderRightWidth: 0 }]}>
        <Text style={styles.cellText}>{item.loss_mrp.toFixed(2)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#012B4B', '#004C8C']} style={styles.container}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Please wait...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (hasError) {
    return (
      <LinearGradient colors={['#012B4B', '#004C8C']} style={styles.container}>
        <View style={styles.centerMessageContainer}>
          <Text style={styles.errorText}>Error loading data. Please try again.</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!selectedClient) {
    return (
      <LinearGradient colors={['#012B4B', '#004C8C']} style={styles.container}>
        <View style={styles.centerMessageContainer}>
          <Text style={styles.heading}>Please select a client first.</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#012B4B', '#004C8C']} style={styles.container}>
      <Text style={styles.heading}>Loss Report</Text>
      {lossData.length > 0 ? (
        <View style={styles.tableCard}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{ width: tableWidth }}
            style={styles.tableContainer}
          >
            <View>
              {renderHeader()}
              <FlatList
                data={lossData}
                renderItem={renderItem}
                keyExtractor={(item) => item.part_no}
                style={styles.list}
                showsVerticalScrollIndicator={true}
                maxHeight={windowHeight * 0.75}
                nestedScrollEnabled={true} // Enable nested scrolling
              />
            </View>
          </ScrollView>
        </View>
      ) : (
        <View style={styles.centerMessageContainer}>
          <Text style={styles.heading}>No Loss Data Found</Text>
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={styles.totalText}>
          Total Loss MRP: ₹{totalLossMrp.toFixed(2)}
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    marginVertical: 20,
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  tableContainer: {
    // Style for ScrollView
  },
  list: {
    flexGrow: 0, // Prevent FlatList from expanding unnecessarily
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableRow: {
    flexDirection: 'row',
  },
  cellWrapper: {
    width: 120,
    padding: 10,
    borderRightWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partNoCell: {
    width: 150,
    paddingLeft: 10,
    alignItems: 'flex-start',
  },
  descCell: {
    width: 250,
    paddingLeft: 10,
    alignItems: 'flex-start',
  },
  qtyCell: {
    width: 100,
  },
  mrpCell: {
    width: 120,
  },
  headerText: {
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  cellText: {
    color: '#333',
    textAlign: 'center',
  },
  rowEven: {
    backgroundColor: '#f9f9f9',
  },
  rowOdd: {
    backgroundColor: '#e6f2ff',
  },
  lossText: {
    color: '#ff512f',
    fontWeight: '500',
  },
  normalText: {
    color: '#28a745',
    fontWeight: '500',
  },
  totalRow: {
    backgroundColor: '#e6f2ff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff512f',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,50,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  centerMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#ff512f',
    fontWeight: '500',
  },
});

export default LossReportScreen;