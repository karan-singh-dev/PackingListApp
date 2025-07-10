import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import Icon from 'react-native-vector-icons/Feather';

import { InteractionManager } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import {
  fetchPackingData,
  setNextCaseNumber,
  setPackingType,
  submitPackingDetails,
} from "../../redux/PackigListSlice";
import API from "../components/API"; // 
import { Dropdown } from "react-native-element-dropdown";

const initialForm = {
  part_no: "",
  description: "",
  hsn_no: "",
  gst: "",
  total_packing_qty: "",
  mrp_invoice: "",
  box_mrp: "",
  packed_in_plastic_bag: "",
  case_no_start: "",
  case_no_end: "",
  total_case: "",
  net_wt: "",
  gross_wt: "",
  total_net_wt: "",
  total_gross_wt: "",
  length: "",
  width: "",
  height: "",
  cbm: "",
  total_mrp: "",
  npr: "",
  nsr: "",
  brand_name: "",
};

const HIDDEN_FIELDS = ["total_mrp", "npr", "nsr", "brand_name"];
const allowedUpdateKeys = ["gross_wt", "length", "width", "height"];
const disable = [
  "part_no", "description", "hsn_no", "gst", "brand_name",
  "case_no_start", "case_no_end",
  "total_case", "total_net_wt", "total_gross_wt", "cbm", "packed_in_plastic_bag",
];

