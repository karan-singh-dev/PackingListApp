import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Table, TableWrapper, Row, Cell } from "react-native-table-component";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import RNFS from "react-native-fs";
import Share from "react-native-share";
import XLSX from "xlsx";
import API from "../components/API";

const DisplayPackingList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const client = selectedClient.client_name;
  const marka = selectedClient.marka;

  const headers = [
    { label: "Part No", key: "part_no", width: 160 },
    { label: "Description", key: "description", width: 200 },
    { label: "HSN No", key: "hsn_no", width: 80 },
    { label: "GST", key: "gst", width: 60 },
    { label: "Brand", key: "brand_name", width: 60 },
    { label: "Total Qty", key: "total_packing_qty", width: 100 },
    { label: "MRP (Invoice)", key: "mrp_invoice", width: 110 },
    { label: "Box MRP", key: "mrp_box", width: 100 },
    { label: "Total MRP", key: "total_mrp", width: 100 },
    { label: "NPR", key: "npr", width: 80 },
    { label: "NSR", key: "nsr", width: 80 },
    { label: "Plastic Bag", key: "packed_in_plastic_bag", width: 100 },
    { label: "Case No Start", key: "case_no_start", width: 110 },
    { label: "Case No End", key: "case_no_end", width: 110 },
    { label: "Total Case", key: "total_case", width: 100 },
    { label: "Net Wt", key: "net_wt", width: 90 },
    { label: "Total Net Wt", key: "total_net_wt", width: 110 },
    { label: "Gross Wt", key: "gross_wt", width: 90 },
    { label: "Total Gross Wt", key: "total_gross_wt", width: 120 },
    { label: "Length", key: "length", width: 80 },
    { label: "Width", key: "width", width: 80 },
    { label: "Height", key: "height", width: 80 },
    { label: "CBM", key: "cbm", width: 80 },
    { label: "BRAND NAME", key: "brand_name", width: 80 },
  ];

  const sharedFields = [
    "case_no_start",
    "case_no_end",
    "total_case",
    "gross_wt",
    "total_gross_wt",
    "length",
    "width",
    "height",
    "cbm",
  ];

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
      fetchData();
    }, [client, marka])
  );

  const groupData = () => {
    const grouped = {};
    data.forEach((item) => {
      const key = `${item.case_no_start}-${item.case_no_end}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  };

  const generateTableRows = () => {
    const grouped = groupData();
    const allRows = [];
    for (const group of Object.values(grouped)) {
      let prevSharedValues = {};
      group.forEach((item, idx) => {
        const row = headers.map(({ key }) => {
          if (sharedFields.includes(key)) {
            const shouldDisplay = idx === 0 || item[key] !== prevSharedValues[key];
            prevSharedValues[key] = item[key];
            return shouldDisplay ? item[key] : "";
          } else {
            return item[key];
          }
        });
        allRows.push(row);
      });
    }
    return allRows;
  };

  const calculateTotalsFromTableData = () => {
    const totals = {
      cbm: 0,
      total_gross_wt: 0,
      total_net_wt: 0,
      total_case: 0,
      total_mrp: 0,
    };

    tableData.forEach((row) => {
      headers.forEach(({ key }, idx) => {
        const cellValue = row[idx];
        if (cellValue !== "") {
          switch (key) {
            case "cbm":
              totals.cbm += parseFloat(cellValue) || 0;
              break;
            case "total_gross_wt":
              totals.total_gross_wt += parseFloat(cellValue) || 0;
              break;
            case "total_net_wt":
              totals.total_net_wt += parseFloat(cellValue) || 0;
              break;
            case "total_case":
              totals.total_case += parseFloat(cellValue) || 0;
              break;
            case "total_mrp":
              totals.total_mrp += parseFloat(cellValue) || 0;
              break;
            default:
              break;
          }
        }
      });
    });

    return totals;
  };

  const tableData = generateTableRows();
  const totals = calculateTotalsFromTableData();

  const totalsRow = headers.map(({ key }) => {
    switch (key) {
      case "cbm": return totals.cbm.toFixed(2);
      case "total_gross_wt": return totals.total_gross_wt.toFixed(2);
      case "total_net_wt": return totals.total_net_wt.toFixed(2);
      case "total_case": return totals.total_case.toFixed(0);
      case "total_mrp": return totals.total_mrp.toFixed(2);
      default: return "";
    }
  });

  const generateWorkbook = () => {
    const wsData = [
      headers.map((h) => h.label),  // header row
      ...tableData,                 // table rows you see on screen
    ];

    // Add totals row with a clear marker in the first cell
    const highlightedTotalsRow = [...totalsRow];
    highlightedTotalsRow[0] = "TOTALS →";  // make first cell say "TOTALS →" instead of empty

    wsData.push(highlightedTotalsRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PackingList");
    return XLSX.write(wb, { type: "binary", bookType: "xlsx" });
  };


  const handleDownloadExcel = async () => {
    try {
      const wbout = generateWorkbook();
      const path = `${RNFS.DownloadDirectoryPath}/PackingList_${Date.now()}.xlsx`;
      await RNFS.writeFile(path, wbout, "ascii");
      Alert.alert("Download complete", `File saved to: ${path}`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to download Excel file.");
    }
  };

  const handleShareExcel = async () => {
    try {
      const wbout = generateWorkbook();
      const path = `${RNFS.CachesDirectoryPath}/PackingList_${Date.now()}.xlsx`;
      await RNFS.writeFile(path, wbout, "ascii");
      await Share.open({ url: `file://${path}` });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to share Excel file.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📋 Packing Details</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" />
      ) : hasError ? (
        <Text style={styles.noData}>Failed to fetch data</Text>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView horizontal>
            <View>
              <Row
                data={headers.map((h) => h.label.toUpperCase())}
                style={styles.header}
                textStyle={styles.headerText}
                widthArr={headers.map((h) => h.width)}
              />
              <ScrollView style={{ maxHeight: 1000 }}>
                <Table>
                  {tableData.map((rowData, index) => (
                    <TableWrapper key={index} style={styles.row}>
                      {rowData.map((cellData, i) => (
                        <Cell
                          key={i}
                          data={
                            headers[i].key === "description" ? (
                              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.cellText}>
                                {cellData}
                              </Text>
                            ) : (
                              <Text style={styles.cellText}>{cellData}</Text>
                            )
                          }
                          style={[styles.cell, { width: headers[i].width }]}
                        />
                      ))}
                    </TableWrapper>
                  ))}
                  <TableWrapper style={[styles.row, { backgroundColor: "#DFF0D8" }]}>
                    {totalsRow.map((cellData, i) => (
                      <Cell
                        key={`total-${i}`}
                        data={<Text style={[styles.cellText, { fontWeight: "bold" }]}>{cellData}</Text>}
                        style={[styles.cell, { width: headers[i].width }]}
                      />
                    ))}
                  </TableWrapper>
                </Table>
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleDownloadExcel}>
          <Text style={styles.buttonText}>⬇️ Download</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleShareExcel}>
          <Text style={styles.buttonText}>📤 Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DisplayPackingList;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 12, textAlign: "center", color: "#333" },
  header: { height: 50, backgroundColor: "#4CAF50", justifyContent: "center" },
  headerText: { textAlign: "center", color: "#fff", fontWeight: "bold", fontSize: 12 },
  row: { flexDirection: "row", backgroundColor: "#FFF1F0" },
  cell: { padding: 8, borderWidth: 1, borderColor: "#000" },
  cellText: { textAlign: "center", fontSize: 11 },
  noData: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#888" },
  buttonContainer: { flexDirection: "row", justifyContent: "center", marginTop: 20, marginBottom: 12, gap: 12 },
  button: { backgroundColor: "#2196F3", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  buttonText: { color: "#fff", fontSize: 14 },
});
