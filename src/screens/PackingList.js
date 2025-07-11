import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform
} from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import API from "../components/API";
import { useExcelExporter } from "../components/useExcelExporter";

const DisplayPackingList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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
          if (key === "sr_no") {
            return serial++;
          }
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

  const tableData = generateTableRows();

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

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== "android") return true;

    try {
      const sdkInt = Platform.Version;
      if (sdkInt < 30) {
        const write = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (write !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn("❌WRITE_EXTERNAL_STORAGE permission denied");
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error("Permission error:", err);
      return false;
    }
  };




  const handleDownloadExcel = async () => {
    const granted = await requestAndroidPermissions();
    if (!granted) {
      Alert.alert("Permission Denied", "Storage permission is required to save the file.");
      return;
    }

    const filePath = await generateExcelFile({
      data,
      headers,
      fileName: `PackingList_${Date.now()}`,
      sheetName: "PackingList",
    });

    if (filePath) {
      console.log("Download complete", `File saved to: ${filePath}`);
      Alert.alert("Download Complete", `File saved to: ${filePath}`);
    } else {
      Alert.alert("Error", "Failed to download Excel file.");
    }
  };

  const handleShareExcel = async () => {
    const granted = await requestAndroidPermissions();
    if (!granted) {
      Alert.alert("Permission Denied", "Storage permission is required to share the file.");
      return;
    }

    const filePath = await generateExcelFile({
      data,
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
      <Text style={styles.heading}>📋 Packing Details</Text>
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
              data={[...tableData, totalsRow]}
              renderItem={renderRow}
              keyExtractor={(_, idx) => String(idx)}
              initialNumToRender={30}
              maxToRenderPerBatch={60}
              windowSize={21}
            />
          </View>
        </ScrollView>
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
  header: { backgroundColor: "#4CAF50" },
  headerText: { fontWeight: "bold", textAlign: "center", fontSize: 12, color: "#fff", padding: 6 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#ccc", height: 30, alignItems: "center" },
  cellText: { fontSize: 11, textAlign: "center", padding: 4, borderRightWidth: 0.5, borderColor: "#ddd", },
  noData: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#888" },
  buttonContainer: { flexDirection: "row", justifyContent: "center", marginTop: 20, marginBottom: 12, gap: 12 },
  button: { backgroundColor: "#2196F3", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  buttonText: { color: "#fff", fontSize: 14 },
  totalRowBackground: { backgroundColor: "#ffe0b2", },
});
