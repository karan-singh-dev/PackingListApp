import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StyleSheet,
    useWindowDimensions,
    FlatList,
    Modal, TextInput
} from 'react-native';
import API from '../../components/API';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

const UploadedOrder = ({ navigation }) => {
    const { height: windowHeight } = useWindowDimensions();
    const selectedClient = useSelector((state) => state.clientData.selectedClient);



    const marka = selectedClient.marka;
    const client = selectedClient.client_name;


    const [headers, setHeaders] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [asstimate, setAstimate] = useState(false);



    const fetchDataFromAPI = async () => {
        try {
            setLoading(true);

            // Fetch order items
            const response = await API.get(`/api/orderitem/items/`, {
                params: { client_name: client, marka },
            });
            const data = response.data;
            console.log('order data ======>', data);

            if (!Array.isArray(data) || data.length === 0) {
                Alert.alert('No Data', 'No order items found for this client.');
                return;
            }

            const extractedHeaders = ['part_no', 'description', 'qty'];
            const extractedRows = data.map(item =>
                extractedHeaders.map(key => item[key] ?? '')
            );
            setHeaders(extractedHeaders);
            setRows(extractedRows);

            // Fetch estimate data
            const res = await API.get(`/api/asstimate/`, {
                params: { client_name: client, marka },
            });
            const newdata = res.data;
            console.log('estimate data ======>', newdata);

            // If estimate data exists → setAstimate(true)
            if (Array.isArray(newdata) && newdata.length > 0) {
                setAstimate(true);
            } else {
                setAstimate(false);
            }

        } catch (error) {
            console.error('API Fetch Error:', error.response?.data || error.message);
            Alert.alert('Error', 'Could not fetch estimate data');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDataFromAPI()
        }, [client, marka])
    );

    const generateEstimate = async () => {
        console.log(client, marka, selectedGSTs, rupees)

        try {
            setShowEstimateModal(false)
            setLoading(true)
            const res = await API.post('/api/asstimate/genrate/', {
                client_name: client,
                marka: marka,
            });

            if (res.status === 200) {
                console.log('hello', res);
                navigation.navigate('Estimate');

            } else {
                setLoading(false)
                Alert.alert('Error', 'Failed to generate estimate');
            }
        } catch (error) {
            setLoading(false)
            console.error('Estimate error:', error);
            Alert.alert('Error', 'Could not generate estimate');
        }
    };


    const renderRow = ({ item, index }) => (
        <View
            style={[
                styles.tableRow,
                index % 2 === 0 ? styles.rowEven : styles.rowOdd,
            ]}
        >
            {item.map((cell, cellIndex) => (
                <View key={cellIndex} style={styles.cellWrapper}>
                    <Text style={styles.cellText}>{cell}</Text>
                </View>
            ))}
        </View>
    );
    return (
        <View style={styles.container}>
            {headers.length > 0 && (
                <>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
                            <Icon name="menu" size={30} color="#000" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heading}>Order List</Text>
                        </View>
                    </View>
                    <ScrollView horizontal>
                        <View>

                            <View style={styles.tableRowHeader}>
                                {headers.map((header, index) => (
                                    <View key={index} style={styles.cellWrapper}>
                                        <Text style={styles.headerText}>{header}</Text>
                                    </View>
                                ))}
                            </View>


                            <FlatList
                                data={rows}
                                renderItem={renderRow}
                                keyExtractor={(_, index) => index.toString()}
                                style={{ maxHeight: windowHeight }}
                                showsVerticalScrollIndicator={true}
                            />
                        </View>
                    </ScrollView>
                </>
            )}
            <View style={styles.buttonRow}>
                {asstimate && (
                    <TouchableOpacity
                        style={styles.pickButton}
                        disabled={loading}
                        onPress={() => navigation.navigate('EstimateScreen')}
                    >
                        <Text style={styles.buttonText}>Go to Estimate</Text>
                    </TouchableOpacity>
                )}

                {!asstimate && (
                    <TouchableOpacity
                        style={[
                            styles.uploadButton,
                            { backgroundColor: 'rgba(16, 231, 27, 1)' },
                        ]}
                        disabled={loading}
                        onPress={generateEstimate} // Call API to generate estimate
                    >
                        <Text style={styles.uploadButtonText}>Generate Estimate</Text>
                    </TouchableOpacity>
                )}
            </View>


            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={{ marginTop: 10 }}>Please wait...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 20,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    menuButton: { marginRight: 10 },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
        color: '#333',
    },
    subtext: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    centerMessageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginVertical: 12,
        textAlign: 'center',
    },
    tableRowHeader: {
        flexDirection: 'row',
        backgroundColor: '#2196F3',
    },
    tableRow: {
        flexDirection: 'row',
    },
    cellWrapper: {
        width: 150,
        padding: 10,
        borderRightWidth: 1,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowEven: {
        backgroundColor: '#f9f9f9',
    },
    rowOdd: {
        backgroundColor: '#e6f2ff',
    },
    headerText: {
        fontWeight: 'bold',
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
    },
    cellText: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 20,
        paddingHorizontal: 10,
    },
    pickButton: {
        flex: 1,
        backgroundColor: '#007bff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    uploadButton: {
        flex: 1,
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
    },
    dropdown: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginTop: 10,
        width: '40%'
    },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginTop: 5,
    },
    label: {
        fontWeight: '600',
        marginBottom: 4,
    },
    removeIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    modalheading: {
        marginBottom: 10,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center'
    },
    dollarBox: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center',

    },
    dollarmain: {
        borderTopColor: '#ccc',
        borderTopWidth: 1,
        marginTop: 20,
    },
    dollerMainHeading: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '600'
    },
    pickButtonText: {
        padding: 10,
        borderRadius: 8,
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
    }



});
export default UploadedOrder;
