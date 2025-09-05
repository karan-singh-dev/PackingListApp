import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { pick, types } from '@react-native-documents/picker';
import * as ExcelJS from 'exceljs';
import RNFS from 'react-native-fs';
import { useSelector } from 'react-redux';
import API from '../../../components/API';
import Checklist from '../../../components/Checklist';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const UploadMrpList = ({ navigation }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [brandName, setBrandName] = useState('');

  const selectedClient = useSelector((state) => state?.clientData?.selectedClient);
  const client_id = selectedClient?.id || '';

  const brandOptions = [
    { label: 'BAJAJ', value: 'BAJAJ' },
    { label: 'HERO', value: 'HERO' },
    { label: 'YAMAHA', value: 'YAMAHA' },
    { label: 'SUZUKI', value: 'SUZUKI' },
    { label: 'INDURANCE', value: 'INDURANCE' },
  ];

  // Parse Excel only for preview
  const parseExcel = async (fileUri) => {
    try {
      const filePath = fileUri.replace('file://', '');
      const b64 = await RNFS.readFile(filePath, 'base64');

      const binaryString = atob(b64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const buffer = bytes.buffer;

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) return Alert.alert('Error', 'No worksheet found');

      let rows = [];
      let hdrs = [];

      worksheet.eachRow((row, rowNumber) => {
        const rowValues = row.values.slice(1);
        if (rowNumber === 1) {
          hdrs = rowValues;
        } else if (rowNumber <= 51) {
          rows.push(rowValues);
        }
      });

      setHeaders(hdrs);
      setPreviewData(rows);
    } catch (err) {
      console.error('Excel parse error:', err);
      Alert.alert('Error', 'Failed to read Excel file');
    }
  };

  const handleFilePick = async () => {
    if (!brandName) return Alert.alert('Please select a brand first');

    try {
      const res = await pick({
        allowMultiSelection: false,
        type: [types.xlsx],
      });
      if (!res || !res[0]) return Alert.alert('No file selected');

      setSelectedFile(res[0]);
      setHeaders([]);
      setPreviewData([]);
      await parseExcel(res[0].uri);
    } catch (err) {
      console.error('File pick error:', err);
      Alert.alert('Error', 'Could not pick file');
    }
  };

  const handleMrpUpload = async () => {
    if (!selectedFile) return Alert.alert('Please select a file first');
    if (!brandName) return Alert.alert('Please select a brand first');

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      formData.append("brand_name", brandName);

      await API.post("/api/mrp/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Success", "MRP list uploaded");

      setSelectedFile(null);
      setHeaders([]);
      setBrandName('');
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      Alert.alert("Upload Failed", err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {showChecklist ? (
        <Checklist
          name={['part_no', 'description', 'mrp_per_unit', 'hsn_code', 'gst']}
          onProceed={() => {
            setShowChecklist(false);
            handleFilePick();
          }}
          onCancel={() => setShowChecklist(false)}
        />
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Upload MRP List</Text>
            <View style={styles.headerRight} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Brand Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Brand</Text>
              <Dropdown
                style={styles.dropdown}
                selectedTextStyle={styles.dropdownSelectedText}
                inputSearchStyle={styles.dropdownInputSearch}
                iconStyle={styles.dropdownIcon}
                data={brandOptions}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="-- Select Brand --"
                searchPlaceholder="Search..."
                value={brandName}
                onChange={(item) => setBrandName(item.value)}
                renderLeftIcon={() => (
                  <Icon name="business" size={20} color="#1E40AF" style={styles.dropdownLeftIcon} />
                )}
              />
            </View>

            {/* File Upload Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upload Excel File</Text>
              <TouchableOpacity 
                style={[styles.uploadCard, selectedFile && styles.uploadCardSelected]}
                onPress={() => setShowChecklist(true)}
                activeOpacity={0.7}
              >
                <View style={styles.uploadIconContainer}>
                  <Icon 
                    name={selectedFile ? "check-circle" : "cloud-upload"} 
                    size={40} 
                    color={selectedFile ? "#10B981" : "#1E40AF"} 
                  />
                </View>
                <Text style={styles.uploadTitle}>
                  {selectedFile ? "File Selected" : "Tap to Upload"}
                </Text>
                <Text style={styles.uploadSubtitle} numberOfLines={1}>
                  {selectedFile ? selectedFile.name : "Select an Excel file to upload"}
                </Text>
                <Text style={styles.uploadHint}>
                  {selectedFile ? "Tap to change file" : "Supports .xlsx files"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Preview Section */}
            {headers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preview</Text>
                <View style={styles.previewContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View>
                      <View style={styles.tableHeader}>
                        {headers.map((h, i) => (
                          <View key={i} style={styles.columnHeader}>
                            <Text style={styles.columnHeaderText}>{h}</Text>
                          </View>
                        ))}
                      </View>
                      {previewData.map((row, idx) => (
                        <View key={idx} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowEven]}>
                          {headers.map((_, i) => (
                            <View key={i} style={styles.tableCell}>
                              <Text style={styles.cellText}>{row[i] || ""}</Text>
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                <Text style={styles.previewNote}>Showing first {previewData.length} rows</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.footerButton, styles.uploadButton, (!selectedFile || loading) && styles.buttonDisabled]}
              onPress={handleMrpUpload}
              disabled={!selectedFile || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Icon name="file-upload" size={20} color="#FFF" style={styles.buttonIcon} />
                  <Text style={styles.footerButtonText}>Upload MRP List</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#1E40AF" />
                <Text style={styles.loadingText}>Uploading your file...</Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E40AF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dropdown: {
    height: 50,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: '#111827',
  },
  dropdownInputSearch: {
    height: 40,
    fontSize: 16,
  },
  dropdownIcon: {
    width: 20,
    height: 20,
  },
  dropdownLeftIcon: {
    marginRight: 8,
  },
  uploadCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadCardSelected: {
    borderColor: '#10B981',
    borderStyle: 'solid',
  },
  uploadIconContainer: {
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  previewContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 300,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  columnHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 120,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  columnHeaderText: {
    fontWeight: '600',
    color: '#374151',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableRowEven: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 120,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  cellText: {
    fontSize: 14,
    color: '#4B5563',
  },
  previewNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1E40AF',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonIcon: {
    marginRight: 8,
  },
  footerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.7,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4B5563',
  },
});

export default UploadMrpList;