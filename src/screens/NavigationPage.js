import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  BackHandler
} from 'react-native';

export default function NavigationPage({ navigation }) {
  const buttons = [
    { title: 'Order Upload', screen: 'OrderUpload' },
    { title: 'Esstimate List', screen: 'Esstimate' },
    { title: 'Stock', screen: 'AddStock' },
    { title: 'Stocklist', screen: 'StockList' },
    { title: 'Row Packing List', screen: 'RowPackingList' },
    { title: 'Packing List', screen: 'PackingList' },
  ];



  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Navigation Panel</Text>
      <View style={styles.buttonContainer}>
        {buttons.map((btn, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.button}
            onPress={() => navigation.navigate(btn.screen)}
          >
            <Text style={styles.buttonText}>{btn.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    backgroundColor: '#3478f6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
