import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  NativeModules,
  Modal
} from 'react-native';
import { useSelector } from 'react-redux';
import ClientSelection from '../../components/ClintSelection';
import API from '../../components/API';
import { useExcelExporter } from "../../components/useExcelExporter";
import ExcelJS from 'exceljs';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Platform } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

const ProformaInvoice = ({ navigation, pdfBase64, excelBase64 }) => {
  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const client = selectedClient?.client_name || '';
  const marka = selectedClient?.marka || '';
  const isClientSelected = !!client;
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [order, setOrder] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const { generateExcelFile, shareExcelFile } = useExcelExporter();
  const [fileType, setFileType] = useState('pdf'); // default PDF

  const totalQty = invoiceData?.reduce((sum, item) => sum + Number(item.qty || 0), 0) || 0;
  const totalAmt = invoiceData?.reduce((sum, item) => sum + Number(item.total_amt_dollar || 0), 0) || 0;

  console.log(invoiceData, 'invoiceData');
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


  const generatePDF = async ({ exporter, buyer, items, authriauthorizationData, fileName, mode }) => {
    // Helper to chunk items into pages
    function chunkArray(array, size) {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    }

    const rowsPerPage = 20;
    const itemChunks = chunkArray(items.rows, rowsPerPage);

    const htmlChunks = itemChunks.map((chunk, index) => {
      const isLastPage = index === itemChunks.length - 1;

      return `
    <div style="${isLastPage ? '' : 'page-break-after: always;'}">

      <!-- Full Header on every page -->
      <div class="header">Proforma Invoice</div>

      <table class="info-table">
        <tbody>
          ${Array.from({ length: Math.max(exporter.rows.length, buyer.rows.length) })
          .map((_, i) => `
              <tr>
                <td>${exporter.rows[i] || ''}</td>
                <td>${buyer.rows[i] || ''}</td>
              </tr>
            `).join('')}
        </tbody>
      </table>

      <div class="parts-title">Parts and Accessories of Two Wheeler</div>

      <!-- Items Table -->
      <table>
        <thead>
          <tr>${items.headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${chunk.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
          
          <!-- Totals only on last page -->
          ${isLastPage ? `
            <tr class="totals-row">
              <td colspan="4"></td>
              <td>${totalQty}</td>
              <td></td>
              <td>${totalAmt}</td>
            </tr>
          ` : ''}
        </tbody>
      </table>

      <!-- Authorization + Signature only on last page -->
 ${isLastPage ? `
  <div style="display: flex;">
    <!-- Authorization Box -->
    <div class="auth-box" style="flex: 1;">
     ${authriauthorizationData.row.map((text, index, arr) => `<p style="margin:0; line-height: 1.4; padding:4px 7px; ${index !== arr.length - 1 ? 'border-bottom:1px solid #000;' : ''}">${text}</p>`).join('')}
    </div>

    <!-- Signature Box (Fixed Width) -->
    <div class="auth-box" style="width: 200px; text-align: center;">
      <p>Authorized Signatory</p>
      <div style="height: 50px;"></div>
      <p>(Signature)</p>
    </div>
  </div>
` : ''}

    </div>
  `;
    }).join('');

    const htmlContent = `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .header { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .info-table { width: 100%; border-collapse: collapse;}
    .info-table td {
      border: 1px solid #000;
      width: 50%;
      padding: 5px;
      font-size: 12px;
      text-align: left;
      vertical-align: top;
    }
    .parts-title {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      border: 1px solid #000;
      padding: 5px;
      border-top:0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #000;
      padding: 6px;
      font-size: 12px;
      text-align: center;
      word-wrap: break-word;
    }
    th { background-color: #f2f2f2; }
    .totals-row td {
      font-weight: bold;
      text-align: center;
    }
    .auth-box {
      border: 1px solid #000;
      border-top:0;
      font-size: 12px;
      text-align: left;
      white-space: wrap;
    }
    
  </style>
</head>
<body>
  ${htmlChunks}
</body>
</html>
`;

    const options = {
      html: htmlContent,
      fileName: fileName.replace('.pdf', ''),
      directory: 'Documents'
    };

    const pdfFile = await RNHTMLtoPDF.convert(options);

    if (mode === 'download') {

      const fileName = `ProformaInvoice_${Date.now()}.pdf`;
      const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

      // Write PDF content to public download folder
      await RNFS.copyFile(pdfFile.filePath, downloadPath);

      // Scan file so it appears in file managers
      if (RNFS.scanFile) {
        await RNFS.scanFile(downloadPath);
      }

      // Check file exists
      const exists = await RNFS.exists(downloadPath);
      if (!exists) throw new Error('File not found after writing');

      Alert.alert('Download Successful', `PDF saved to:\n${downloadPath}`);
      setModalVisible(false)

    } else {
      setModalVisible(false)
      await Share.open({
        url: `file://${pdfFile.filePath}`,
        type: 'application/pdf',
        failOnCancel: false,

      });

    }
  };



  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return global.btoa(binary);
  }

  const generateMergedExcel = async ({
    exporter,
    buyer,
    items,
    authriauthorizationData,
    fileName,
    mode,
  }) => {
    try {
      // Create workbook & worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Invoice');

      // === Title ===
      worksheet.mergeCells(1, 1, 1, 7);
      const titleCell = worksheet.getCell(1, 1);
      titleCell.value = 'Proforma Invoice';
      titleCell.font = { bold: true, size: 20 };
      titleCell.alignment = { horizontal: 'center', vertical: 'center' };
     

      // === Exporter / Buyer Rows ===
      const maxRows = Math.max(exporter.rows.length, buyer.rows.length);
      let currentRow = 2;

      for (let i = 0; i < maxRows; i++) {
        // Exporter merged cells (A-C)
        worksheet.mergeCells(currentRow + i, 1, currentRow + i, 3);
        worksheet.getCell(currentRow + i, 1).value = exporter.rows[i] || '';
        worksheet.getCell(currentRow + i, 1).alignment = { vertical: 'middle', horizontal: 'left' };
         worksheet.getCell(currentRow + i, 1).border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };

        // Buyer merged cells (D-G)
        worksheet.mergeCells(currentRow + i, 4, currentRow + i, 7);
        worksheet.getCell(currentRow + i, 4).value = buyer.rows[i] || '';
        worksheet.getCell(currentRow + i, 4).alignment = { vertical: 'middle', horizontal: 'left' };
        worksheet.getCell(currentRow + i, 4).border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      }

      currentRow += maxRows;

      // === Parts heading ===
      worksheet.mergeCells(currentRow + 1, 1, currentRow + 1, 7);
      const partsCell = worksheet.getCell(currentRow + 1, 1);
      partsCell.value = 'Parts and Accessories of Two Wheeler';
      partsCell.font = { bold: true, size: 14 };
      partsCell.alignment = { horizontal: 'center', vertical: 'center' };
      partsCell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };

      // === Table headers ===
      const headerRowIndex = currentRow + 2;
      const headerRow = worksheet.addRow(items.headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CCE5FF' } }; // light blue
      });

      // === Table rows ===
      items.rows.forEach((row) => {
        const dataRow = worksheet.addRow(row);
        dataRow.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      // === Totals row ===
      const totalQty = items.rows.reduce((sum, row) => sum + Number(row[4] || 0), 0);
      const totalAmt = items.rows.reduce((sum, row) => sum + Number(row[6] || 0), 0);

      const totalRow = worksheet.addRow(['', '', '', '', totalQty, '', totalAmt]);
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      worksheet.addRow(['']); // empty row

      // === Authorization block ===
      // Determine starting row
      const startRow = worksheet.lastRow.number + 1;
      const authLines = authriauthorizationData.row;

      // Create authorization block (columns 1-5)
      worksheet.mergeCells(startRow, 1, startRow + authLines.length - 1, 5);
      const authCell = worksheet.getCell(startRow, 1);
      authCell.value = authLines.join('\n'); // Combine lines
      authCell.alignment = { wrapText: true, vertical: 'top' };
      authCell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };

      // Create parallel signature block (columns 6-7)
      worksheet.mergeCells(startRow, 6, startRow + authLines.length - 1, 7);
      const signCell = worksheet.getCell(startRow, 6);
      signCell.value = ''; // or leave blank if required
      signCell.alignment = { vertical: 'middle', horizontal: 'center' };
      signCell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };


      // === Column widths ===
      [8, 20, 32, 20, 20, 20, 20].forEach((width, i) => {
        worksheet.getColumn(i + 1).width = width;
      });

      // === Save / Share ===
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = arrayBufferToBase64(buffer);

      // Validate fileName
      if (!fileName) {
        throw new Error('fileName is missing');
      }

      const fileUri = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      // Validate fileUri
      if (!fileUri.startsWith(RNFS.DocumentDirectoryPath)) {
        throw new Error(`Invalid fileUri: ${fileUri}`);
      }

      // Write file
      await RNFS.writeFile(fileUri, base64, 'base64');

      try {
        let filePath;

        if (mode === 'download') {
          // Define filePath for both platforms
          if (Platform.OS === 'android') {
            filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
            if (Platform.Version < 30) {
              const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
              );
              if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permission Denied', 'Cannot save file without storage permission.');
                return;
              }
            }
          } else {
            filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
          }

          await RNFS.writeFile(filePath, base64, 'base64');
          if (RNFS.scanFile) await RNFS.scanFile(filePath);

          Alert.alert('Download Successful', `Invoice saved to:\n${filePath}`);
        } else {
          // For sharing, use the same `fileUri` we wrote earlier
          await Share.open({
            url: `file://${fileUri}`,
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            failOnCancel: false,
          });
        }
      } catch (err) {
        console.error('Excel generation error:', err);
        Alert.alert('Error', 'Failed to save or share the file.');
      }

    } catch (err) {
      console.error(`${mode} error:`, err);
      Alert.alert('Error', `Failed to ${mode} the file.`);
    }
  };







  // ====== Handle Download ======
  const handleDownloadInvoice = (mode, type) => {

    //signature data 
    const authriauthorizationData = {
      row: [
        'Total FOB DELHI VALUE : FORTEEN THOUSAND NINE HUNDRED EIGHTY ONLY',
        'ALL BANK CHARGES OUTSIDE INDIA WILL BE BORNE BY CONSIGNEE.',
        'CERTIFIED THAT THE MERCHANDISE SPECIFIED HEREIN ABOVE HAVE BEEN SHIPPED FROM INDIA',
        `JURISDICTION CLAUSE - THIS AGREEMENT IS GOVERNED BY THE LAW IN FORCE IN INDIA.
     EACH PARTY SUBMITS TO THE EXCLUSIVE JURISDICTION OF THE COURTS OF GURUGRAM HARYANA`,
        'DECLARATION : WE DECLARE THAT THIS PROFORMA INVOICE SHOWS THE ACTUAL PRICE OF THE GOODS DESCRIBED AND THAT ALL PARTICULARS ARE TRUE AND CORRECT.',
      ],
    }





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
        'Proforma Invoice': 1,
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
        item.per_unit_rupees || '',
        item.total_amt_dollar || ''
      ])
    };

    const fileName = `ProformaInvoice_${Date.now()}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;

    if (type === 'excel') {
      generateMergedExcel({
        exporter: exporterData,
        buyer: buyerData,
        items: itemsData,
        authriauthorizationData: authriauthorizationData,
        fileName,
        mode,

      });
    } else if (type === 'pdf') {
      generatePDF({
        exporter: exporterData,
        buyer: buyerData,
        items: itemsData,
        authriauthorizationData: authriauthorizationData,
        fileName,
        mode
      });
    }
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
                    <Text style={styles.cellDynamic}>{item.per_unit_rupees}</Text>
                    <Text style={styles.cellDynamic}>{item.total_amt_dollar}</Text>
                  </View>
                ))}

                {/* Total Row */}
                <View style={[styles.tableRowDynamic, { backgroundColor: '#e0e0e0' }]}>
                  <Text style={[styles.cellDynamic, styles.srNoWidth]}></Text>
                  <Text style={styles.cellDynamic}></Text>
                  <Text style={[styles.cellDynamic, styles.descriptionWidth, styles.leftAlign]}>Total</Text>
                  <Text style={styles.cellDynamic}></Text>
                  <Text style={styles.cellDynamic}>{totalQty}</Text>
                  <Text style={styles.cellDynamic}></Text>
                  <Text style={styles.cellDynamic}>{totalAmt}</Text>
                </View>

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
                  ? () => setModalVisible(true) // Open modal instead of direct download
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
          <Modal
            transparent
            animationType="slide"
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.overlay}>
              <View style={styles.modal}>
                <Text style={styles.title}>Choose File Type</Text>

                {/* Radio Buttons */}
                <View style={styles.radioContainer}>
                  <TouchableOpacity
                    style={[
                      styles.radioOption,
                      fileType === 'pdf' && styles.radioOptionActive,
                    ]}
                    onPress={() => setFileType('pdf')}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        fileType === 'pdf' && styles.radioSelected,
                      ]}
                    />
                    <Text style={styles.radioText}>PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.radioOption,
                      fileType === 'excel' && styles.radioOptionActive,
                    ]}
                    onPress={() => setFileType('excel')}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        fileType === 'excel' && styles.radioSelected,
                      ]}
                    />
                    <Text style={styles.radioText}>Excel</Text>
                  </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                  style={[styles.button, styles.downloadButton]}
                  onPress={() => handleDownloadInvoice('download', fileType)}
                >
                  <Text style={styles.buttonText}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.shareButton]}
                  onPress={() => handleDownloadInvoice('share', fileType)}
                >
                  <Text style={styles.buttonText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.buttonText, { color: '#333' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>



        </>
      )}

    </View>
  );


};

export default ProformaInvoice;

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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 100,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  radioOptionActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginRight: 8,
  },
  radioSelected: {
    backgroundColor: '#4CAF50',
  },
  radioText: {
    fontSize: 14,
    color: '#333',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 6,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
  },
  shareButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

});
