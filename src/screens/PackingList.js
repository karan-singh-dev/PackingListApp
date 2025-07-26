import React, { useCallback, useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { useSelector } from "react-redux";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import API from "../components/API";
import { useExcelExporter } from "../components/useExcelExporter";

const DisplayPackingList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState(""); // 👈 New state for jump-to-page
  const navigation = useNavigation();
  const itemsPerPage = 30;

  const { generateExcelFile, shareExcelFile } = useExcelExporter();
  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const client = selectedClient.client_name;
  const marka = selectedClient.marka;

  const headers = [
    { label: "Sr. No.", key: "sr_no", width: 60 },
    { label: "Part No", key: "part_no", width: 160 },
    { label: "Description", key: "description", width: 200 },
    { label: "HSN No", key: "hsn_no", width: 80 },
    { label: "GST", key: "gst", width: 60 },
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

  useFocusEffect(useCallback(() => { fetchData(); }, [client, marka]));

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
    let serial = 1;
    for (const group of Object.values(grouped)) {
      let prevSharedValues = {};
      group.forEach((item, idx) => {
        const row = headers.map(({ key }) => {
          if (key === "sr_no") return serial++;
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

  const tableData = useMemo(() => generateTableRows(), [data]);

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
        const val = row[idx];
        if (val !== "") {
          switch (key) {
            case "cbm": totals.cbm += parseFloat(val) || 0; break;
            case "total_gross_wt": totals.total_gross_wt += parseFloat(val) || 0; break;
            case "total_net_wt": totals.total_net_wt += parseFloat(val) || 0; break;
            case "total_case": totals.total_case += parseFloat(val) || 0; break;
            case "total_mrp": totals.total_mrp += parseFloat(val) || 0; break;
          }
        }
      });
    });
    return totals;
  };

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

  const totalPages = Math.ceil((tableData.length + 1) / itemsPerPage);
  const paginatedData = [...tableData, totalsRow].slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== "android") return true;
    try {
      const sdkInt = Platform.Version;
      if (sdkInt < 30) {
        const write = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (write !== PermissionsAndroid.RESULTS.GRANTED) return false;
      }
      return true;
    } catch (err) {
      console.error("Permission error:", err);
      return false;
    }
  };

  const handleDownloadExcel = async () => {
    // Convert raw data into rows based on headers
    const processedData = data.map((item, index) => {
      const row = {};
      headers.forEach(({ key }) => {
        row[key] = key === "sr_no" ? index + 1 : item[key];
      });
      return row;
    });

    // Add totals row at the end
    const totalsRowObject = {};
    headers.forEach(({ key }) => {
      switch (key) {
        case "cbm":
          totalsRowObject[key] = totals.cbm.toFixed(2);
          break;
        case "total_gross_wt":
          totalsRowObject[key] = totals.total_gross_wt.toFixed(2);
          break;
        case "total_net_wt":
          totalsRowObject[key] = totals.total_net_wt.toFixed(2);
          break;
        case "total_case":
          totalsRowObject[key] = totals.total_case.toFixed(0);
          break;
        case "total_mrp":
          totalsRowObject[key] = totals.total_mrp.toFixed(2);
          break;
        default:
          totalsRowObject[key] = ""; // empty for non-total columns
      }
    });
    processedData.push(totalsRowObject);

    const granted = await requestAndroidPermissions();
    if (!granted) return Alert.alert("Permission Denied", "Storage permission is required to save the file.");

    const filePath = await generateExcelFile({
      data: processedData,
      headers,
      fileName: `PackingList_${Date.now()}`,
      sheetName: "PackingList",
    });

    if (filePath) {
      Alert.alert("Download Complete", `File saved to: ${filePath}`);
    } else {
      Alert.alert("Error", "Failed to download Excel file.");
    }
  };

  const handleShareExcel = async () => {
    // Convert raw data into rows based on headers
const processedData = data.map((item, index) => {
  const row = {};
  headers.forEach(({ key }) => {
    row[key] = key === "sr_no" ? index + 1 : item[key];
  });
  return row;
});


const totalsRowObject = {};
headers.forEach(({ key }) => {
  switch (key) {
    case "cbm":
      totalsRowObject[key] = totals.cbm.toFixed(2);
      break;
    case "total_gross_wt":
      totalsRowObject[key] = totals.total_gross_wt.toFixed(2);
      break;
    case "total_net_wt":
      totalsRowObject[key] = totals.total_net_wt.toFixed(2);
      break;
    case "total_case":
      totalsRowObject[key] = totals.total_case.toFixed(0);
      break;
    case "total_mrp":
      totalsRowObject[key] = totals.total_mrp.toFixed(2);
      break;
    default:
      totalsRowObject[key] = ""; 
  }
});
processedData.push(totalsRowObject);

    const granted = await requestAndroidPermissions();
    if (!granted) return Alert.alert("Permission Denied", "Storage permission is required to share the file.");

    const filePath = await generateExcelFile({
      data: processedData,
      headers,
      fileName: `PackingList_${Date.now()}`,
      sheetName: "PackingList",
    });

    if (filePath) {
      await shareExcelFile(filePath, "Packing List");
      Alert.alert("Share Initiated", "Sharing the Excel file...");
    } else {
      Alert.alert("Error", "Failed to share Excel file.");
    }
  };

  const renderRow = ({ item, index }) => {
    const isTotalsRow = index === tableData.length;
    return (
      <View
        style={[
          styles.row,
          isTotalsRow
            ? styles.totalRowBackground
            : index % 2 && { backgroundColor: "#f9f9f9" },
        ]}
      >
        {item.map((cell, i) => (
          <Text
            key={i}
            style={[styles.cellText, { width: headers[i].width }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {cell}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
          <Icon name="menu" size={30} color="#000" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>📋 Packing Details</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" />
      ) : hasError ? (
        <Text style={styles.noData}>Failed to fetch data</Text>
      ) : (
        <ScrollView horizontal>
          <View>
            <View style={[styles.row, styles.header]}>
              {headers.map((h, i) => (
                <Text key={i} style={[styles.headerText, { width: h.width }]}>
                  {h.label.toUpperCase()}
                </Text>
              ))}
            </View>
            <FlatList
              data={paginatedData}
              renderItem={renderRow}
              keyExtractor={(_, idx) => String(idx)}
              initialNumToRender={20}
              maxToRenderPerBatch={60}
              windowSize={21}
            />
          </View>
        </ScrollView>
      )}

      {!loading && !hasError && (
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 10, gap: 10, flexWrap: 'wrap' }}>
          <TouchableOpacity
            style={[styles.button, currentPage === 1 && { backgroundColor: "#aaa" }]}
            disabled={currentPage === 1}
            onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            <Text style={styles.buttonText}>⬅️ Prev</Text>
          </TouchableOpacity>

          <Text style={{ alignSelf: "center", fontSize: 14, color: "#333" }}>
            Page {currentPage} of {totalPages}
          </Text>

          <TouchableOpacity
            style={[styles.button, currentPage === totalPages && { backgroundColor: "#aaa" }]}
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            <Text style={styles.buttonText}>Next ➡️</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
            <Text>Go to page</Text>
            <TextInput
              style={[styles.input, { width: 60, textAlign: "center" }]}
              keyboardType="numeric"
              placeholder="Page"
              value={pageInput}
              onChangeText={setPageInput}
            />
            <TouchableOpacity
              style={[styles.button, { marginLeft: 8, paddingHorizontal: 12 }]}
              onPress={() => {
                const pageNum = parseInt(pageInput);
                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                  setCurrentPage(pageNum);
                  setPageInput("");
                } else {
                  Alert.alert("Invalid Page", `Please enter a number between 1 and ${totalPages}`);
                }
              }}
            >
              <Text style={styles.buttonText}>Go</Text>
            </TouchableOpacity>
          </View>
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
  headerContainer: { marginBottom: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 20, backgroundColor: '#fff' },
  menuButton: { marginLeft: 15 },
  heading: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#333" },
  header: { backgroundColor: "#4CAF50" },
  headerText: { fontWeight: "bold", textAlign: "center", fontSize: 12, color: "#fff", padding: 6 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#ccc", height: 30, alignItems: "center" },
  cellText: { fontSize: 11, textAlign: "center", padding: 4, borderRightWidth: 0.5, borderColor: "#ddd", },
  noData: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#888" },
  buttonContainer: { flexDirection: "row", justifyContent: "center", marginTop: 20, marginBottom: 12, gap: 12 },
  button: { backgroundColor: "#2196F3", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  buttonText: { color: "#fff", fontSize: 14 },
  totalRowBackground: { backgroundColor: "#ffe0b2" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff",
  },
});
