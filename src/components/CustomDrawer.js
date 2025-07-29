import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const buttons = [
  { title: 'Order Upload', screen: 'OrderUpload', color: '#2563EB', icon: 'upload-cloud' },
  { title: 'Order Update', screen: 'OrderUpdate', color: '#2563EB', icon: 'edit' },
  { title: 'Orders', screen: 'UploadedOrder', color: '#2563EB', icon: 'file-text' },
  { title: 'Estimate List', screen: 'Estimate', color: '#2563EB', icon: 'list' },
  { title: 'Stock', screen: 'AddStock', color: '#2563EB', icon: 'box' },
  { title: 'Stock List', screen: 'StockList', color: '#2563EB', icon: 'layers' },
  { title: 'Row Packing List', screen: 'RowPackingList', color: '#2563EB', icon: 'grid' },
  { title: 'Packing List', screen: 'PackingList', color: '#2563EB', icon: 'clipboard' },
];

export default function CustomDrawer({ navigation }) {
  const client = {
    name: 'ABC Client',
    email: 'abc@client.com',
    address: 'Mumbai, India',
  };

  return (
    <View style={styles.container}>
      {/* Client Info */}
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{client.name}</Text>
        <Text style={styles.clientEmail}>{client.email}</Text>
        <Text style={styles.clientAddress}>{client.address}</Text>
      </View>

      {/* Menu Buttons */}
      <ScrollView contentContainerStyle={styles.menuContainer}>
        {buttons.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Icon name={item.icon} size={20} color="#2563EB" style={styles.icon} />
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  clientInfo: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  clientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  clientEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  clientAddress: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  menuContainer: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  icon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
});
