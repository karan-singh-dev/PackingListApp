import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Button, ActivityIndicator, Alert, PermissionsAndroid, Platform } from "react-native";
import { useSelector } from "react-redux";
import ClientSelection from "../../../components/ClintSelection";
import API from "../../../components/API";
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

const TaxInvoice = () => {
  const selectedClient = useSelector(
    (state) => state?.clientData?.selectedClient
  );
  const client = selectedClient?.client_name;
  const marka = selectedClient?.marka;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const user = useSelector((state) => state?.userInfo?.user);
  const [pdfFile, setPdfFile] = useState(null);
  const [otherState, setOtherState] = useState(false);
  const isClientSelected = !!client;

  console.log("Selected Client:", selectedClient);
  console.log('user',user)

  const fetchData = async () => {
    try {
      setLoading(true);
      setHasError(false);
      const res = await API.get("api/packing/packing-details/", {
        params: { client, marka },
      });
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch packing data:", error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (selectedClient?.state !== user?.state) {
        setOtherState(true);
      } else {
        setOtherState(false);
      }
      if (isClientSelected) {
        setShowInvoice(false);
        fetchData();
      }
    }, [client, marka])
  );

  const groupedData = useMemo(() => {
    const grouped = {};
    data.forEach((item) => {
      if (!item || !item.part_no || !item.gst) return;
      const key = item.part_no;
      if (!grouped[key]) {
        grouped[key] = {
          ...item,
          total_packing_qty: 0,
          grossAmount: 0,
        };
      }
      grouped[key].total_packing_qty += parseFloat(item.total_packing_qty) || 0;
      grouped[key].grossAmount += (parseFloat(item.total_packing_qty) || 0) * (parseFloat(item.mrp_invoice) || 0);
    });
    return Object.values(grouped);
  }, [data]);

  const sortedGroupedData = useMemo(() => {
    return [...groupedData].sort((a, b) => (Number(b.gst) || 0) - (Number(a.gst) || 0));
  }, [groupedData]);

  const gstBreakdown = useMemo(() => {
    const breakdown = {};
    let totalCgst = 0, totalSgst = 0, totalIgst = 0;

    sortedGroupedData.forEach((item) => {
      if (!item || !item.gst || !item.grossAmount) return;
      const discountRule = selectedClient?.gst?.find(
        (rule) => rule.gst === String(item.gst)
      );
      const discountPercent = discountRule ? parseFloat(discountRule.discount) || 0 : 0;
      const netAmount = item.grossAmount - (item.grossAmount * discountPercent) / 100;
      const gstRate = Number(item.gst) || 0;

      if (gstRate === 0) return;

      if (otherState) {
        const igstAmount = (netAmount * gstRate) / 100;
        if (!breakdown[gstRate]) {
          breakdown[gstRate] = { igstPercent: gstRate, igstAmount: 0 };
        }
        breakdown[gstRate].igstAmount += igstAmount || 0;
        totalIgst += igstAmount || 0;
      } else {
        const halfRate = gstRate / 2;
        const cgstAmount = (netAmount * halfRate) / 100;
        const sgstAmount = (netAmount * halfRate) / 100;
        if (!breakdown[gstRate]) {
          breakdown[gstRate] = {
            cgstPercent: halfRate,
            sgstPercent: halfRate,
            cgstAmount: 0,
            sgstAmount: 0,
          };
        }
        breakdown[gstRate].cgstAmount += cgstAmount || 0;
        breakdown[gstRate].sgstAmount += sgstAmount || 0;
        totalCgst += cgstAmount || 0;
        totalSgst += sgstAmount || 0;
      }
    });

    // console.log("gstBreakdown:", JSON.stringify({ breakdown, totalCgst, totalSgst, totalIgst }, null, 2));
    return { breakdown, totalCgst, totalSgst, totalIgst };
  }, [sortedGroupedData, selectedClient, otherState]);

  const grandTotals = useMemo(() => {
    const totals = {
      cbm: 0,
      total_case: 0,
      total_mrp: 0,
      total_packing_qty: 0,
      taxableValue: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      grandTotal: 0,
      roundOff: 0,
      roundedGrandTotal: 0,
    };

    data.forEach((item) => {
      if (!item) return;
      totals.cbm += parseFloat(item.cbm) || 0;
      totals.total_case += parseFloat(item.total_case) || 0;
      totals.total_mrp += parseFloat(item.total_mrp) || 0;
      totals.total_packing_qty += parseFloat(item.total_packing_qty) || 0;
    });

    sortedGroupedData.forEach((item) => {
      if (!item || !item.grossAmount) return;
      const discountRule = selectedClient?.gst?.find(
        (rule) => rule.gst === String(item.gst)
      );
      const discountPercent = discountRule ? parseFloat(discountRule.discount) || 0 : 0;
      const netAmount = item.grossAmount - (item.grossAmount * discountPercent) / 100;
      totals.taxableValue += netAmount || 0;
    });

    totals.cgstAmount = gstBreakdown.totalCgst || 0;
    totals.sgstAmount = gstBreakdown.totalSgst || 0;
    totals.igstAmount = gstBreakdown.totalIgst || 0;
    totals.grandTotal = totals.taxableValue + (otherState ? totals.igstAmount : totals.cgstAmount + totals.sgstAmount);
    totals.roundOff = Math.round(totals.grandTotal) - totals.grandTotal;
    totals.roundedGrandTotal = Math.round(totals.grandTotal);

    console.log("grandTotals:", JSON.stringify(totals, null, 2));
    return totals;
  }, [data, sortedGroupedData, selectedClient, gstBreakdown, otherState]);

  const generatePDF = async () => {
    try {
      const rowsPerPage = 25;
      const rowChunks = [];
      for (let i = 0; i < sortedGroupedData.length; i += rowsPerPage) {
        rowChunks.push(sortedGroupedData.slice(i, i + rowsPerPage));
      }

      const pagesHtml = rowChunks
        .map((chunk, pageIndex) => {
          const rowsHtml = chunk
            .map((item, index) => {
              if (!item || !item.grossAmount) return "";
              const discountRule = selectedClient?.gst?.find(
                (rule) => rule.gst === String(item.gst)
              );
              const discountPercent = discountRule ? parseFloat(discountRule.discount) || 0 : 0;
              const netAmount = item.grossAmount - (item.grossAmount * discountPercent) / 100;
              return `
                <tr>
                  <td style="border:1px solid #000; text-align:center; padding:4px;">${pageIndex * rowsPerPage + index + 1}</td>
                  <td style="border:1px solid #000; text-align:center; padding:4px;">${item.part_no || "N/A"}</td>
                  <td style="border:1px solid #000; text-align:left; padding:4px;">${item.description || "N/A"}</td>
                  <td style="border:1px solid #000; text-align:center; padding:4px;">${item.hsn_no || "N/A"}</td>
                  <td style="border:1px solid #000; text-align:center; padding:4px;">${item.total_packing_qty || 0}</td>
                  <td style="border:1px solid #000; text-align:center; padding:4px;">${item.mrp_invoice || 0}</td>
                  <td style="border:1px solid #000; text-align:center; padding:4px;">${discountPercent}</td>
                  <td style="border:1px solid #000; text-align:center; padding:4px;">${(netAmount || 0).toFixed(2)}</td>
                </tr>
              `;
            })
            .join("");

          const headerHtml = `
            <div class="header">
              <h2>${user?.account_name || "N/A"}</h2>
              <p>${user?.address || "N/A"}<br>GSTIN: ${user?.iec || "N/A"}, PAN: ${user?.pan || "N/A"}<br>Email: ${user?.email || "N/A"}</p>
            </div>
            <div class="invoice-box">
              <div class="row" style="display:flex;">
                <div class="col col-left">
                  <p style="font-weight:bold; margin:0 0 6px 0;">Details of Receiver (Bill To)</p>
                  <p style="margin:0 0 8px 0;">${selectedClient?.client_name || "N/A"}, ${selectedClient?.address || "N/A"}</p>
                  <p style="font-weight:bold; margin:0 0 6px 0;">Details of Consignee (Ship To)</p>
                  <p style="margin:0 0 8px 0;">${selectedClient?.client_name || "N/A"}, ${selectedClient?.address || "N/A"}</p>
                </div>
                <div class="col">
                  <p style="margin:0 0 6px 0;"><strong>Invoice No:</strong> GSM/2526/01114</p>
                  <p style="margin:0 0 6px 0;"><strong>Date :</strong> ${new Date().toLocaleDateString()}</p>
                  <p style="margin:8px 0 0 0;"><strong>Place of Supply:</strong> ${selectedClient?.country || "N/A"}</p>
                </div>
              </div>
            </div>
            <table class="items-table">
              <tr>
                <th>S.No</th>
                <th>Part No</th>
                <th>Description</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Disc%</th>
                <th>Amount</th>
              </tr>
              ${rowsHtml}
            </table>
          `;

          const isLastPage = pageIndex === rowChunks.length - 1;
          const totalsHtml = isLastPage
            ? `
              <table style="width:100%; border-collapse:collapse;">
                <tr>
                  <td style="width:57%; border:1px solid #000;border-top:none; vertical-align:top;">
                    <p style="margin:0 0 4px 0;">Total Boxes: ${grandTotals.total_case || 0}</p>
                    ${Object.keys(gstBreakdown.breakdown)
                      .map((gstRate) => {
                        const breakdown = gstBreakdown.breakdown[gstRate] || {};
                        return otherState
                          ? `<p style="margin:0 0 4px 0;">IGST (${breakdown.igstPercent || 0}%): ${(breakdown.igstAmount || 0).toFixed(2)}</p>`
                          : `
                            <p style="margin:0 0 4px 0;">CGST (${breakdown.cgstPercent || 0}%): ${(breakdown.cgstAmount || 0).toFixed(2)}</p>
                            <p style="margin:0 0 4px 0;">SGST (${breakdown.sgstPercent || 0}%): ${(breakdown.sgstAmount || 0).toFixed(2)}</p>
                          `;
                      })
                      .join("")}
                  </td>
                  <td style="width:43%; border:1px solid;border-top:none; vertical-align:top">
                    <div style="display:flex; justify-content:space-between;align-items:center;border-bottom:1px solid #000; margin-bottom:4px;">
                      <p>Total Taxable Value:</p>
                      <p style="padding-right:5px;">${(grandTotals.taxableValue || 0).toFixed(2)}</p>
                    </div>
                    ${
                      otherState
                        ? `
                          <div style="display:flex; justify-content:space-between;align-items:center;border-bottom:1px solid #000; margin-bottom:4px;">
                            <p>Total IGST:</p>
                            <p style="padding-right:5px;">${(grandTotals.igstAmount || 0).toFixed(2)}</p>
                          </div>
                        `
                        : `
                          <div style="display:flex; justify-content:space-between;align-items:center;border-bottom:1px solid #000; margin-bottom:4px;">
                            <p>Total CGST:</p>
                            <p style="padding-right:5px;">${(grandTotals.cgstAmount || 0).toFixed(2)}</p>
                          </div>
                          <div style="display:flex; justify-content:space-between;align-items:center;border-bottom:1px solid #000; margin-bottom:4px;">
                            <p>Total SGST:</p>
                            <p style="padding-right:5px;">${(grandTotals.sgstAmount || 0).toFixed(2)}</p>
                          </div>
                        `
                    }
                    <div style="display:flex; justify-content:space-between;align-items:center;border-bottom:1px solid #000; margin-bottom:4px;">
                      <p>Round Off:</p>
                      <p style="padding-right:5px;">${(grandTotals.roundOff || 0).toFixed(2)}</p>
                    </div>
                    <div style="display:flex; justify-content:space-between;align-items:center;border-bottom:1px solid #000; margin-bottom:4px;">
                      <p>(Rounded) Grand Total:</p>
                      <p style="padding-right:5px;">${(grandTotals.roundedGrandTotal || 0).toFixed(2)}</p>
                    </div>
                    <p style="padding-left:5px;font-weight:bold;">Whether Tax is Payable on Reverse Charge: No</p>
                  </td>
                </tr>
              </table>
              <div style="margin-top:12px; display:flex; justify-content:space-between;">
                <div style="width:60%;">
                  <p style="font-weight:bold; margin:0 0 6px 0;">Terms & Conditions:</p>
                  <p style="margin:2px 0;">
                    1. Goods once sold will not be taken back/exchanged.<br>
                    2. Interest @24% will be charged on overdue amount.<br>
                    3. All disputes are subjected to Gurugram Jurisdiction.
                  </p>
                  <div style="margin-top:8px;">
                    <p style="font-weight:bold; margin:0 0 4px 0;">Bank Details:</p>
                    <p style="margin:2px 0;">A/C Name: ${user?.account_name || "N/A"}</p>
                    <p style="margin:2px 0;">Bank: ${user?.bank_name || "N/A"}</p>
                    <p style="margin:2px 0;">A/C No: ${user?.account_number || "N/A"}</p>
                    <p style="margin:2px 0;">IFSC: ${user?.ifsc_code || "N/A"}, SWIFT: ${user?.swift_code || "N/A"}</p>
                  </div>
                </div>
                <div style="width:35%; display:flex; align-items:flex-end; justify-content:center;">
                  <div style="text-align:center; margin-top:40px; font-weight:bold;">
                    Authorised Signatory
                  </div>
                </div>
              </div>
            `
            : "";

          return `
            <div class="page" style="page-break-after:always;">
              ${headerHtml}
              ${totalsHtml}
            </div>
          `;
        })
        .join("");

      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; font-size:12px; padding:10px; color:#000;margin:50; }
              h2, h3 { text-align:center; margin:0; }
              p { margin:2px 0; font-size:12px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border:1px solid #000; padding:4px; text-align:center; font-size:12px; }
              th { background-color:#eee; }
              .left-align { text-align:left; }
              .header { text-align:center; margin-bottom:12px;margin-top:12px; }
              .invoice-box { border:1px solid #000; border-bottom:none; }
              .row { display:flex; width:100%; border-bottom:1px solid #000; }
              .col { width:50%; padding:10px; box-sizing:border-box; }
              .col-left { border-right:1px solid #000; }
              .items-table th, .items-table td { border:1px solid #000; padding:4px; font-size:12px; text-align:center; }
              .items-table th { background:#eee; }
              .totals { margin-top:10px; width:100%; }
              .terms { margin-top:10px; display:flex; justify-content:space-between; }
              .bank-details { font-size:12px; }
              .sign { text-align:center; margin-top:50px; font-weight:bold; }
              .text-right { text-align:right; }
              @media print {
                .page { page-break-after:always; }
                .page:last-child { page-break-after:avoid; }
              }
            </style>
          </head>
          <body>
            ${pagesHtml}
          </body>
        </html>
      `;

      const options = {
        html: htmlContent,
        fileName: 'Tax Invoice'.replace('.pdf', ''),
        directory: 'Documents'
      };
      const pdf = await RNHTMLtoPDF.convert(options);
      console.log("PDF generated at:", pdf);
      setPdfFile(pdf);
      return pdf;
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF.");
      throw error;
    }
  };

  const downloadPDF = async () => {
    try {
      let file = pdfFile;
      if (!file || !file.filePath) {
        file = await generatePDF();
      }

      const newFileName = `Tax Invoice_${client || "unknown"}_${marka || "unknown"}.pdf`;
      const downloadPath = `${RNFS.DownloadDirectoryPath}/${newFileName}`;

      await RNFS.copyFile(file.filePath, downloadPath);
      if (RNFS.scanFile) {
        await RNFS.scanFile(downloadPath);
      }

      Alert.alert('Download Successful', `PDF saved to:\n${downloadPath}`);
    } catch (error) {
      console.error("Download PDF error:", error);
      Alert.alert("Error", "Failed to save PDF.");
    }
  };

  const sharePDF = async () => {
    try {
      let file = pdfFile;
      if (!file || !file.filePath) {
        file = await generatePDF();
      }

      const newFileName = `Tax Invoice_${client || "unknown"}_${marka || "unknown"}.pdf`;
      const sharePath = `${RNFS.DownloadDirectoryPath}/${newFileName}`;

      await RNFS.copyFile(file.filePath, sharePath);

      await Share.open({
        url: `file://${sharePath}`,
        type: 'application/pdf',
        failOnCancel: false,
      });
    } catch (error) {
      console.error("Share PDF error:", error);
      Alert.alert("Error", "Failed to share PDF.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isClientSelected ? (
        <ClientSelection />
      ) : data.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "space-between", alignItems: "center", margin: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>Tax Invoice</Text>
          <Text>Please pack item first for this client.</Text>
        </View>
      ) : !showInvoice ? (
        <View style={{ flex: 1, justifyContent: "space-between", alignItems: "center", margin: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>Tax Invoice</Text>
          <Button title="Generate Tax Invoice" onPress={() => { setShowInvoice(true); generatePDF(); }} />
        </View>
      ) : (
        <>
          <ScrollView horizontal={true}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.header}>
                <Text style={styles.companyName}>{user?.account_name || "N/A"}</Text>
                <Text style={styles.text}>{user?.address || "N/A"}</Text>
                <Text style={styles.text}>
                  GSTIN : {user?.iec || "N/A"} , Pan: {user?.pan || "N/A"}
                </Text>
                <Text style={styles.text}>Mobiles: 07838774462</Text>
                <Text style={styles.text}>Email: {user?.email || "N/A"}</Text>
              </View>

              <View style={styles.invoiceBox}>
                <View style={styles.row}>
                  <View style={[styles.col, styles.colLeft]}>
                    <View style={styles.padding10}>
                      <Text style={styles.bold}>Details of Receiver (Bill To)</Text>
                      <Text style={styles.text}>
                        {selectedClient?.client_name || "N/A"}, {selectedClient?.address || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.block}>
                      <Text style={styles.bold}>Details of Consignee (Ship To)</Text>
                      <Text style={styles.text}>
                        {selectedClient?.client_name || "N/A"}, {selectedClient?.address || "N/A"}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.col, styles.colRight]}>
                    <View style={styles.invoiceInfo}>
                      <Text style={styles.bold}>Invoice No: GSM/2526/01114</Text>
                      <Text style={styles.text}>Date : {new Date().toLocaleDateString()}</Text>
                    </View>
                    <Text style={[styles.text, styles.padding10]}>
                      Place of Supply: {selectedClient?.country || "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.table}>
                  <View style={styles.tableRowHeader}>
                    <Text style={[styles.cell, styles.cellSm]}>S.No</Text>
                    <Text style={[styles.cell]}>Part No</Text>
                    <Text style={[styles.cell, styles.cellLg]}>Item Description</Text>
                    <Text style={styles.cell}>HSN</Text>
                    <Text style={styles.cell}>Qty</Text>
                    <Text style={styles.cell}>Rate</Text>
                    <Text style={styles.cell}>Disc%</Text>
                    <Text style={[styles.cell, styles.noRightBorder]}>Amount</Text>
                  </View>

                  {sortedGroupedData.map((item, index) => {
                    const discountRule = selectedClient?.gst?.find(
                      (rule) => rule.gst === String(item.gst)
                    );
                    const discountPercent = discountRule ? parseFloat(discountRule.discount) || 0 : 0;
                    const netAmount = item.grossAmount ? item.grossAmount - (item.grossAmount * discountPercent) / 100 : 0;

                    return (
                      <View key={item.id || index} style={styles.tableRow}>
                        <Text style={[styles.cell, styles.cellSm]}>{index + 1}</Text>
                        <Text style={[styles.cell]}>{item.part_no || "N/A"}</Text>
                        <Text style={[styles.cell, styles.cellLg]}>{item.description || "N/A"}</Text>
                        <Text style={styles.cell}>{item.hsn_no || "N/A"}</Text>
                        <Text style={styles.cell}>{item.total_packing_qty || 0}</Text>
                        <Text style={styles.cell}>{item.mrp_invoice || 0}</Text>
                        <Text style={styles.cell}>{discountPercent}</Text>
                        <Text style={[styles.cell, styles.noRightBorder]}>{(netAmount || 0).toFixed(2)}</Text>
                      </View>
                    );
                  })}
                </View>

                <View style={[styles.block, styles.noPadding]}>
                  <View style={styles.totalRow}>
                    <View style={styles.totalLeft}>
                      <Text style={styles.text}>Total Boxes : {grandTotals.total_case || 0}</Text>
                      {Object.keys(gstBreakdown.breakdown).map((gstRate) => {
                        const breakdown = gstBreakdown.breakdown[gstRate] || {};
                        return otherState ? (
                          <View key={gstRate} style={styles.marginTop10}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <Text style={styles.text}>
                                IGST AMOUNT ({breakdown.igstPercent || 0}%):
                              </Text>
                              <Text style={[styles.text, { padding: 5 }]}>
                                {(breakdown.igstAmount || 0).toFixed(2)}
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <View key={gstRate} style={styles.marginTop10}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <Text style={styles.text}>
                                CGST AMOUNT ({breakdown.cgstPercent || 0}%):
                              </Text>
                              <Text style={[styles.text, { padding: 5 }]}>
                                {(breakdown.cgstAmount || 0).toFixed(2)}
                              </Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <Text style={styles.text}>
                                SGST AMOUNT ({breakdown.sgstPercent || 0}%):
                              </Text>
                              <Text style={[styles.text, { padding: 5 }]}>
                                {(breakdown.sgstAmount || 0).toFixed(2)}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                    <View style={styles.totalRight}>
                      <View style={styles.totalLine}>
                        <Text style={[styles.totalLabel, styles.bold]}>Total Taxable Value:</Text>
                        <Text style={[styles.text, { padding: 5 }]}>
                          {(grandTotals.taxableValue || 0).toFixed(2)}
                        </Text>
                      </View>
                      {otherState ? (
                        <View style={styles.totalLine}>
                          <Text style={styles.totalLabel}>Total IGST:</Text>
                          <Text style={[styles.text, { padding: 5 }]}>
                            {(grandTotals.igstAmount || 0).toFixed(2)}
                          </Text>
                        </View>
                      ) : (
                        <>
                          <View style={styles.totalLine}>
                            <Text style={styles.totalLabel}>Total CGST:</Text>
                            <Text style={[styles.text, { padding: 5 }]}>
                              {(grandTotals.cgstAmount || 0).toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.totalLine}>
                            <Text style={styles.totalLabel}>Total SGST:</Text>
                            <Text style={[styles.text, { padding: 5 }]}>
                              {(grandTotals.sgstAmount || 0).toFixed(2)}
                            </Text>
                          </View>
                        </>
                      )}
                      <View style={styles.totalLine}>
                        <Text style={styles.totalLabel}>Round Off:</Text>
                        <Text style={[styles.text, { padding: 5 }]}>
                          {(grandTotals.roundOff || 0).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.totalLine}>
                        <Text style={styles.totalLabel}>(Rounded) Grand Total:</Text>
                        <Text style={[styles.text, { padding: 5 }]}>
                          {(grandTotals.roundedGrandTotal || 0).toFixed(2)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.bold}>Whether Tax is Payable on Reverse Charge : No</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View style={[styles.block, styles.termsBlock]}>
                <View>
                  <Text style={[styles.bold, { color: "#5c5c5cff" }]}>Terms & Conditions:</Text>
                  <Text style={styles.text}>
                    1. Goods once sold will not be taken back/exchanged,{"\n"}2. Interest @24% will be charged on overdue
                    amount,{"\n"}3. All disputes are subjected to Gurugram Jurisdiction.
                  </Text>

                  <View style={styles.marginTop10}>
                    <Text style={[styles.bold, { color: "#5c5c5cff" }]}>Our Bank Details:</Text>
                    <Text style={styles.bold}>A/c Name: {user?.account_name || "N/A"}</Text>
                    <Text style={styles.bold}>Bank: {user?.bank_name || "N/A"}</Text>
                    <Text style={styles.bold}>A/c No: {user?.account_number || "N/A"}</Text>
                    <Text style={styles.bold}>
                      IFSC: {user?.ifsc_code || "N/A"} , SWIFT: {user?.swift_code || "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.bold}>Authorised Signatory</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 20 }}>
                <Button title="Download PDF" onPress={downloadPDF} />
                <Button title="Share PDF" onPress={sharePDF} />
              </View>
            </ScrollView>
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { alignItems: "center", marginBottom: 12 },
  companyName: { fontSize: 18, fontWeight: "bold" },
  text: { fontSize: 15, marginVertical: 2 },
  bold: { fontWeight: "bold", fontSize: 15 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "#000",
    borderBottomWidth: 1,
  },
  col: { width: "50%" },
  colLeft: { borderRightWidth: 1, borderColor: "#000" },
  colRight: {},
  invoiceBox: { borderWidth: 1, borderColor: "#000" },
  padding10: { padding: 10 },
  invoiceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 10,
  },
  block: { borderTopColor: "#000", borderTopWidth: 1, padding: 10 },
  noPadding: { padding: 0 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  table: {},
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  cell: {
    minWidth: 80,
    fontSize: 13,
    padding: 4,
    borderRightWidth: 1,
    borderColor: "#000",
    textAlign: "center",
  },
  cellSm: { width: 50, minWidth: 40, textAlign: "center" },
  cellLg: { minWidth: 150, flex: 1, textAlign: "left", paddingLeft: 8 },
  noRightBorder: { borderRightWidth: 0 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLeft: {
    width: "57%",
    paddingRight: 5,
    borderRightColor: "black",
    borderRightWidth: 1,
    padding: 10,
  },
  totalRight: { width: "43%" },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "black",
    borderBottomWidth: 1,
  },
  totalLabel: {
    fontSize: 14,
    borderRightColor: "black",
    borderRightWidth: 1,
    padding: 5,
    width: "50%",
  },
  marginTop20: { marginTop: 20 },
  marginTop10: { marginTop: 10 },
  termsBlock: {
    borderTopWidth: 0,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footer: {
    justifyContent: "flex-end",
    alignSelf: "center",
    height: 180,
    paddingLeft: 10,
  },
});

export default TaxInvoice;