import React, { useState } from 'react';
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
    Modal,
    TextInput
} from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import API from '../components/API';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Checklist from '../components/Checklist';

const UpdateOrder = ({ navigation }) => {
    const { height: windowHeight } = useWindowDimensions();
    const selectedClient = useSelector((state) => state.clientData.selectedClient);
    const marka = selectedClient.marka;
    const client = selectedClient.client_name;
    const [headers, setHeaders] = useState([]);
    const [rows, setRows] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [proceeded, setProceeded] = useState(false);
    const [showEstimateModal, setShowEstimateModal] = useState(false);

    const [partNo, setPartNo] = useState('');
    const [description, setDescription] = useState('');
    const [qty, setQty] = useState('');

    /** File picker **/
    const handleFilePick = async () => {
        try {
            setLoading(true);
            const res = await pick({
                allowMultiSelection: false,
                type: [types.xlsx, types.xls],
            });

            if (!res || !res[0]) {
                Alert.alert('No file selected');
                return;
            }

            const file = res[0];
            setSelectedFile(file);

            const filePath = file.uri.replace('file://', '');
            const b64 = await RNFS.readFile(filePath, 'base64');

            const wb = XLSX.read(b64, { type: 'base64' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

            if (data.length === 0) {
                Alert.alert('No data found in file');
                return;
            }

            const headerRow = Object.keys(data[0]);
            const rowData = data.map(obj => headerRow.map(key => obj[key] ?? ''));

            setHeaders(headerRow);
            setRows(rowData);
            setProceeded(false); // reset checklist when new file picked
        } catch (err) {
            console.error('Error reading file:', err);
            Alert.alert('Error', 'Could not read or parse file');
        } finally {
            setLoading(false);
        }
    };

    const buildFormData = () => {
        const formData = new FormData();
        if (selectedFile) {
            formData.append('file', {
                uri: selectedFile.uri,
                name: selectedFile.name,
                type: selectedFile.mimeType || 'application/octet-stream',
            });
        } else {
            formData.append('data', JSON.stringify({ partNo, description, qty }));
        }
        formData.append('client_name', client);
        formData.append('marka', marka);
        return formData;
    };

    const handleFullUpload = async () => {
        try {
            setLoading(true);

            // 1. Upload file / manual data
            const formData = buildFormData();
            const uploadRes = await API.post('/api/orderitem/upload-excel/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (uploadRes.status !== 200) throw new Error('Upload failed');
            console.log("step upload-excel clear");

            // 2. Fetch estimate data
            const estimateRes = await API.post('/api/asstimate/genrate/', {
                client_name: client,
                marka: marka
            });
            if (estimateRes.status !== 200) throw new Error('Estimate fetch failed');
            console.log("step asstimate clear", estimateRes.data.missing_data);
            if (estimateRes.data?.missing_data) {
                const missing = Array.isArray(estimateRes.data.missing_data)
                    ? estimateRes.data.missing_data.join('\n') // each on new line
                    : String(estimateRes.data.missing_data);

                Alert.alert('The part number mentioned below is no longer serviceable please ', missing);
            }
            // 3. Sync stock once here
            await API.post('/api/packing/packing/sync-stock/');
            console.log("step sync-stock1 clear");
            // 4. Update order rows
            const updateRes = await API.post('/api/packing/packing/update_row_list/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (updateRes.status !== 200) throw new Error('Update failed');
            console.log("update_row_list");
            // 5. Final sync + navigate
            await API.post('/api/packing/packing/sync-stock/');
            console.log("step sync-stock2 clear");
            setShowEstimateModal(false)
            navigation.navigate('UploadedOrder');

        } catch (err) {
            console.error('Full upload error:', err.response?.data || err.message);
            Alert.alert('Error', err.response?.data?.message || 'Upload process failed');
        } finally {
            setLoading(false);
        }
    };



    return (
        <View style={styles.container}>


            {selectedFile && !proceeded ? (
                <Checklist name={['part_no', 'description', 'qty']} onProceed={() => setProceeded(true)} />
            ) : (
                <>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
                            <Icon name="menu" size={30} color="#000" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heading}>Upload Order</Text>
                        </View>
                    </View>
                    {!selectedFile && (
                        <View style={styles.centerMessageContainer}>
                            <Text style={styles.subtext}>Pick a file to update Order or use Single Order</Text>
                        </View>
                    )}
                    {headers.length > 0 && proceeded && (
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
                                    keyExtractor={(_, index) => `row-${index}`}
                                    style={{ maxHeight: windowHeight * 0.75 }}
                                    renderItem={({ item: row, index: rowIndex }) => (
                                        <View
                                            style={[
                                                styles.tableRow,
                                                rowIndex % 2 === 0 ? styles.rowEven : styles.rowOdd,
                                            ]}
                                        >
                                            {row.map((cell, cellIndex) => (
                                                <View key={cellIndex} style={styles.cellWrapper}>
                                                    <Text style={styles.cellText}>{cell}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                />
                            </View>
                        </ScrollView>
                    )}
                    <View style={styles.buttonRow}>

                        {!selectedFile && (
                            <>
                                <TouchableOpacity
                                    style={styles.uploadButton}
                                    onPress={() => setShowEstimateModal(true)}
                                    disabled={loading}
                                >
                                    <Text style={styles.buttonText}>Single Order</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.pickButton}
                                    onPress={handleFilePick}
                                    disabled={loading}
                                >
                                    <Text style={styles.buttonText}>Pick Order File</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        {selectedFile && (
                            <>
                                <TouchableOpacity
                                    style={styles.pickButton}
                                    onPress={handleFilePick}
                                    disabled={loading}
                                >
                                    <Text style={styles.buttonText}>Change File</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.uploadButton}
                                    onPress={handleFullUpload}
                                    disabled={loading}
                                >
                                    <Text style={styles.buttonText}>Upload File</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                    <Modal visible={showEstimateModal} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>

                                <Text style={styles.modalheading}>Order Details</Text>

                                <View style={{ marginTop: 20 }}>
                                    <Text style={{ fontSize: 18 }}>Part No :</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={partNo}
                                        placeholder='Enter Part No'
                                        placeholderTextColor={'#6e6d6dff'}
                                        onChangeText={(text) => setPartNo(text)}
                                    />
                                </View>

                                <View style={{ marginTop: 20 }}>
                                    <Text style={{ fontSize: 18 }}>Description :</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={description}
                                        placeholder='Enter Description'
                                        placeholderTextColor={'#6e6d6dff'}
                                        onChangeText={(text) => setDescription(text)}
                                    />
                                </View>

                                <View style={{ marginTop: 20 }}>
                                    <Text style={{ fontSize: 18 }}>Qty :</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={qty}
                                        placeholder='Enter Quantity'
                                        placeholderTextColor={'#6e6d6dff'}
                                        keyboardType="numeric"
                                        onChangeText={(text) => setQty(text)}
                                    />
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                                    <TouchableOpacity onPress={() => setShowEstimateModal(false)}>
                                        <Text style={[styles.pickButtonText, { color: 'red' }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleFullUpload}>
                                        <Text style={[styles.pickButtonText, { backgroundColor: '#315ff8ff' }]}>Submit</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#fff" />
                            <Text style={{ marginTop: 10, color: '#fff' }}>Please wait...</Text>
                        </View>
                    )}
                </>
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
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
        color: '#333',
    },
    subtext: { fontSize: 16, color: '#666', textAlign: 'center' },
    centerMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginTop: 5,
    },
    modalheading: {
        marginBottom: 10,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    pickButtonText: {
        padding: 10,
        borderRadius: 8,
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default UpdateOrder;
