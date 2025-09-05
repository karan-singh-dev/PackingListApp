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
import * as ExcelJS from 'exceljs';
import RNFS from 'react-native-fs';
import API from '../../components/API';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Checklist from '../../components/Checklist';
import LinearGradient from 'react-native-linear-gradient';

const UpdateOrder = ({ navigation }) => {
    const { height: windowHeight } = useWindowDimensions();
    const selectedClient = useSelector((state) => state?.clientData?.selectedClient);
    const marka = selectedClient?.marka;
    const client = selectedClient?.client_name;
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

            const binary = global.atob(b64);
            const buffer = new ArrayBuffer(binary.length);
            const view = new Uint8Array(buffer);
            for (let i = 0; i < binary.length; i++) {
                view[i] = binary.charCodeAt(i);
            }

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                Alert.alert('Error', 'No worksheet found in file');
                return;
            }

            const rows = [];
            worksheet.eachRow({ includeEmpty: true }, (row) => {
                rows.push(row.values.slice(1));
            });

            if (rows.length === 0) {
                Alert.alert('No data found in file');
                return;
            }

            const headerRow = rows[0].map(h => h?.toString() || '');
            const rowData = rows.slice(1);

            setHeaders(headerRow);
            setRows(rowData);
            setProceeded(false);
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

            const formData = buildFormData();
            const uploadRes = await API.post('/api/orderitem/upload-excel/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log("Upload Response:", uploadRes.data);
            if (uploadRes.status !== 200) throw new Error('Upload failed');

            const estimateRes = await API.post('/api/asstimate/genrate/', {
                client_name: client,
                marka: marka
            });
            console.log("Estimate Generation Response:", estimateRes.data);
            if (estimateRes.status !== 200) throw new Error('Estimate fetch failed');

            if (estimateRes.data?.missing_data && estimateRes.data.missing_data.length > 0) {
                const missing = Array.isArray(estimateRes.data.missing_data)
                    ? estimateRes.data.missing_data.join('\n')
                    : String(estimateRes.data.missing_data);

                Alert.alert(
                    null,
                    `The part number mentioned below is no longer serviceable.\n\nPlease note this part no.\n${missing}`
                );
            }

            const updateRes = await API.post('/api/packing/packing/update_row_list/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (updateRes.status !== 200) throw new Error('Update failed');
            console.log("Update Response:", updateRes.data);
            await API.post('/api/packing/packing/sync-stock/');
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
        <LinearGradient colors={['#012B4B', '#004C8C']} style={styles.container}>
            {selectedFile && !proceeded ? (
                <Checklist name={['part_no', 'description', 'qty']} onProceed={() => setProceeded(true)} />
            ) : (
                <>
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
                            <Icon name="menu" size={30} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.heading}>Update Order</Text>
                    </View>

                    {!selectedFile && (
                        <View style={styles.centerMessageContainer}>
                            <Text style={styles.subtext}>Pick a file to update Order or use Single Order</Text>
                        </View>
                    )}

                    {headers.length > 0 && proceeded && (
                        <ScrollView horizontal>
                            <View style={styles.tableCard}>
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

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        {!selectedFile && (
                            <>
                                <TouchableOpacity onPress={() => setShowEstimateModal(true)} disabled={loading}>
                                    <LinearGradient colors={['#007bff', '#0056b3']} style={styles.gradientBtn}>
                                        <Text style={styles.buttonText}>Single Order</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleFilePick} disabled={loading}>
                                    <LinearGradient colors={['#007bff', '#0056b3']} style={styles.gradientBtn}>
                                        <Text style={styles.buttonText}>Pick Order File</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}
                        {selectedFile && (
                            <>
                                <TouchableOpacity onPress={handleFilePick} disabled={loading}>
                                    <LinearGradient colors={['#007bff', '#0056b3']} style={styles.gradientBtn}>
                                        <Text style={styles.buttonText}>Change File</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleFullUpload} disabled={loading}>
                                    <LinearGradient colors={['#28a745', '#1e7e34']} style={styles.gradientBtn}>
                                        <Text style={styles.buttonText}>Upload File</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* Modal */}
                    <Modal visible={showEstimateModal} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalHeading}>Order Details</Text>

                                <View style={{ marginTop: 15 }}>
                                    <Text style={styles.inputLabel}>Part No :</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={partNo}
                                        placeholder='Enter Part No'
                                        placeholderTextColor={'#6e6d6dff'}
                                        onChangeText={(text) => setPartNo(text)}
                                    />
                                </View>

                                <View style={{ marginTop: 15 }}>
                                    <Text style={styles.inputLabel}>Description :</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={description}
                                        placeholder='Enter Description'
                                        placeholderTextColor={'#6e6d6dff'}
                                        onChangeText={(text) => setDescription(text)}
                                    />
                                </View>

                                <View style={{ marginTop: 15 }}>
                                    <Text style={styles.inputLabel}>Qty :</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={qty}
                                        placeholder='Enter Quantity'
                                        placeholderTextColor={'#6e6d6dff'}
                                        keyboardType="numeric"
                                        onChangeText={(text) => setQty(text)}
                                    />
                                </View>

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity onPress={() => setShowEstimateModal(false)}>
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={handleFullUpload}>
                                        <LinearGradient colors={['#ff512f', '#dd2476']} style={styles.modalButton}>
                                            <Text style={styles.modalButtonText}>Submit</Text>
                                        </LinearGradient>
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
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
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
        color: '#fff',
    },
    subtext: { fontSize: 16, color: '#ddd', textAlign: 'center' },
    centerMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tableCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    tableRowHeader: { flexDirection: 'row', backgroundColor: '#2196F3', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
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
    buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10, paddingHorizontal: 10 },
   gradientBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
},

    buttonText: { 
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
},

    loadingOverlay: {
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,50,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 999,
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
    modalHeading: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 10,
    },
    inputLabel: { fontSize: 16, marginBottom: 5 },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        alignItems: 'center',
    },
    cancelText: { color: 'red', fontSize: 15, fontWeight: '600' },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default UpdateOrder;
