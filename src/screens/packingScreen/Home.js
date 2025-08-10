import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { resetClients } from '../../redux/slices/ClientDataSlice';
import { useFocusEffect } from '@react-navigation/native';


const Home = ({ navigation }) => {
    const dispatch = useDispatch();
    const [modalVisible, setModalVisible] = useState(false);


    useFocusEffect(
        useCallback(() => {
            dispatch(resetClients());
             setModalVisible(false)
        }, [dispatch])
        
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>

                <View style={{ flex: 1 }}>
                    <Text style={styles.heading}>Export Invoice Maker</Text>
                </View>
            </View>
            <View style={styles.menuGrid}>
                <TouchableOpacity style={[styles.menuItem]} onPress={() => navigation.navigate('CommercialInvoice')}
                >
                    <MaterialIcons name="receipt" size={32} color="#fff" />
                    <Text style={styles.menuText}>Commercial Invoice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuItem]}
                    onPress={() => navigation.navigate('PerformaInvoice')}
                >
                    <MaterialIcons name="description" size={32} color="#fff" />
                    <Text style={styles.menuText}>Proforma Invoice</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('AppDrawer', { screen: 'PackingPage' })} style={[styles.menuItem]}
                >
                    <MaterialIcons name="playlist-add-check" size={32} color="#fff" />
                    <Text style={styles.menuText}>Packing List</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('CreateClient')} style={styles.menuItem}>
                    <Ionicons name="person-add" size={32} color="#fff" />
                    <Text style={styles.menuText}>Create Client</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('CBM')} style={styles.menuItem}>
                    <Ionicons name="calculator" size={32} color="#fff" />
                    <Text style={styles.menuText}>CBM Calculator</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Gst')} style={styles.menuItem}>
                    <Ionicons name="cash-outline" size={32} color="#fff" />
                    <Text style={styles.menuText}>Gst Calculator</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Mrp')} style={styles.menuItem}>
                    <Ionicons name="search" size={32} color="#fff" />
                    <Text style={styles.menuText}>Search Item</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.menuItem}>
                    <Ionicons name="cube" size={32} color="#fff" />
                    <Text style={styles.menuText}>Stock</Text>
                </TouchableOpacity>
                

            </View>
            <Modal
                transparent
                animationType="slide"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.title}>What would you like to do?</Text>

                        <TouchableOpacity
                            style={[styles.button, styles.downloadButton]}
                            onPress={() => navigation.navigate('UpdateMainStocks')}
                        >
                            <Text style={styles.buttonText}>📦 Update Stock</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.shareButton]}
                            onPress={() => navigation.navigate('MainStockList')}
                        >
                            <Text style={styles.buttonText}>📋 View Stock</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={[styles.cancelText]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121015',
        paddingTop: 50,
    },
    headerContainer: { marginBottom: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 20, },
    menuButton: { marginLeft: 15 },
    heading: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#fff" },

    headerText: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    menuItem: {
        width: '40%',
        aspectRatio: 1,
        backgroundColor: '#1f1f1f',
        marginBottom: 30,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    menuText: {
        color: '#fff',
        marginTop: 10,
        textAlign: 'center',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '85%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 24,
        color: '#222',
    },
    button: {
        paddingVertical: 14,
        borderRadius: 12,
        marginVertical: 8,
        alignItems: 'center',
    },
    downloadButton: {
        backgroundColor: '#388E3C', // deep green
    },
    shareButton: {
        backgroundColor: '#1976D2', // deep blue
    },
    cancelButton: {
        backgroundColor: '#f2f2f2',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    cancelText: {
        color: '#555',
        fontWeight: '600',
        fontSize: 16,
    },

});

export default Home;
