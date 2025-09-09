import React, { useCallback, useRef, useState } from 'react';
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
    const [oldQty, setOldQty] = useState('');
    const [orderdata, setOrderData] = useState([]);
    const [updatePartNo, setUpdatePartNo] = useState(null);
    const [updateQty, setUpdateQty] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [updatingRow, setUpdatingRow] = useState(null); // NEW: Track row-level loading
    const [searchText, setSearchText] = useState('');
const totalQuantity = rows.reduce((sum, row) => sum + (parseInt(row[2], 10) || 0), 0);
    const user = useSelector((state) => state.userInfo.user);
    const flatListRef = useRef(null);

    // Fetch data
    const fetchDataFromAPI = async () => {
        try {
            if (isEditing) return;
            setLoading(true);

            const response = await API.get('/api/orderitem/items/', {
                params: { client_name: client, marka },
            });
            const data = response.data;
            setOrderData(data);
            console.log(data, '<-- fetched order data');
            setLoading(false);

            if (!Array.isArray(data) || data.length === 0) {
                setHeaders([]);
                setRows([]);
                return;
            }

            let extractedHeaders = ['part_no', 'description', 'qty'];
            if (user?.permission) extractedHeaders.push('Action');

            const extractedRows = data.map(item => [
                item.part_no ?? '',
                item.description ?? '',
                item.qty ?? '',
            ]);

            setHeaders(extractedHeaders);
            setRows(extractedRows);

            const res = await API.get('/api/asstimate/', {
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
            if (!isEditing) fetchDataFromAPI();
        }, [client, marka, isEditing])
    );

    // Generate estimate (unchanged)
    const generateEstimate = async () => {
        try {
            setLoading(true);
            const response = await API.get('/api/asstimate/', {
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

    // Update quantity with full chain
    const handleUpdate = async (part_no, description) => {
        const qtyValue = parseInt(updateQty, 10);
        if (isNaN(qtyValue)) {
            Alert.alert('Invalid Quantity', 'Please enter a valid number.');
            return;
        }

        try {
            setUpdatingRow(part_no);
            setLoading(true);
            // 1️⃣ Fetch packing details to validate stock
            const { data: packingData } = await API.get('/api/packing/packing/', {
                params: { client, marka },
            });

            const packingItem = Array.isArray(packingData)
                ? packingData.find(item => item.part_no === part_no)
                : null;

            const packing_qty = packingItem ? packingItem.qty || 0 : 0;
            const new_qty = qtyValue + packing_qty - Number(oldQty);
           
            if (new_qty < 0) {
                Alert.alert('Invalid Quantity', 'Quantity cannot be negative.');
                setUpdatingRow(null);
                return;
            }

            // 2️⃣ Update quantity
            await API.post('/api/orderitem/items/update-qty/', {
                partNo: part_no,
                qty: qtyValue,
                client_name: client,
                marka: marka,
            });

            // 3️⃣ Generate new estimate
            await API.post('/api/asstimate/genrate/', {
                client_name: client,
                marka: marka,
            });

            // 4️⃣ Update packing row
            const formData = new FormData();
            formData.append('client_name', client);
            formData.append('marka', marka);
            formData.append('data', JSON.stringify({ part_no, qty: new_qty, description }));

            await API.post('/api/packing/packing/update_row_list/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (new_qty === 0) {
                // Handle case where new quantity is zero
                const deleteRes = await API.post('/api/packing/packing/delete-by-partno/', {
                    part_no: part_no,
                    client,
                    marka,
                });
                console.log('Delete API success:', deleteRes.status);
            }
            // 5️⃣ Sync stock
            await API.post('/api/packing/packing/sync-stock/');

            // 6️⃣ Refresh list with updated values
            await fetchDataFromAPI();

            // 7️⃣ Reset edit states
            setUpdatePartNo(null);
            setUpdateQty('');
            setIsEditing(false);
            setLoading(false);
        } catch (error) {
            console.error('Update Error:', error);
            Alert.alert('Error', 'Failed to update order.');
            setLoading(false);
        } finally {
            setUpdatingRow(null);
            setLoading(false);
        }
    };

    const renderRow = ({ item, index }) => {
        const part_no = item[0];
        const description = item[1];
        const qty = item[2];
        const isRowUpdating = updatingRow === part_no;

        return (
            <View
                style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.rowEven : styles.rowOdd,
                ]}
            >
                  <View style={[styles.cellWrapper,{width: 50}]}><Text style={styles.cellText}>{index + 1}</Text></View>
                <View style={styles.cellWrapper}><Text style={styles.cellText}>{part_no}</Text></View>
                <View style={styles.cellWrapper}><Text style={styles.cellText}>{description}</Text></View>
                <View style={styles.cellWrapper}><Text style={styles.cellText}>{qty}</Text></View>

                {user.permission && (
                    <View style={styles.cellWrapper}>
                        {updatePartNo === part_no ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TextInput
                                    style={styles.updateInput}
                                    keyboardType="numeric"
                                    value={updateQty}
                                    onChangeText={setUpdateQty}
                                    onFocus={() => setIsEditing(true)}
                                    placeholder="Qty"
                                    placeholderTextColor="#888"
                                />
                                <TouchableOpacity
                                    style={[styles.pickButton, { backgroundColor: '#28a745', marginLeft: 5 }]}
                                    onPress={() => handleUpdate(part_no, description)}
                                    disabled={isRowUpdating}
                                >
                                    {isRowUpdating ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={{ color: '#fff', fontSize: 12 }}>Save</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.pickButton, { backgroundColor: '#007bff', padding: 5 }]}
                                onPress={() => {
                                    setUpdatePartNo(part_no);
                                    setUpdateQty(String(qty));
                                    setOldQty(Number(qty));
                                    setIsEditing(true);
                                }}
                            >
                                <Text style={{ color: '#fff', fontSize: 12 }}>Update</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {headers.length > 0 ? (
                <>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
                            <Icon name="menu" size={30} color="#ffffffff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heading}>Order List</Text>
                        </View>
                    </View>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 15, backgroundColor: '#1E3A8A' }}>
                        <TextInput
                            placeholder="Search by Part No or Description..."
                            placeholderTextColor="#aaa"
                            value={searchText}
                            onChangeText={setSearchText}
                            style={{
                                borderWidth: 1,
                                borderColor: '#ccc',
                                borderRadius: 8,
                                padding: 10,
                                fontSize: 16,
                                color: '#ccc',
                                backgroundColor: '#1E3A8A'
                            }}
                        />
                    </View>

                    <ScrollView horizontal keyboardDismissMode="none">
                        <View>
                            <View style={styles.tableRowHeader}>
                                 <View style={[styles.cellWrapper, { width: 50, marginVertical: 0 }]}>
                                                  <Text style={styles.headerText}>Sr No.</Text>
                                                </View>
                                {headers.map((header, index) => (
                                    <View key={index} style={[styles.cellWrapper, { marginVertical: 0 }]}>
                                        <Text style={styles.headerText}>{header}</Text>
                                    </View>
                                ))}
                            </View>
                            <FlatList
                                data={rows.filter(item =>
                                    item[0]?.toLowerCase().includes(searchText.toLowerCase()) ||
                                    item[1]?.toLowerCase().includes(searchText.toLowerCase())
                                )}
                                keyExtractor={(item, index) => item[0] + index}
                                renderItem={renderRow}
                                keyboardShouldPersistTaps="always"
                                removeClippedSubviews={false}
                            />

                        </View>

                    </ScrollView>
                        <View style={{marginHorizontal: 10,padding: 10, backgroundColor: '#f4f6f9', borderTopWidth: 1, borderColor: '#e5e7eb', alignItems: 'center'}}>
                            <Text style={{ color: '#555', fontSize: 15 }}>Total Quantity: {totalQuantity}</Text>
                        </View>
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
    container: { flex: 1, backgroundColor: '#f4f6f9' }, // light neutral bg
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 20,
        paddingHorizontal: 10,

        backgroundColor: '#1E3A8A', // dark blue header
    },
    menuButton: { marginRight: 10 },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
        color: '#fff', // white heading
    },
    tableRowHeader: {
        flexDirection: 'row',
        backgroundColor: '#2196F3', // blue

    },
    tableRow: { flexDirection: 'row' },
    cellWrapper: {
        width: 150,
        padding: 10,
        marginVertical: 5,
        borderRightWidth: 1,
        borderColor: '#e5e7eb', // soft gray borders
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowEven: { backgroundColor: '#f9fafb' }, // light gray
    rowOdd: { backgroundColor: '#eef2ff' }, // soft blue
    headerText: {
        fontWeight: 'bold',
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
    },
    cellText: { fontSize: 12, color: '#374151', textAlign: 'center' },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 20,
        paddingHorizontal: 10,
    },
    pickButton: {
        backgroundColor: '#2563EB', // blue button
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    updateInput: {
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 4,
        height: 36,
        fontSize: 13,
        textAlign: 'center',
        backgroundColor: '#f9fafb',
        paddingHorizontal: 8,
        color: '#111827',
        minWidth: 60,
        marginRight: 6,
    },
    goEstimateButton: {
        backgroundColor: '#2563EB', // primary blue
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    goEstimateText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    uploadButton: {
        flex: 1,
        backgroundColor: '#16A34A', // green
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    uploadButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
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
});


export default UploadedOrder;
