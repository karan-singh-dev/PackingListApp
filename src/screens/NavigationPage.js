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

export default function NavigationPage({ navigation }) {
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f3f5',
    paddingTop: 20,
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
});
