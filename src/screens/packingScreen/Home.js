import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { resetClients } from '../../redux/slices/ClientDataSlice';
import { useFocusEffect } from '@react-navigation/native';
import useLogoutWebSocket from '../../components/UseWebSocket';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 16 * 2 - 16) / 2;

const Home = ({ navigation }) => {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.userInfo?.user?.id);

  useLogoutWebSocket(userId, 'nshhd');

  useFocusEffect(
    useCallback(() => {
      dispatch(resetClients());
    }, [dispatch])
  );

  const menuItems = [
    { title: 'Commercial Invoice', icon: <MaterialIcons name="receipt" size={36} color="#1E40AF" />, screen: 'CommercialInvoice' },
    { title: 'Proforma Invoice', icon: <MaterialIcons name="description" size={36} color="#1E40AF" />, screen: 'PerformaInvoice' },
    { title: 'Packing List', icon: <MaterialIcons name="playlist-add-check" size={36} color="#1E40AF" />, screen: 'AppDrawer', params: { screen: 'PackingPage' } },
    { title: 'Create Client', icon: <Ionicons name="person-add" size={36} color="#1E40AF" />, screen: 'CreateClient' },
    { title: 'CBM Calculator', icon: <Ionicons name="calculator" size={36} color="#1E40AF" />, screen: 'CBM' },
    { title: 'Gst Calculator', icon: <Ionicons name="cash-outline" size={36} color="#1E40AF" />, screen: 'Gst' },
    { title: 'Search Item', icon: <Ionicons name="search" size={36} color="#1E40AF" />, screen: 'Mrp' },
    { title: 'Stock', icon: <Ionicons name="cube" size={36} color="#1E40AF" />, screen: 'MainStockList' },
    { title: 'Mrp List', icon: <Ionicons name="pricetags-outline" size={36} color="#1E40AF" />, screen: 'MrpList' },
    { title: 'Security', icon: <Ionicons name="shield-checkmark" size={36} color="#1E40AF" />, screen: 'Security' },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => navigation.navigate(item.screen, item.params)}
      activeOpacity={0.9}
    >
      <View style={styles.iconWrapper}>{item.icon}</View>
      <Text style={styles.menuText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Gradient Header with Logo */}
      <LinearGradient
        colors={['#1E3C72', '#2A5298']}
        style={styles.header}
      >
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.heading}>GlobePact</Text>
        <Text style={styles.subHeading}>Simplifying Global Trade</Text>
      </LinearGradient>

      {/* Menu Grid */}
      <FlatList
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        contentContainerStyle={styles.menuGrid}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  subHeading: {
    fontSize: 14,
    color: '#E0E0E0',
    marginTop: 4,
  },
  menuGrid: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: 10,
  },
  menuItem: {
    width: ITEM_SIZE,
    aspectRatio: 1,
    backgroundColor: '#FFF',
    margin: 8,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  iconWrapper: {
    backgroundColor: '#EEF2FF',
    borderRadius: 50,
    padding: 14,
    marginBottom: 10,
  },
  menuText: {
    color: '#1E293B',
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Home;
