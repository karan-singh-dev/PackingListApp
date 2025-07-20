import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { resetClients } from '../../redux/ClientDataSlice';
import { useFocusEffect } from '@react-navigation/native';


const Home = ({ navigation }) => {
    const dispatch = useDispatch();


    
useFocusEffect(
  useCallback(() => {
    dispatch(resetClients());
   
  }, [dispatch])
);

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.openDrawer()} style={[styles.menuButton,]}>
                    <Icon name="menu" size={30} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.heading}>Export Invoice Maker</Text>
                </View>
            </View>
            <View style={styles.menuGrid}>
                <TouchableOpacity style={[styles.menuItem]} onPress={()=>navigation.navigate('CommercialInvoice')}
                >
                    <MaterialIcons name="receipt" size={32} color="#fff" />
                    <Text style={styles.menuText}>Commercial Invoice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuItem]}
                onPress={()=>navigation.navigate('PerformaInvoice')}
                >
                    <MaterialIcons name="description" size={32} color="#fff" />
                    <Text style={styles.menuText}>Proforma Invoice</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Packing')} style={[styles.menuItem]}
                >
                    <MaterialIcons name="playlist-add-check" size={32} color="#fff" />
                    <Text style={styles.menuText}>Packing List</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('CreateClient')} style={styles.menuItem}>
                    <Ionicons name="person-add" size={32} color="#fff" />
                    <Text style={styles.menuText}>Create Client</Text>
                </TouchableOpacity>
            </View>
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
});

export default Home;
