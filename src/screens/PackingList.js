import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
  NativeModules,
} from "react-native";
import axios from "axios";
import { Table, TableWrapper, Row, Cell } from "react-native-table-component";
import RNFS from "react-native-fs";
import Share from "react-native-share";
import FileViewer from "react-native-file-viewer";
import XLSX from "xlsx";
import { useSelector } from "react-redux";
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

  useEffect(() => {
    fetchData();
  }, []);

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

  const requestAndroidPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          // Android 13+ — request granular media permissions
          const results = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
          ]);
          const granted = Object.values(results).every(
            r => r === PermissionsAndroid.RESULTS.GRANTED
          );
          return granted;
        }

        if (Platform.Version >= 30) {
          // Android 11+ — request MANAGE_EXTERNAL_STORAGE
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.MANAGE_EXTERNAL_STORAGE
          );
          return result === PermissionsAndroid.RESULTS.GRANTED;
        }

        // Android 10 and below
        const read = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        const write = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        return (
          read === PermissionsAndroid.RESULTS.GRANTED &&
          write === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.error("Permission request error:", err);
        return false;
      }
    }
    return true;
  };





  const generateAndSaveExcel = async () => {
    try {
      console.log("Starting Excel generation...");

      const wsData = [headers.map((h) => h.label)];
      const merges = [];
      const grouped = groupData();
      let currentRow = 1;

      console.log("Grouped data:", Object.keys(grouped).length, "groups");

      for (const group of Object.values(grouped)) {
        const groupSize = group.length;
        if (groupSize === 0) continue;

        console.log(`Processing group with ${groupSize} rows`);

        group.forEach((item, idx) => {
          const row = headers.map(({ key }) => {
            if (sharedFields.includes(key)) {
              return idx === 0 ? item[key] : "";
            }
            return item[key];
          });
          wsData.push(row);
          currentRow++;
        });

        sharedFields.forEach((key) => {
          const colIdx = headers.findIndex((h) => h.key === key);
          if (colIdx === -1) return;

          const startRow = currentRow - groupSize;
          const endRow = currentRow - 1;
          if (startRow < endRow) {
            merges.push({
              s: { r: startRow, c: colIdx },
              e: { r: endRow, c: colIdx },
            });
            console.log(`Merge added: ${key} from row ${startRow + 1} to ${endRow + 1}, col ${colIdx}`);
          }
        });
      }

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      console.log("Merges to apply:", merges);
      ws["!merges"] = merges;

      ws["!cols"] = headers.map((h) => ({ wpx: h.width }));

      headers.forEach((header, colIdx) => {
        if (sharedFields.includes(header.key)) {
          for (let row = 1; row < wsData.length; row++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: colIdx });
            if (!ws[cellRef]) ws[cellRef] = {};
            ws[cellRef].s = { alignment: { vertical: "center", horizontal: "center" } };
          }
        }
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PackingList");

      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      console.log("Excel data generated, writing to file...");

      return { workbook: wbout, worksheet: ws };
    } catch (error) {
      console.error("Excel generation failed:", error);
      Alert.alert("Error", `Excel file generation failed: ${error.message}`, [{ text: "OK" }]);
      return null;
    }
  };

  const handleShare = async () => {
    try {
      console.log("Starting share process...");
      const excelData = await generateAndSaveExcel();
      if (!excelData) {
        console.log("Share aborted: No excel data");
        return;
      }

      const { workbook } = excelData;
      const filePath =
        Platform.OS === "android"
          ? `${RNFS.DownloadDirectoryPath}/PackingList_${Date.now()}.xlsx`
          : `${RNFS.DocumentDirectoryPath}/PackingList_${Date.now()}.xlsx`;
      console.log("File path:", filePath);

      await RNFS.writeFile(filePath, workbook, "base64");
      console.log("File written successfully");

      const fileExists = await RNFS.exists(filePath);
      console.log("File exists:", fileExists);
      if (!fileExists) {
        throw new Error("File was not found after writing");
      }

      console.log("Sharing file:", filePath);
      await Share.open({
        url: `file://${filePath}`,
        title: "Share Packing List Excel",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      console.log("Share completed");
    } catch (error) {
      console.error("Share failed:", error);
      Alert.alert("Error", `Unable to share Excel file: ${error.message}`, [{ text: "OK" }]);
    }
  };

  const handleDownload = async () => {
    try {
      console.log("Starting download process...");
      const granted = await requestAndroidPermissions();
      console.log("Permissions check completed:", granted);

      if (!granted) {
        Alert.alert("Permission Denied", "Storage permission is required to save the file.");
        return;
      }

      const excelData = await generateAndSaveExcel();
      if (!excelData) {
        console.log("Download aborted: No excel data");
        return;
      }

      const { workbook } = excelData;

      const filename = `PackingList_${Date.now()}.xlsx`;
      const filePath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${filename}`
          : `${RNFS.DocumentDirectoryPath}/${filename}`;

      console.log("File path:", filePath);

      await RNFS.writeFile(filePath, workbook, "base64");
      console.log("File written successfully");

      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        throw new Error("File was not found after writing");
      }

      // Optional: trigger media scan so file is visible to other apps
      if (Platform.OS === 'android' && NativeModules?.MediaScannerConnection?.scanFile) {
        NativeModules.MediaScannerConnection.scanFile(filePath, null);
      }

      Alert.alert("Download Successful", `Excel file saved:\n${filePath}`, [{ text: "OK" }]);

      // Try opening with FileViewer
      const viewerPath = `file://${filePath}`;
      try {
        await FileViewer.open(viewerPath, {
          showOpenWithDialog: true,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        console.log("File viewer opened");
      } catch (viewerError) {
        console.log("File viewer error:", viewerError.message);

        // Fallback: Share the file so user can choose app manually
        try {
          await FileViewer.open(viewerPath, {
            showOpenWithDialog: true,
            displayName: 'PackingList.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });

          console.log("Fallback share dialog opened");
        } catch (shareError) {
          console.log("Could not open file via Share:", shareError.message);
          Alert.alert("Download Successful", `Excel file saved:\n${filePath}`, [{ text: "OK" }]);
        }
      }
    } catch (error) {
      console.log("Download error:", error);;
    }
  };
  const tableData = generateTableRows();
  const partNoHeader = headers[0];
  const restHeaders = headers.slice(1);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📋 Packing Details</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" />
      ) : hasError ? (
        <Text style={styles.noData}>Failed to fetch data</Text>
      ) : (
        <>
          <View style={{ flexDirection: "row" }}>
            <ScrollView style={{ maxHeight: 1000 }}>
              <Table>
                <Row
                  data={[partNoHeader.label.toUpperCase()]}
                  style={styles.header}
                  textStyle={styles.headerText}
                  widthArr={[partNoHeader.width]}
                />
                {tableData.map((rowData, index) => (
                  <TableWrapper key={index} style={[styles.row, { paddingRight: 50 }]}>
                    <Cell
                      data={rowData[0]}
                      textStyle={styles.cellText}
                      style={[styles.cell, { width: partNoHeader.width, }]}
                    />
                  </TableWrapper>
                ))}
              </Table>
            </ScrollView>

            <ScrollView horizontal>
              <ScrollView style={{ maxHeight: 1000 }}>
                <Table>
                  <Row
                    data={restHeaders.map((h) => h.label.toUpperCase())}
                    style={styles.header}
                    textStyle={styles.headerText}
                    widthArr={restHeaders.map((h) => h.width)}
                  />
                  {tableData.map((rowData, index) => (
                    <TableWrapper key={index} style={styles.row}>
                      {rowData.slice(1).map((cellData, i) => (
                        <Cell
                          key={i}
                          data={cellData}
                          textStyle={styles.cellText}
                          style={[styles.cell, { width: restHeaders[i].width }]}
                        />
                      ))}
                    </TableWrapper>
                  ))}
                </Table>
              </ScrollView>
            </ScrollView>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 20 }}>
            <TouchableOpacity style={styles.exportButton} onPress={handleShare}>
              <Text style={styles.exportText}>📤 Share Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: "#28A745" }]}
              onPress={handleDownload}
            >
              <Text style={styles.exportText}>⬇️ Download Excel</Text>
            </TouchableOpacity>
          </View>
        </>
      )
      }
    </View >
  );
};

export default DisplayPackingList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingTop: 40,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#333",
  },
  header: {
    height: 50,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
  },
  headerText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    backgroundColor: "#FFF1F0",
  },
  cell: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#000",
  },
  cellText: {
    textAlign: "center",
    fontSize: 11,
  },
  exportButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  exportText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  noData: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
});