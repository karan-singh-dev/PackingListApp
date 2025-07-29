import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import ClientSelection from '../../components/ClintSelection';
import API from '../../components/API';
import { useExcelExporter } from "../../components/useExcelExporter";

import * as XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const PerformaInvoice = ({ navigation }) => {
  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const client = selectedClient?.client_name || '';
  const marka = selectedClient?.marka || '';
  const isClientSelected = !!client;

  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [order, setOrder] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  // const { generateExcelFile, shareExcelFile } = useExcelExporter();

  // console.log(selectedClient);
  // console.log(userData);

  const fetchOrderData = async () => {
    // Prevent API call if client or marka is missing
    if (!client || !marka) {
      console.log("Skipping fetch: client or marka missing");
      return;
    }

    try {
      setLoading(true);

      const orderRes = await API.get(`/api/orderitem/items/`, {
        params: { client_name: client, marka },
      });

      const data = orderRes.data;
      console.log('order data ======>', data);

      if (!Array.isArray(data) || data.length === 0) {
        Alert.alert('No Data', 'No order items found for this client. Please upload order first');
        setOrder(true); // reset to empty
      }

    } catch (error) {
      console.error('Fetch Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load order items');
    } finally {
      setLoading(false); // always stop loading
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [client, marka]);


  /** Fetch user + invoice data after generation */
  const fetchUserAndInvoice = async () => {
    try {


      const userRes = await API.get('/api/user/users/me');
      setUserData(userRes.data);

      const invoiceRes = await API.get('/api/invoice/invoiceGenrate/', {
        params: { client, marka },
      });
      setInvoiceData(invoiceRes.data);
      setInvoiceGenerated(true);
    } catch (error) {
      console.error('Fetch Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load invoice data');
    }
  };




  /** Generate invoice API */
  const generateInvoice = async () => {
    try {
      setLoading(true);
      const res = await API.post('/api/invoice/invoiceGenrate/', {
        client,
        marka,
      });

      if (res.status === 200) {
        await fetchUserAndInvoice();
      } else {
        Alert.alert('Error', 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Generation Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Could not generate invoice');
    } finally {
      setLoading(false);
    }
  };




  const generateMergedExcel = async ({ exporter, buyer, items, fileName }) => {
    try {
      // 1. Prepare worksheet data
      const wsData = [
        ['Proforma Invoice', '', '', '', '', '', ''],
        ...Array.from({ length: Math.max(exporter.rows.length, buyer.rows.length) }, (_, i) => [
          exporter.rows[i] || '', '', '', buyer.rows[i] || '', '', '', ''
        ]),
        ['Parts and Accessories of Two Wheeler', '', '', '', '', '', ''],
        items.headers,
        ...items.rows
      ];

      // 2. Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // 3. Set column widths
      ws['!cols'] = Array(7).fill({ wch: 20 });

      // 4. Define merges
      const maxRows = Math.max(exporter.rows.length, buyer.rows.length);
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title row
        { s: { r: maxRows + 1, c: 0 }, e: { r: maxRows + 1, c: 6 } }, // Parts row
        ...Array.from({ length: maxRows }, (_, i) => [
          { s: { r: i + 1, c: 0 }, e: { r: i + 1, c: 2 } }, // Exporter
          { s: { r: i + 1, c: 3 }, e: { r: i + 1, c: 6 } }  // Buyer
        ]).flat()
      ];

      // 5. Apply styles - CRITICAL SECTION
      const applyStyle = (cell, style) => {
        if (!ws[cell]) ws[cell] = { t: 's', v: wsData[cell.r][cell.c] };
        ws[cell].s = style;
      };

      // Title style
      applyStyle(XLSX.utils.decode_cell('A1'), {
        font: { bold: true, sz: 20 },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { patternType: 'solid', fgColor: { rgb: 'FFFF00' } },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      });

      // Parts style
      const partsCell = XLSX.utils.encode_cell({ r: maxRows + 1, c: 0 });
      applyStyle(XLSX.utils.decode_cell(partsCell), {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { patternType: 'solid', fgColor: { rgb: '00FF00' } },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      });

      // Headers style
      const headerRow = maxRows + 2;
      items.headers.forEach((_, c) => {
        applyStyle({ r: headerRow, c }, {
          font: { bold: true },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { patternType: 'solid', fgColor: { rgb: 'D3D3D3' } },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        });
      });

      // --- WRITE FILE (REACT NATIVE COMPATIBLE) ---
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invoice');

      // 1. First write to base64
      const base64 = XLSX.write(wb, {
        type: 'base64',
        bookType: 'xlsx'
      });

      // 2. Determine file path
      const path = Platform.OS === 'ios'
        ? `${RNFS.TemporaryDirectoryPath}/${fileName}`
        : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      // 3. Write file using RNFS
      await RNFS.writeFile(path, base64, 'base64');

      // 4. Share the file
      await Share.open({
        url: `file://${path}`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: fileName,
      });

    } catch (err) {
      console.error('Excel generation error:', err);
      throw err; // Re-throw for error handling
    }
  };

  // ====== Handle Download ======
  const handleDownloadInvoice = () => {
    // Prepare exporter data
    const exporterData = {
      rows: Object.entries({
        Exporter: userData?.username,
        'Exporter Ref No': userData?.exporter_reference_number,
        PAN: userData?.pan,
        IEC: userData?.iec,
        'Bank Name': userData?.bank_name,
        'Account Name': userData?.account_name,
        'Account Number': userData?.account_number,
        'IFSC Code': userData?.ifsc_code,
        'AD Code': userData?.ad_code,
        'Swift Code': userData?.swift_code,
      }).map(([k, v]) => `${k}: ${v || ''}`)
    };

    // Prepare buyer data
    const buyerData = {
      rows: Object.entries({
        'Performa Invoice': 1,
        Buyer: selectedClient?.client_name,
        Address: selectedClient?.address,
        'Vessel No': selectedClient?.vessel_no,
        'Port of Loading': selectedClient?.port_of_loading,
        'Terms of Payment': selectedClient?.terms_of_payment,
        'Delivery Terms': selectedClient?.delivery_terms,
        'Port of Discharge': selectedClient?.port_of_discharge,
        'Final Destination': selectedClient?.final_destination,
      }).map(([k, v]) => `${k}: ${v || ''}`)
    };

    // Prepare items table
    const itemsData = {
      headers: ['S.No', 'Part No', 'Description', 'HSN Code', 'Qty', 'Per Unit', 'Total Amt'],
      rows: invoiceData.map((item, index) => [
        index + 1,
        item.part_no || '',
        item.description || '',
        item.hsn || '',
        item.qty || '',
        item.per_unit || '',
        item.total_amt || ''
      ])
    };

    const fileName = `ProformaInvoice_${Date.now()}.xlsx`;

    generateMergedExcel({
      exporter: exporterData,
      buyer: buyerData,
      items: itemsData,
      fileName,
    });
  };


  return (
    <View style={styles.container}>
      {!isClientSelected ? (
        <ClientSelection />
      ) : (
        <>
          {/* Conditional Top Heading */}
          {!invoiceData && (
            <Text style={styles.topHeading}>Proforma Invoice</Text>
          )}

          {/* Horizontal Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            {/* Content Scroll */}
            {invoiceData && invoiceData.length > 0 && (
              <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Center heading inside details */}
                <Text style={styles.heading}>Proforma Invoice</Text>

                {/* Details Row */}
                <View style={styles.detailsRow}>
                  {/* Exporter */}
                  <View style={styles.detailTable}>
                    <View style={styles.detailRow}>
                      <Text style={styles.value}>Exporter :</Text>
                      <Text style={styles.value}>{userData?.username || ''}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.value}>Exporter Ref No :</Text>
                      <Text style={styles.value}>{userData?.exporter_reference_number || ''}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.value}>PAN :</Text>
                      <Text style={styles.value}>{userData?.pan || ''}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.value}>IEC :</Text>
                      <Text style={styles.value}>{userData?.iec || ''}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.value}>Bank Name :</Text>
                      <Text style={styles.value}>{userData?.bank_name || ''}</Text>
                      <Text style={styles.value}>Account Name :</Text>
                      <Text style={styles.value}>{userData?.account_name || ''}</Text>
                      <Text style={styles.value}>Account Number :</Text>
                      <Text style={styles.value}>{userData?.account_number || ''}</Text>
                      <Text style={styles.value}>IFSC Code :</Text>
                      <Text style={styles.value}>{userData?.ifsc_code || ''}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.value}>AD Code :</Text>
                      <Text style={styles.value}>{userData?.ad_code || ''}</Text>
                    </View>

                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.value}>Swift Code :</Text>
                      <Text style={styles.value}>{userData?.swift_code || ''}</Text>
                    </View>
                  </View>

                  {/* Buyer */}
                  <View style={styles.detailTable}>
                    <View style={styles.detailRow}>
                      <Text style={styles.value}>Buyer :</Text>
                      <Text style={styles.value}>{selectedClient?.client_name || ''}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.value}>Address :</Text>
                      <Text style={styles.value}>{selectedClient?.address || ''}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.value}>Vessel No :</Text>
                      <Text style={styles.value}>{selectedClient?.vessel_no || ''}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.value}>Port of Loading :</Text>
                      <Text style={styles.value}>{selectedClient?.port_of_loading || ''}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.value}>Terms of Payment :</Text>
                      <Text style={styles.value}>{selectedClient?.terms_of_payment || ''}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.value}>Delivery Terms :</Text>
                      <Text style={styles.value}>{selectedClient?.delivery_terms || ''}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.value}>Port of Discharge :</Text>
                      <Text style={styles.value}>{selectedClient?.port_of_discharge || ''}</Text>
                    </View>

                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.value}>Final Destination :</Text>
                      <Text style={styles.value}>{selectedClient?.final_destination || ''}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.sectionHeading}>
                  Parts and Accessories of Two Wheeler
                </Text>

                {/* Table Header */}
                <View style={styles.tableHeaderDynamic}>
                  <Text style={[styles.cellHeaderDynamic, styles.srNoWidth]}>S.No</Text>
                  <Text style={styles.cellHeaderDynamic}>Part No</Text>
                  <Text style={[styles.cellHeaderDynamic, styles.descriptionWidth, styles.leftAlign]}>
                    Description
                  </Text>
                  <Text style={styles.cellHeaderDynamic}>HSN Code</Text>
                  <Text style={styles.cellHeaderDynamic}>Qty</Text>
                  <Text style={styles.cellHeaderDynamic}>Per Unit</Text>
                  <Text style={styles.cellHeaderDynamic}>Total Amt</Text>
                </View>

                {/* Table Rows */}
                {invoiceData.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tableRowDynamic,
                      index % 2 === 0 && { backgroundColor: '#f9f9f9' },
                    ]}
                  >
                    <Text style={[styles.cellDynamic, styles.srNoWidth]}>{index + 1}</Text>
                    <Text style={styles.cellDynamic}>{item.part_no}</Text>
                    <Text style={[styles.cellDynamic, styles.descriptionWidth, styles.leftAlign]}>
                      {item.description}
                    </Text>
                    <Text style={styles.cellDynamic}>{item.hsn}</Text>
                    <Text style={styles.cellDynamic}>{item.qty}</Text>
                    <Text style={styles.cellDynamic}>{item.per_unit}</Text>
                    <Text style={styles.cellDynamic}>{item.total_amt}</Text>
                  </View>
                ))}

              </ScrollView>
            )}


          </ScrollView>

          {/* Button */}
          <TouchableOpacity
            style={styles.fixedButton}
            onPress={
              order
                ? () => navigation.navigate('AppDrawer', { screen: 'OrderUpload' })
                : invoiceGenerated
                  ? handleDownloadInvoice
                  : generateInvoice
            }
          >
            <Text style={styles.buttonText}>
              {order ? 'Order Upload' : invoiceGenerated ? 'Download Invoice' : 'Generate Invoice'}
            </Text>
          </TouchableOpacity>
          {loading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color="#244cfcff" />
            </View>
          )}
        </>
      )}

    </View>
  );


};

