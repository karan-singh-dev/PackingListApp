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
import ClientSelection from '../../../components/ClintSelection';
import API from '../../../components/API';
import { useExcelExporter } from "../../../components/useExcelExporter";
import { Linking } from 'react-native';
import * as ExcelJS from 'exceljs';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DownloadModal from '../../../components/DownloadModal';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

const CommercialInvoice = ({ navigation, pdfBase64, excelBase64 }) => {
  const selectedClient = useSelector((state) => state?.clientData?.selectedClient);
  const client = selectedClient?.client_name || '';
  const marka = selectedClient?.marka || '';
  const isClientSelected = !!client;
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [packing, setpacking] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const { generateExcelFile, shareExcelFile } = useExcelExporter();
  const [fileType, setFileType] = useState('pdf'); // default PDF

  const totalQty = invoiceData?.reduce((sum, item) => sum + Number(item.qty || 0), 0) || 0;
  const totalAmt = invoiceData?.reduce((sum, item) => sum + Number(item.total_amt_dollar || 0), 0) || 0; // adjust index for $ column
  const totalTaxable = invoiceData?.reduce((sum, item) => sum + Number(item.taxable_amt || 0), 0) || 0;
  const totalIGST = invoiceData?.reduce((sum, item) => sum + Number(item.gst_amt || 0), 0) || 0;
  const totalNetWeight = invoiceData?.reduce((sum, item) => sum + Number(item.total_net_wt || 0), 0) || 0;


  console.log(invoiceData, 'invoiceData');
  // console.log(userData);

  const fetchpackingData = async () => {
    // Prevent API call if client or marka is missing
    if (!client || !marka) {
      console.log("Skipping fetch: client or marka missing");
      return;
    }

    try {
      setLoading(true);

      const packingRes = await API.get(`api/packing/packing-details/`, {
        params: { client, marka },
      });

      const data = packingRes.data;

      if (!Array.isArray(data) || data.length === 0) {
        setpacking(true); // reset to empty
        Alert.alert(
          'No Data',
          'No packing items found for this client. Please finish packing first',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(), // Go back when OK is pressed
            },
          ]
        );
      } else {
        setpacking(false)
      }

    } catch (error) {
      console.error('Fetch Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load packing items items');
    } finally {
      setLoading(false); // always stop loading
    }
  };

  useEffect(() => {
    fetchpackingData();
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


  const generatePDF = async ({ exporter, buyer, items, fileName, mode }) => {
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

    // Calculate all totals
    const totalQty = items.rows.reduce((sum, r) => sum + (parseFloat(r[2]) || 0), 0);
    const totalDollar = items.rows.reduce((sum, r) => sum + (parseFloat(r[5]) || 0), 0); // adjust index for $ column
    const totalTaxable = items.rows.reduce((sum, r) => sum + (parseFloat(r[7]) || 0), 0);
    const totalIGST = items.rows.reduce((sum, r) => sum + (parseFloat(r[9]) || 0), 0);
    const totalNetWeight = items.rows.reduce((sum, r) => sum + (parseFloat(r[10]) || 0), 0);


    const htmlChunks = itemChunks.map((chunk, index) => {
      const isLastPage = index === itemChunks.length - 1;

      return `
  <div style="${isLastPage ? '' : 'page-break-after: always;'}">

    <!-- Header (duplicate for every page) -->
    <div class="header">Commercial Invoice</div>

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

    <!-- Table with column headers (repeats every page) -->
    <table>
      <colgroup>
        <col style="width:6%">
        <col style="width:30%">
        <col style="width:9%">
        <col style="width:9%">
        <col style="width:9%">
        <col style="width:10%">
        <col style="width:9%">
        <col style="width:10%">
        <col style="width:8%">
        <col style="width:11%">
        <col style="width:10%">
        <col style="width:8%">
      </colgroup>
      <thead>
        <tr>${items.headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${chunk.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}

        ${isLastPage ? `
          <tr class="totals-row">
           <td colspan="2"></td>
          
            <td>${totalQty}</td>
             <td></td>
              <td></td>
            <td>$ ${totalDollar.toFixed(2)}</td>
             <td></td>
            <td>${totalTaxable.toFixed(2)}</td>
             <td></td>
            <td>${totalIGST.toFixed(2)}</td>
            <td>${totalNetWeight.toFixed(2)}</td>
            <td></td>
          </tr>
        ` : ''}
      </tbody>
    </table>

    ${isLastPage ? `
    <div style="display:flex; border:1px solid #000; border-top:0;">
      <div style="flex:0 0 75%; border-right:1px solid #000; padding:10px; font-size:8px;">
        
      </div>
      <div style="flex:0 0 25%; text-align:center; padding:10px; font-size:8px;">
        <p>Authorized Signatory</p>
        <div style="height:50px;"></div>
        <p>(Signature)</p>
      </div>
    </div>
    ` : ''}

  </div>`;
    }).join('');



    const htmlContent = `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .header { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 8px; }
    .info-table { width: 100%; border-collapse: collapse;}
    .info-table td {
      border: 1px solid #000;
      width: 50%;
      padding: 5px;
      font-size: 8px;
      text-align: left;
      vertical-align: top;
    }
    .parts-title {
      text-align: center;
      font-weight: bold;
      font-size: 10px;
      border: 1px solid #000;
      padding: 5px;
      border-top:0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
       table-layout: fixed; /* IMPORTANT to respect col widths */
    }
    th, td {
       border: 1px solid #000;
      padding: 6px;
      font-size: 8px;
      text-align: center;
      word-wrap: break-word;
    }
    th { background-color: #f2f2f2; }
    .totals-row td {
      font-weight: bold;
      text-align: center;
    }
    .totals-row td {
    font-weight: bold;
    text-align: center;
    background-color: yellow;
    }

  </style>
</head>
<body>
  ${htmlChunks}
</body>
</html>
`;

    // Convert HTML to PDF
    const options = {
      html: htmlContent,
      fileName: fileName.replace('.pdf', ''),
      directory: 'Documents'
    };

    const pdfFile = await RNHTMLtoPDF.convert(options);

    if (mode === 'download') {
      const newFileName = `CommercialInvoice_${Date.now()}.pdf`;
      const downloadPath = `${RNFS.DownloadDirectoryPath}/${newFileName}`;

      await RNFS.copyFile(pdfFile.filePath, downloadPath);

      if (RNFS.scanFile) {
        await RNFS.scanFile(downloadPath);
      }

      const exists = await RNFS.exists(downloadPath);
      if (!exists) throw new Error('File not found after writing');

      Alert.alert('Download Successful', `PDF saved to:\n${downloadPath}`);
      setModalVisible(false);
    } else {
      setModalVisible(false);
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
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return global.btoa(binary);
  }
  ;

  // Convert ArrayBuffer to Base64
  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return global.btoa(binary);
  }



  async function generateMergedExcel({ exporter, buyer, items, fileName, mode }) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Invoice');

      // ===== Heading =====
      worksheet.mergeCells(1, 1, 1, 12);
      const headingCell = worksheet.getCell(1, 1);
      headingCell.value = 'COMMERCIAL INVOICE';
      headingCell.font = { bold: true, size: 18 };
      headingCell.alignment = { horizontal: 'center', vertical: 'middle' };

      let currentRow = 3;

      // ===== Exporter + Buyer (50/50) =====
      const exporterRows = exporter.rows || [];
      const buyerRows = buyer.rows || [];
      const maxRows = Math.max(exporterRows.length, buyerRows.length);

      // Exporter block
      exporterRows.forEach((row, i) => {
        worksheet.mergeCells(currentRow + i, 1, currentRow + i, 6);
        worksheet.getCell(currentRow + i, 1).value = row;
        worksheet.getCell(currentRow + i, 1).alignment = { vertical: 'middle', horizontal: 'left' };
      });

      // Buyer block
      buyerRows.forEach((row, i) => {
        worksheet.mergeCells(currentRow + i, 7, currentRow + i, 12);
        worksheet.getCell(currentRow + i, 7).value = row;
        worksheet.getCell(currentRow + i, 7).alignment = { vertical: 'middle', horizontal: 'left' };
      });

      currentRow += maxRows + 2;

      // ===== Note: TOLERANCE =====
      const noteRow = worksheet.addRow([
        'TOLERANCE UPTO 10% IN NET WEIGHT AND GROSS WEIGHT'
      ]);
      worksheet.mergeCells(noteRow.number, 1, noteRow.number, 12);
      const noteCell = worksheet.getCell(noteRow.number, 1);
      noteCell.alignment = { horizontal: 'center', vertical: 'middle' };
      noteCell.font = { bold: true, size: 14 };

      // ===== Table Headers =====
      const headerRow = worksheet.addRow(items.headers);
      headerRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CCE5FF' } }; // light blue
      });

      // ===== Table Data =====
      items.rows.forEach(row => {
        // Ensure array
        const rowArray = Array.isArray(row) ? [...row] : Object.values(row);

        // Add $ for column 6
        rowArray[5] = `$ ${rowArray[5]}`;

        const dataRow = worksheet.addRow(rowArray);

        if (!dataRow) {
          console.error("Row could not be added", rowArray);
          return;
        }

        dataRow.eachCell((cell, colNumber) => {
          // Align description left
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber === 2 ? 'left' : 'center',
            wrapText: true
          };

          // Add border
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      function calculateColumnTotal(rows, index) {
        return rows.reduce((sum, row) => {
          let val = row[index];
          if (typeof val === 'string') {
            val = val.replace(/[^0-9.-]+/g, ''); // Remove $ or commas
          }
          return sum + (parseFloat(val) || 0);
        }, 0);
      }

      // ===== Totals Row =====
      const totalQty = calculateColumnTotal(items.rows, 2);
      const totalDollar = calculateColumnTotal(items.rows, 5);
      const totalTaxable = calculateColumnTotal(items.rows, 7);
      const totalIGST = calculateColumnTotal(items.rows, 9);
      const totalNetWeight = calculateColumnTotal(items.rows, 10);
      // Totals row
      const totalRow = worksheet.addRow([
        '',
        'TOTAL',
        totalQty,
        '',
        '',
        `$ ${totalDollar.toFixed(2)}`,  // Add $ for display
        '',
        totalTaxable.toFixed(2),
        '',
        totalIGST.toFixed(2),
        totalNetWeight.toFixed(2),
        ''
      ]);

      // Apply bold & borders to all cells
      totalRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Apply yellow background only to totals columns
      [3, 6, 8, 10, 11].forEach(colIndex => {
        totalRow.getCell(colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF00' } // bright yellow
        };
      });
      // ===== Amount + Signature Box (AFTER totals row) =====
      const boxStartRow = totalRow.number + 2;

      // Amount box (columns 1–9)
      worksheet.mergeCells(boxStartRow, 1, boxStartRow + 5, 9);
      const amountCell = worksheet.getCell(boxStartRow, 1);
      amountCell.value = `AMOUNT IN DOLLAR: ${totalDollar.toFixed(2)}`;
      amountCell.alignment = { horizontal: 'left', vertical: 'middle' };
      amountCell.font = { size: 10, bold: true }; // no bold

      // Signature box (columns 10–12)
      worksheet.mergeCells(boxStartRow, 10, boxStartRow + 5, 12);
      const signCell = worksheet.getCell(boxStartRow, 10);
      signCell.value = ''; // Empty box
      signCell.alignment = { horizontal: 'center', vertical: 'middle' };
      signCell.font = { bold: true, size: 10 };

      // Borders for box area
      for (let row = boxStartRow; row <= boxStartRow + 5; row++) {
        for (let col = 1; col <= 12; col++) {
          worksheet.getCell(row, col).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      }

      // ===== Column Widths =====
      const widths = [5, 35, 10, 15, 15, 20, 15, 20, 10, 20, 20, 15];
      widths.forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
      });

      // ===== Save File =====
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = arrayBufferToBase64(buffer);

      try {
        if (mode === 'download') {
          const path =
            Platform.OS === 'android'
              ? `${RNFS.DownloadDirectoryPath}/${fileName}`
              : `${RNFS.DocumentDirectoryPath}/${fileName}`;

          // Request permission on Android < 30
          if (Platform.OS === 'android' && Platform.Version < 30) {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              Alert.alert('Permission Denied', 'Cannot save file without storage permission.');
              return;
            }
          }

          // Write file
          await RNFS.writeFile(path, base64, 'base64');

          // Scan so it appears in Downloads
          if (RNFS.scanFile) await RNFS.scanFile(path);

          const exists = await RNFS.exists(path);
          if (!exists) throw new Error('File not found after writing');

          setModalVisible(false);
          Alert.alert('Download Successful', `Invoice saved to:\n${path}`);
          return path;
        } else {
          // Fallback to share mode
          const path =
            Platform.OS === 'android'
              ? `${RNFS.CachesDirectoryPath}/${fileName}`
              : `${RNFS.DocumentDirectoryPath}/${fileName}`;

          await RNFS.writeFile(path, base64, 'base64');

          await Share.open({
            url: `file://${path}`,
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            failOnCancel: false,
          });

          setModalVisible(false);
          return path;
        }
      } catch (err) {
        console.error('Excel generation error:', err);
        Alert.alert('Error', 'Failed to save or share the file.');
      }

    } catch (err) {
      console.error('Error generating excel', err);
    }
  }

  // ====== Handle Download ======
  const handleDownloadInvoice = (mode, type) => {

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
        'Commercial Invoice': 1,
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
      headers: [
        'S.NO',
        'ITEM NAME',
        'QTY', 'HSN',
        'RATE IN US($)',
        'TOTAL AMOUNT IN US($)',
        'RATE IN INR',
        'TAXABLE AMOUNT',
        'IGST %',
        'IGST AMOUNT',
        'TOTAL NET WEIGHT',
        'BRAND'
      ],
      rows: invoiceData.map((item, index) => [
        index + 1,
        item.description || '',
        item.qty || '',
        item.hsn || '',
        item.per_unit_dollar || '',
        item.total_amt_dollar || '',
        item.per_unit_rupees || '',
        item.taxable_amt || '',
        item.gst || '',
        item.gst_amt || '',
        item.total_net_wt || '',
        'BAJAJ' || '',
      ])
    };



    const fileName = `CommercialInvoice_${Date.now()}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;

    if (type === 'excel') {
      generateMergedExcel({
        exporter: exporterData,
        buyer: buyerData,
        items: itemsData,
        fileName,
        mode,

      });
    } else if (type === 'pdf') {
      generatePDF({
        exporter: exporterData,
        buyer: buyerData,
        items: itemsData,
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
            <Text style={styles.topHeading}>Commercial Invoice</Text>
          )}

          {/* Horizontal Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            {/* Content Scroll */}
            {invoiceData && invoiceData.length > 0 && (
              <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Center heading inside details */}
                <Text style={styles.heading}>Commercial Invoice</Text>

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
                  <Text style={[styles.cellHeaderDynamic, styles.srNoWidth]}>S.NO</Text>
                  <Text style={[styles.cellHeaderDynamic, styles.descriptionWidth, styles.leftAlign]}>
                    ITEM NAME
                  </Text>
                  <Text style={styles.cellHeaderDynamic}>QTY</Text>
                  <Text style={styles.cellHeaderDynamic}>HSN</Text>
                  <Text style={styles.cellHeaderDynamic}>RATE IN US($)</Text>
                  <Text style={styles.cellHeaderDynamic}>TOTAL AMOUNT IN US($)</Text>
                  <Text style={styles.cellHeaderDynamic}>RATE IN INR</Text>
                  <Text style={styles.cellHeaderDynamic}>TAXABLE AMOUNT</Text>
                  <Text style={styles.cellHeaderDynamic}>IGST %</Text>
                  <Text style={styles.cellHeaderDynamic}>IGST AMOUNT</Text>
                  <Text style={styles.cellHeaderDynamic}>TOTAL NET WEIGHT</Text>
                  <Text style={styles.cellHeaderDynamic}>BRAND</Text>
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
                    <Text style={[styles.cellDynamic, styles.descriptionWidth, styles.leftAlign]}>
                      {item.description}
                    </Text>
                    <Text style={styles.cellDynamic}>{item.qty}</Text>
                    <Text style={styles.cellDynamic}>{item.hsn}</Text>
                    <Text style={styles.cellDynamic}>$    {item.per_unit_dollar}</Text>
                    <Text style={styles.cellDynamic}>$    {item.total_amt_dollar}</Text>
                    <Text style={styles.cellDynamic}>{item.per_unit_rupees}</Text>
                    <Text style={styles.cellDynamic}>{item.taxable_amt}</Text>
                    <Text style={styles.cellDynamic}>{item.gst}</Text>
                    <Text style={styles.cellDynamic}>{item.gst_amt}</Text>
                    <Text style={styles.cellDynamic}>{item.total_net_wt}</Text>
                    <Text style={styles.cellDynamic}>BAJAJ</Text>
                  </View>
                ))}

                {/* Total Row */}
                <View style={[styles.tableRowDynamic, { backgroundColor: '#e0e0e0' }]}>
                  <Text style={[styles.cellDynamic, styles.srNoWidth]}></Text>
                  <Text style={[styles.cellDynamic, styles.descriptionWidth]}></Text>
                  <Text style={styles.cellDynamic}>{totalQty.toFixed(2)}</Text>
                  <Text style={styles.cellDynamic}></Text>
                  <Text style={styles.cellDynamic}></Text>
                  <Text style={styles.cellDynamic}>{totalAmt.toFixed(2)}</Text>
                  <Text style={styles.cellDynamic}></Text>
                  <Text style={styles.cellDynamic}>{totalTaxable.toFixed(2)}</Text>
                  <Text style={styles.cellDynamic}></Text>
                  <Text style={styles.cellDynamic}>{totalIGST.toFixed(2)}</Text>
                  <Text style={styles.cellDynamic}>{totalNetWeight.toFixed(2)}</Text>
                  <Text style={styles.cellDynamic}></Text>
                </View>

              </ScrollView>
            )}


          </ScrollView>

          {/* Button */}
          {!packing && (
            <TouchableOpacity
              style={styles.fixedButton}
              onPress={
                invoiceGenerated
                  ? () => setModalVisible(true) // Open modal instead of direct download
                  : generateInvoice
              }
            >
              <Text style={styles.buttonText}>
                {invoiceGenerated ? 'Download Invoice' : 'Generate Invoice'}
              </Text>
            </TouchableOpacity>
          )}

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
    width: '50%',   // equally divide parent
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
