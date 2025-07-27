import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Feather';

const buttons = [
  { title: 'Order Upload', screen: 'OrderUpload', color: '#2196F3', icon: 'upload-cloud' },
  { title: 'Order Update', screen: 'OrderUpdate', color: '#2196F3', icon: 'upload-cloud' },
  { title: 'Order', screen: 'UploadedOrder', color: '#2196F3', icon: 'upload-cloud' },
  { title: 'Estimate List', screen: 'Estimate', color: '#2196F3', icon: 'list' },
  { title: 'Stock', screen: 'AddStock', color: '#2196F3', icon: 'box' },
  { title: 'Stock List', screen: 'StockList', color: '#2196F3', icon: 'layers' },
  { title: 'Row Packing List', screen: 'RowPackingList', color: '#2196F3', icon: 'grid' },
  { title: 'Packing List', screen: 'PackingList', color: '#2196F3', icon: 'clipboard' },
];

export default function CustomDrawer({ navigation }) {
  const client = {
    name: 'ABC Client',
    email: 'abc@client.com',
    address: 'Mumbai, India',
  };

  return (
    <DrawerContentScrollView>
      {/* Client Info */}
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{client.name}</Text>
        <Text style={styles.clientEmail}>{client.email}</Text>
        <Text style={styles.clientAddress}>{client.address}</Text>
      </View>

      {/* Buttons List */}
      <FlatList
        data={buttons}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Icon name={item.icon} size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.buttonText}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  clientInfo: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  clientEmail: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  clientAddress: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