export default PerformaInvoice;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f3f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
    color: '#333',
    textTransform: 'uppercase',
  },
  srNoWidth: {
    width: 50,
    minWidth: 50,
    textAlign: 'center',
  },
  descriptionWidth: {
    width: 200,
    minWidth: 200,
  },

  topHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 14,
    color: '#333',
    textTransform: 'uppercase',
  },
  leftAlign: {
    textAlign: 'left',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  subHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#244cfcff',
  },
  detail: {
    fontSize: 13,
    marginBottom: 3,
    color: '#555',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderLeftWidth: 1,
    borderLeftColor: '#000'
  },
  tableHeaderDynamic: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    backgroundColor: '#244cfcff',
  },
  tableRowDynamic: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 8,
  },

  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailTable: {
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
    minWidth: 500,   // reduced width
    maxWidth: 500,   // keeps both boxes equal
  },

  // detailTable: {
  //   borderWidth: 1,
  //   borderColor: '#000',
  //   borderRadius: 0,
  //   // padding: 10,
  //   backgroundColor: '#fff',
  // },

  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderColor: '#000',
    paddingBottom: 4,
  },

  tableSubTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderColor: '#000',
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#000',
    flexWrap: 'wrap',     // allows text wrapping
  },

  label: {
    fontWeight: '600',
    width: '50%',
    color: '#000',
  },

  value: {
    color: '#000',
    paddingVertical: 2,
    flexShrink: 1,        // prevents overflow
    flexWrap: 'wrap',     // wraps text to next line
  },
  cellHeaderDynamic: {
    flex: 1,
    minWidth: 100,
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    color: '#fff',
  },
  cellDynamic: {
    flex: 1,
    minWidth: 100,
    fontSize: 12,
    textAlign: 'center',
    color: '#444',
  },



  fixedButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#244cfcff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // optional dim background
    zIndex: 999,
  },

});
