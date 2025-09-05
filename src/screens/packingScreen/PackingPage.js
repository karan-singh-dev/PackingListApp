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
import LinearGradient from 'react-native-linear-gradient'; // import gradient
import ClientSelection from '../../components/ClintSelection';

export default function PackingPage({ navigation }) {
  const selectedClient = useSelector((state) => state.clientData?.selectedClient);
  const client = selectedClient?.client_name || '';
  const marka = selectedClient?.marka || 'N/A';
  const isClientSelected = !!client;

  const buttons = [
    { title: 'Order Upload', screen: 'OrderUpload', icon: 'upload-cloud', colors: ['#3B82F6', '#2563EB'] },
    { title: 'Order Update', screen: 'OrderUpdate', icon: 'edit', colors: ['#6366F1', '#4338CA'] },
    { title: 'Order', screen: 'UploadedOrder', icon: 'file-text', colors: ['#14B8A6', '#0D9488'] },
    { title: 'Estimate List', screen: 'Estimate', icon: 'list', colors: ['#F59E0B', '#D97706'] },
    { title: 'Update Stock', screen: 'AddStock', icon: 'upload-cloud', colors: ['#10B981', '#059669'] },
    { title: 'Stock List', screen: 'StockList', icon: 'layers', colors: ['#8B5CF6', '#6D28D9'] },
    { title: 'Row Packing List', screen: 'RowPackingList', icon: 'grid', colors: ['#EC4899', '#BE185D'] },
    { title: 'Packing List', screen: 'PackingList', icon: 'clipboard', colors: ['#F97316', '#C2410C'] },
  ];

  if (!isClientSelected) {
    return <ClientSelection />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
          <Icon name="menu" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Packing Dashboard</Text>
      </View>

      {/* Client Card */}
      <View style={styles.clientCard}>
        <View style={styles.clientAvatar}>
          <Icon name="user" size={28} color="#1E40AF" />
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
            style={styles.cardWrapper}
            onPress={() => navigation.navigate(btn.screen)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={btn.colors}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name={btn.icon} size={26} color="#fff" style={styles.icon} />
              <Text style={styles.cardText}>{btn.title}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#012B4B', // dark blue background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#011E36', // darker navy
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  menuButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cardWrapper: {
    width: '40%',
    aspectRatio: 1,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  icon: {
    marginBottom: 8,
  },
  cardText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
