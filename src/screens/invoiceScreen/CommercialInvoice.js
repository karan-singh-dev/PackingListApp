import React, { useCallback, useState } from 'react';
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

const CommercialInvoice = () => {
  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const client = selectedClient?.client_name || '';
  const marka = selectedClient?.marka || '';
  const isClientSelected = !!client;

  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [orderData, setOrderData] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);

 
  const fetchOrderData = async () => {
    try {
      setLoading(true)
      const orderRes = await API.get(`/api/orderitem/items/`, {
        params: { client_name: client, marka },
      });
      const data = orderRes.data;
      setOrderData(otrue)
      console.log('order data ======>', data);
      setLoading(true)
      if (!Array.isArray(data) || data.length === 0) {
        Alert.alert('No Data', 'No order items found for this client. please upload order first');
        return;
      }


    } catch (error) {
      setLoading(true)
      console.error('Fetch Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load invoice data');
    }
  };
   useFocusEffect(
        useCallback(() => {
           fetchOrderData()
        }, [client, marka])
    );
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
      const wsData = [];

      // 1. Add Proforma Invoice title (merged across all columns)
      wsData.push(['Proforma Invoice', '', '', '', '', '', '']);


      // 3. Add Exporter & Buyer details side by side
      const maxRows = Math.max(exporter.rows.length, buyer.rows.length);
      for (let i = 0; i < maxRows; i++) {
        wsData.push([
          exporter.rows[i] || '',
          '',
          '',
          buyer.rows[i] || '',
          '',
          '',
          ''
        ]);
      }

      // 4. Empty row before items table
      wsData.push([]);

      // 5. Add Items table (headers + rows)
      wsData.push(items.headers);
      items.rows.forEach(row => wsData.push(row));

      // Convert to worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // 6. Define merges
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Proforma Invoice title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }, // Exporter title
        { s: { r: 1, c: 3 }, e: { r: 1, c: 6 } }, // Buyer title
        ...Array.from({ length: maxRows }, (_, idx) => ([
          { s: { r: idx + 2, c: 0 }, e: { r: idx + 2, c: 2 } },
          { s: { r: idx + 2, c: 3 }, e: { r: idx + 2, c: 6 } }
        ])).flat()
      ];

      // 7. Column widths
      ws['!cols'] = Array(7).fill({ wch: 20 });

      // 8. Apply styles
      const applyBorder = (cell) => {
        if (!ws[cell]) return;
        ws[cell].s = {
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      };

      // Style Proforma Invoice title
      const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (ws[titleCell]) {
        ws[titleCell].s = {
          font: { bold: true, sz: 20 },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Style headers
      const headerRowIndex = maxRows + 3; // Header row position
      items.headers.forEach((_, c) => {
        const cellAddr = XLSX.utils.encode_cell({ r: headerRowIndex, c });
        if (ws[cellAddr]) {
          ws[cellAddr].s = {
            font: { bold: true },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
        }
      });

      // Apply borders to items rows
      const totalRows = items.rows.length + 1;
      for (let r = headerRowIndex; r < headerRowIndex + totalRows; r++) {
        for (let c = 0; c < 7; c++) {
          applyBorder(XLSX.utils.encode_cell({ r, c }));
        }
      }

      // 9. Write file
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      const path =
        Platform.OS === 'ios'
          ? `${RNFS.TemporaryDirectoryPath}${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(path, wbout, 'base64');

      // 10. Share file
      await Share.open({
        url: `file://${path}`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: fileName,
      });

    } catch (err) {
      console.error('Excel generation error:', err);
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
          {/* Horizontal Scroll for entire content */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            {/* Vertical Scroll for content */}

            {/* Heading */}


            {/* Details Section (Exporter & Buyer) */}

            {/* Table */}
            {invoiceData && invoiceData.length > 0 && (
              <>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                  <Text style={styles.heading}>Proforma Invoice</Text>
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
                  <Text style={styles.sectionHeading}>Parts and Accessories of Two Wheeler</Text>

                  {/* Table Header */}
                  <View style={styles.tableHeaderDynamic}>
                    <Text style={styles.cellHeaderDynamic}>S.No</Text>
                    <Text style={styles.cellHeaderDynamic}>Part No</Text>
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
                      <Text style={styles.cellDynamic}>{index + 1}</Text>
                      <Text style={styles.cellDynamic}>{item.part_no}</Text>
                      <Text style={styles.cellDynamic}>{item.hsn}</Text>
                      <Text style={styles.cellDynamic}>{item.qty}</Text>
                      <Text style={styles.cellDynamic}>{item.per_unit}</Text>
                      <Text style={styles.cellDynamic}>{item.total_amt}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            {loading && (
              <ActivityIndicator size="large" color="#244cfcff" style={{ marginTop: 20 }} />
            )}

          </ScrollView>

          {/* Fixed Button */}
          <TouchableOpacity
            style={styles.fixedButton}
            onPress={
              orderData
                ? () => navigation.navigate('AppDrawer', { screen: 'OrderUpload' })
                : invoiceGenerated
                  ? handleDownloadInvoice
                  : generateInvoice
            }
          >
            <Text style={styles.buttonText}>
              {invoiceGenerated ? 'Download Invoice' : 'Generate Invoice'}
            </Text>
          </TouchableOpacity>

        </>
      )}
    </View>
  );

};

export default CommercialInvoice;

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
});

