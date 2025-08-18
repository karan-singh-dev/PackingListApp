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
    TextInput,
} from 'react-native';
import API from '../../components/API';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

const UploadedOrder = ({ navigation }) => {
    const { height: windowHeight } = useWindowDimensions();
    const selectedClient = useSelector((state) => state?.clientData?.selectedClient);

    const marka = selectedClient?.marka;
    const client = selectedClient?.client_name;

    const [headers, setHeaders] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [asstimate, setAstimate] = useState(false);

    const [updatePartNo, setUpdatePartNo] = useState(null);
    const [updateQty, setUpdateQty] = useState('');
    const user = useSelector(state => state.userInfo.user)

    const fetchDataFromAPI = async () => {
        try {
            setLoading(true);

            const response = await API.get(`/api/orderitem/items/`, {
                params: { client_name: client, marka },
            });
            const data = response.data;
            console.log('Fetched Data:', data);
            setLoading(false);
            if (!Array.isArray(data) || data.length === 0) {
                setHeaders([]);
                setRows([]);
                return;
            }

            // Add "Action" column for update button
            let extractedHeaders = ['part_no', 'description', 'qty'];
            if (user?.is_staff) {
                extractedHeaders.push('Action');
            }
            const extractedRows = data.map(item => [
                item.part_no ?? '',
                item.description ?? '',
                item.qty ?? '',
            ]);
            setHeaders(extractedHeaders);
            setRows(extractedRows);

            // Fetch estimate data
            const res = await API.get(`/api/asstimate/`, {
                params: { client_name: client, marka },
            });
            const newdata = res.data;
            setAstimate(Array.isArray(newdata) && newdata.length > 0);

        } catch (error) {
            console.error('API Fetch Error:', error.response?.data || error.message);
            Alert.alert('Error', 'Could not fetch estimate data');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDataFromAPI();
        }, [client, marka])
    );

    const generateEstimate = async () => {
        try {
            setLoading(true);
            const response = await API.get(`/api/asstimate/`, {
                params: { client_name: client, marka },
            });

            if (response.status === 200) {
                navigation.navigate('Estimate');
            } else {
                Alert.alert('Error', 'Failed to generate estimate');
            }
        } catch (error) {
            console.error('Estimate error:', error);
            Alert.alert('Error', 'Could not generate estimate');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (part_no) => {
        console.log(part_no,' part_no');
        const qtyValue = parseInt(updateQty, 10);
        if (isNaN(qtyValue)) {
            Alert.alert('Invalid Quantity', 'Please enter a valid number.');
            return;
        }

        try {
            const response = await API.post("/api/orderitem/items/update-qty/", {
                partNo: part_no,
                qty: parseInt(updateQty),
                client_name:client,
                marka:marka,
            });

            Alert.alert('Update Stock', response.data.message);
            setUpdatePartNo(null);
            setUpdateQty('');
            fetchDataFromAPI();
        } catch (error) {
            Alert.alert('Error', 'Failed to update order.');
            console.error(error);
        }
    };

    const renderRow = ({ item, index }) => {
        const part_no = item[0];
        const qty = item[2];

        return (
            <View
                style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.rowEven : styles.rowOdd,
                ]}
            >
                <View style={styles.cellWrapper}><Text style={styles.cellText}>{part_no}</Text></View>
                <View style={styles.cellWrapper}><Text style={styles.cellText}>{item[1]}</Text></View>
                <View style={styles.cellWrapper}><Text style={styles.cellText}>{qty}</Text></View>

                {user.is_staff && (<View style={styles.cellWrapper}>
                    {updatePartNo === part_no ? (
                        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                            <TextInput
                                style={styles.updateInput}
                                keyboardType="numeric"
                                value={updateQty}
                                onChangeText={setUpdateQty}
                                placeholder="Qty"
                                placeholderTextColor="#888"
                            />
                            <TouchableOpacity
                                style={[styles.pickButton, { backgroundColor: '#28a745', marginLeft: 5 }]}
                                onPress={() => handleUpdate(part_no)}
                            >
                                <Text style={{ color: '#fff', fontSize: 12 }}>Save</Text>
                            </TouchableOpacity>
                        </View>

                    ) : (
                        <TouchableOpacity
                            style={[styles.pickButton, { backgroundColor: '#007bff', padding: 5 }]}
                            onPress={() => {
                                setUpdatePartNo(part_no);
                                setUpdateQty(String(qty));
                            }}
                        >
                            <Text style={{ color: '#fff', fontSize: 12 }}>Update</Text>
                        </TouchableOpacity>
                    )}
                </View>)}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {headers.length > 0 ? (
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

                    <View style={styles.buttonRow}>
                        {asstimate ? (
                            <TouchableOpacity
                                style={styles.goEstimateButton}
                                disabled={loading}
                                onPress={() => navigation.navigate('Estimate')}
                            >
                                <Text style={styles.goEstimateText}>Go to Estimate</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.uploadButton, { backgroundColor: 'rgba(16, 231, 27, 1)' }]}
                                disabled={loading}
                                onPress={generateEstimate}
                            >
                                <Text style={styles.uploadButtonText}>Generate Estimate</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                </>
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>No Data Found</Text>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Please Upload Order</Text>
                </View>
            )}

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
    container: { flex: 1, backgroundColor: '#fff' },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 20,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    menuButton: { marginRight: 10 },
    heading: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', flex: 1, color: '#333' },
    tableRowHeader: { flexDirection: 'row', backgroundColor: '#2196F3' },
    tableRow: { flexDirection: 'row' },
    cellWrapper: {
        width: 150,
        padding: 10,
        borderRightWidth: 1,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowEven: { backgroundColor: '#f9f9f9' },
    rowOdd: { backgroundColor: '#e6f2ff' },
    headerText: { fontWeight: 'bold', color: '#fff', fontSize: 12, textAlign: 'center' },
    cellText: { fontSize: 12, color: '#333', textAlign: 'center' },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 20,
        paddingHorizontal: 10,
    },
    pickButton: {
        backgroundColor: '#007bff',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadButton: {
        flex: 1,
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
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
    uploadButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 5,
    },
    // In styles:
    pickButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    updateInput: {
        borderColor: '#ccc',        // Softer border so it blends with table
        borderWidth: 1,
        borderRadius: 4,
        height: 36,
        fontSize: 13,
        textAlign: 'center',
        backgroundColor: '#f9f9f9', // Light background for subtle contrast
        paddingHorizontal: 8,
        color: '#333',
        minWidth: 60,               // Prevents shrinking too small
        marginRight: 6,             // Space between input & button
    },

    goEstimateButton: {
        backgroundColor: '#007bff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    goEstimateText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

});

export default UploadedOrder;
