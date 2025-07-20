import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // or MaterialCommunityIcons, FontAwesome, etc.
import { useSelector } from 'react-redux';
import ClientSelection from '../components/ClintSelection';

export default function PackingPage({ navigation }) {

  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const marka = selectedClient?.marka || '';
  const client = selectedClient?.client_name || '';
    const isClientSelected = !!client;

  const buttons = [
    {
      title: 'Order Upload',
      screen: 'OrderUpload',
      color: '#2196F3',
      icon: 'upload-cloud',
    },
    {
      title: 'Estimate List',
      screen: 'Estimate',
      color: '#2196F3',
      icon: 'list',
    },
    {
      title: 'Stock',
      screen: 'AddStock',
      color: '#2196F3',
      icon: 'box',
    },
    {
      title: 'Stock List',
      screen: 'StockList',
      color: '#2196F3',
      icon: 'layers',
    },
    {
      title: 'Row Packing List',
      screen: 'RowPackingList',
      color: '#2196F3',
      icon: 'grid',
    },
    {
      title: 'Packing List',
      screen: 'PackingList',
      color: '#2196F3',
      icon: 'clipboard',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {!isClientSelected ? (<ClientSelection/>) : (<><View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={[styles.menuButton,]}>
          <Icon name="menu" size={30} color="#000" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Packing</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.buttonContainer}>
        {buttons.map((btn, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.button, { backgroundColor: btn.color }]}
            onPress={() => navigation.navigate(btn.screen)}
            activeOpacity={0.8}>
            <View style={styles.iconTextWrapper}>
              <Icon name={btn.icon} size={20} color="#fff" style={styles.icon} />
              <Text style={styles.buttonText}>{btn.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView></>) }
      
    
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f3f5',
  
  },
  buttonContainer: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 30,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  iconTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
   headerContainer: { marginBottom: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 20, },
    menuButton: { marginLeft: 15 },
    heading: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#000" },
 
});
