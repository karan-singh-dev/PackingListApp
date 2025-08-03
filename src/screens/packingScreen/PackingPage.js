import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import ClientSelection from '../../components/ClintSelection';

export default function PackingPage({ navigation }) {
  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const client = selectedClient?.client_name || '';
  const marka = selectedClient?.marka || 'N/A';
  const isClientSelected = !!client;

  const buttons = [
    { title: 'Order Upload', screen: 'OrderUpload', icon: 'upload-cloud', color: '#3B82F6' },
    { title: 'Order Update', screen: 'OrderUpdate', icon: 'edit', color: '#6366F1' },
    { title: 'Order', screen: 'UploadedOrder', icon: 'file-text', color: '#14B8A6' },
    { title: 'Estimate List', screen: 'Estimate', icon: 'list', color: '#F59E0B' },
    { title: 'Update Stock', screen: 'AddStock', icon: 'upload-cloud', color: '#10B981' },
    { title: 'Stock List', screen: 'StockList', icon: 'layers', color: '#8B5CF6' },
    { title: 'Row Packing List', screen: 'RowPackingList', icon: 'grid', color: '#EC4899' },
    { title: 'Packing List', screen: 'PackingList', icon: 'clipboard', color: '#F97316' },
  ];

  if (!isClientSelected) {
    return <ClientSelection />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
          <Icon name="menu" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Packing Dashboard</Text>
      </View>

      {/* Client Card */}
      <View style={styles.clientCard}>
        <View style={styles.clientAvatar}>
          <Icon name="user" size={32} color="#3B82F6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.clientName}>{client}</Text>
          <Text style={styles.clientMarka}>Marka: {marka}</Text>
        </View>
      </View>

      {/* Buttons */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {buttons.map((btn, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.card, { backgroundColor: btn.color }]}
            onPress={() => navigation.navigate(btn.screen)}
            activeOpacity={0.85}
          >
            <Icon name={btn.icon} size={26} color="#fff" style={styles.icon} />
            <Text style={styles.cardText}>{btn.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 3,
    marginBottom: 8,
  },
  menuButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  clientMarka: {
    fontSize: 14,
    color: '#6B7280',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },
  icon: {
    marginBottom: 8,
  },
  cardText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});