const MixPacking = () => {
  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const client = selectedClient.client_name;
  const marka = selectedClient.marka;

  const [Back, setBack] = useState(false);
  const [choiceChange, setchoiceChange] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  const { nextCaseNumber, packing, stock, loading, estimateList, PackingType } = useSelector((state) => state.packing);

  console.log(estimateList, '===========estimateList')

  const [updates, setupdates] = useState({
    gross_wt: 0,
    total_gross_wt: 0,
    length: 0,
    width: 0,
    height: 0,
    cbm: 0,
  });
  const [showFields, setShowFields] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [netWt, setNetWt] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [customInput, setCustomInput] = useState("");

  const passedData = useMemo(() => route.params?.item || "", [route.params]);





  useEffect(() => {
    dispatch(fetchPackingData({ client, marka }));
    setForm((prev) => ({ ...prev, case_no_start: nextCaseNumber.toString() }));

  }, [passedData]);





  useEffect(() => {
    if (passedData) {
      setForm((prev) => ({ ...prev, part_no: passedData }));
      setSelectedOption("");
      setCustomInput("");
    }
  }, [passedData]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get(`api/packing/net-weight/`, {
          params: { part_no: form.part_no },
        });
        setNetWt(res.data);
      } catch (err) {
        Alert.alert(err.response?.data?.error || "Error fetching data");
      }
    };
    if (form.part_no) fetchData();
  }, [form.part_no, passedData]);

  useEffect(() => {
    if (form.part_no && estimateList.length) {
      const item = estimateList.find((e) => e.part_no === form.part_no);
      console.log('itm==============', item)
      if (item) {
        setForm((prev) => ({
          ...prev,
          mrp_invoice: item.mrp || "",
          box_mrp: item.mrp || "",
          description: item.description || "",
          hsn_no: item.hsn || "",
          gst: typeof item.tax_percent === 'string'
            ? parseFloat(item.tax_percent.replace(/[^\d.]/g, ''))
            : ""
        }));
      }
    }
  }, [form.part_no, estimateList]);

  useEffect(() => {
    if (!form.part_no || !stock.length || !packing.length) return;
    const stockMatch = stock.find((s) => s.part_no === form.part_no);
    const packingMatch = packing.find((p) => p.part_no === form.part_no);
    const stockQty = stockMatch?.qty || 0;
    const packingQty = packingMatch?.qty || 0;
    const minQty = Math.min(stockQty, packingQty);
    setForm((prev) => ({
      ...prev,
      total_packing_qty: minQty.toString(),
      brand_name: stockMatch?.brand_name || "",
    }));
  }, [form.part_no, stock, packing]);

  useEffect(() => {
    const netWt = parseFloat(form.net_wt);
    const qty = parseFloat(form.total_packing_qty);
    const caseStart = parseInt(form.case_no_start, 10);
    if (!isNaN(netWt) && !isNaN(qty)) {
      form.total_net_wt = (netWt * qty).toFixed(3).toString();
    }
    const totalCases = 1;
    const caseEnd = caseStart;
    setForm((prev) => ({
      ...prev,
      total_case: totalCases.toString(),
      case_no_end: caseEnd.toString(),
      packed_in_plastic_bag: qty.toString(),
    }));
  }, [form.net_wt, form.total_packing_qty, form.packed_in_plastic_bag, form.case_no_start]);

  useEffect(() => {
    const l = parseFloat(updates.length);
    const w = parseFloat(updates.width);
    const h = parseFloat(updates.height);
    const total = 1;
    if (!isNaN(l) && !isNaN(w) && !isNaN(h)) {
      const cbm = (l * w * h * total * 0.00001638).toFixed(4);
      setupdates((prev) => ({ ...prev, cbm: cbm }));
    }
  }, [updates.length, updates.width, updates.height, showFields]);

  useEffect(() => {
    const grossWt = parseFloat(updates.gross_wt);
    if (!isNaN(grossWt)) {
      const totalGrossWt = (grossWt).toFixed(3);
      setupdates((prev) => ({ ...prev, total_gross_wt: totalGrossWt }));
    }
  }, [updates.gross_wt]);

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (allowedUpdateKeys.includes(key)) {
      setupdates((prev = {}) => ({ ...prev, [key]: value }));
    }
  };


  const handleNetwt = async () => {
    try {
      const netWtValue = parseFloat(form.net_wt);
      if (isNaN(netWtValue)) {
        Alert.alert("Invalid Input", "Net weight must be a valid number.");
        return;
      }

      const res = await API.post(
        "api/packing/net-weight/",
        {
          part_no: form.part_no,
          net_wt: netWtValue,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Net weight posted successfully:", res.data);
    } catch (err) {
      console.error("Net weight post error:", err.response?.data || err.message);
      Alert.alert("Error", err.response?.data?.error || "Error posting net weight");
    }
  };





  const handleCaseUpdate = async () => {
    try {
      const res = await API.post('api/packing/packingdetail/update-by-case/', {
        case_no_start: form.case_no_start.toString(),
        client,
        marka,
        updates,
      });
      if (res.status === 200) {
        setupdates({});
        setShowFields(false);
        setForm(initialForm);

        navigation.navigate('PackingList');
      }
    } catch (error) {
      console.log('API error details:', error?.response?.data || error?.message || error);

      let errorMessage = "Bad Request"; // fallback

      if (error?.response?.data) {
        const errData = error.response.data;
        if (typeof errData === 'string') {
          errorMessage = errData;
        } else if (typeof errData === 'object') {
          errorMessage = errData.message || JSON.stringify(errData);
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", "Update failed: " + errorMessage);
    }
  };




  const handleSubmit = async () => {

    try {
      await dispatch(submitPackingDetails({ form, passedData, client, marka, PackingType })).unwrap();

      Alert.alert(
        'Success',
        'Do you want to add more items to this case?',
        [
          { text: 'NO', onPress: () => { setShowFields(true) }, style: 'cancel' },
          { text: 'YES', onPress: () => { setForm(initialForm), handleNetwt(), navigation.navigate('RowPackingList') } },
        ],
        { cancelable: false }
      );

    } catch (error) {
      console.log('error', error)
      Alert.alert("Error", "Something went wrong.");
    }
  };




  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>📦 Start Mix Packing</Text>
        <View style={styles.card}>
          {!showFields &&
            Object.entries(form).map(([key, value]) => {
              if (HIDDEN_FIELDS.includes(key)) return null;
              if (!showFields && ["gross_wt", "length", "width", "height", "total_gross_wt", "cbm"].includes(key)) return null;

              if (key === "net_wt") {
                const dropdownData = netWt.map((item) => ({
                  label: `${item.net_wt} --- ${item.count}`,
                  value: item.net_wt.toString(),
                })).concat({ label: "New Net Weight", value: "Other" });

                return (
                  <View key={key} style={styles.inputGroup}>
                    <Text style={styles.label}>Net Weight</Text>
                    <Dropdown
                      data={dropdownData}
                      labelField="label"
                      valueField="value"
                      value={selectedOption}
                      placeholder="-- Select --"
                      onChange={(item) => {
                        setSelectedOption(item.value);
                        if (item.value !== "Other") {
                          setForm((prev) => ({ ...prev, net_wt: item.value }));
                        }
                      }}
                      style={styles.input}
                      containerStyle={styles.dropdownContainer}
                      itemTextStyle={{ fontSize: 14 }}
                    />
                    {selectedOption === "Other" && (
                      <TextInput
                        placeholder="Enter custom net weight"
                        value={customInput}
                        onChangeText={(text) => {
                          setCustomInput(text);
                          setForm((prev) => ({ ...prev, net_wt: text }));
                        }}
                        style={styles.input}
                        keyboardType="numeric"
                      />
                    )}
                  </View>
                );
              }

              const isDisabled = disable.includes(key) || (!allowedUpdateKeys.includes(key) && showFields);
              return (
                <View key={key} style={styles.inputGroup}>
                  <Text style={styles.label}>{key.replace(/_/g, " ")}</Text>
                  <TextInput
                    value={value?.toString() || ""}
                    onChangeText={(text) => handleInputChange(key, text)}
                    placeholder={`Enter ${key.replace(/_/g, " ")}`}
                    editable={!isDisabled}
                    style={[styles.input, isDisabled && styles.disabledInput]}
                    keyboardType="numeric"
                  />
                </View>
              );
            })}

          {showFields && (
            <>
              {allowedUpdateKeys.map((key) => (
                <View key={key} style={styles.inputGroup}>
                  <Text style={styles.label}>{key.replace(/_/g, " ")}</Text>
                  <TextInput
                    value={updates[key]?.toString() || ""}
                    onChangeText={(text) => handleInputChange(key, text)}
                    placeholder={`Enter ${key.replace(/_/g, " ")}`}
                    style={styles.input}
                    keyboardType="numeric"
                  />
                </View>
              ))}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>cbm</Text>
                <TextInput value={updates.cbm?.toString() || ""} editable={false} style={[styles.input, styles.disabledInput]} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>total gross wt</Text>
                <TextInput value={updates.total_gross_wt?.toString() || ""} editable={false} style={[styles.input, styles.disabledInput]} />
              </View>
            </>
          )}
        </View>

        {!showFields ? (
          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, { backgroundColor: "#28a745" }]} onPress={handleCaseUpdate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f2f4f7", flexGrow: 1 },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 20, color: "#333" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 14, color: "#555", marginBottom: 6, textTransform: "capitalize" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, backgroundColor: "#fefefe", fontSize: 14 },
  disabledInput: { backgroundColor: "#e0e0e0", color: "#888" },
  dropdownContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingHorizontal: 8, backgroundColor: "#fefefe", marginTop: 6 },
  button: { marginTop: 24, backgroundColor: "#007AFF", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
});

export default MixPacking;
