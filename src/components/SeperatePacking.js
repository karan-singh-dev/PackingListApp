import React, { useEffect, useState, useMemo } from "react";
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
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  fetchPackingData,
  setNextCaseNumber,
  setPackingType,
  submitPackingDetails,
} from "../../redux/PackigListSlice";
import API from '../components/API';  // ✅ updated import
import { Dropdown } from 'react-native-element-dropdown';

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

const HIDDEN_FIELDS = ["total_mrp", "npr", "nsr",];

const SeperatePacking = () => {
  const selectedClient = useSelector((state) => state.clientData.selectedClient);
  const client = selectedClient.client_name;
  const marka = selectedClient.marka;

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const [netWt, setNetWt] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [customInput, setCustomInput] = useState("");
  const { nextCaseNumber, packing, stock, loading, estimateList } = useSelector((state) => state.packing);

  // console.log('nextCaseNumber', nextCaseNumber)



  const [form, setForm] = useState(initialForm);
  const notShow = HIDDEN_FIELDS;
  const disable = [
    "case_no_end",
    "total_box",
    "cbm",
    "gst",
    "hsn_no",
    "description",
    "part_no",
    "total_case",
    "total_net_wt",
    "total_gross_wt",
  ];

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
        const res = await API.get('api/packing/net-weight/', {
          params: { part_no: form.part_no },  // <- use `params` for GET
        });
        setNetWt(res.data);
        console.log(res.data, 'ok');
      } catch (err) {
        console.log(err.response?.data || err.message, '===================');
        // Optional: Alert.alert(err.response?.data?.error || "Error fetching data");
      }
    };
    if (form.part_no) {
      fetchData();
    }
  }, [form.part_no]);

  useEffect(() => {
    if (form.part_no && estimateList.length) {
      const item = estimateList.find((e) => e.part_no === form.part_no);
      if (item) {
        setForm((prev) => ({
          ...prev,
          mrp_invoice: item.mrp || "",
          box_mrp: item.mrp || "",
          description: item.description || "",
          hsn_no: item.hsn || "",
          gst: item.tax_percent?.toString() || "",
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
    const qty = parseFloat(form.total_packing_qty);
    const perBox = parseFloat(form.qty_per_box);
    if (!isNaN(qty) && !isNaN(perBox) && perBox !== 0) {
      const totalBox = Math.ceil(qty / perBox);
      setForm((prev) => ({ ...prev, total_box: totalBox.toString() }));
    }
  }, [form.total_packing_qty, form.qty_per_box]);

  useEffect(() => {
    const totalQty = parseInt(form.total_packing_qty);
    const packedPerBag = parseInt(form.packed_in_plastic_bag);
    const caseStart = parseInt(form.case_no_start);
    if (!isNaN(totalQty) && !isNaN(packedPerBag) && packedPerBag > 0 && !isNaN(caseStart)) {
      const totalCases = Math.ceil(totalQty / packedPerBag);
      const caseEnd = caseStart + totalCases - 1;
      setForm((prev) => ({
        ...prev,
        total_case: totalCases.toString(),
        case_no_end: caseEnd.toString(),
      }));
    }
  }, [form.total_packing_qty, form.packed_in_plastic_bag, form.case_no_start]);

  useEffect(() => {
    const l = parseFloat(form.length);
    const w = parseFloat(form.width);
    const h = parseFloat(form.height);
    const total = parseFloat(form.total_case);
    if (!isNaN(l) && !isNaN(w) && !isNaN(h) && !isNaN(total)) {
      const cbm = (l * w * h * total * 0.00001638).toFixed(4);
      setForm((prev) => ({ ...prev, cbm }));
    }
  }, [form.length, form.width, form.height, form.total_case]);

  useEffect(() => {
    const net = parseFloat(form.net_wt);
    const qty = parseFloat(form.total_packing_qty);
    const gross = parseFloat(form.gross_wt);
    const total = parseFloat(form.total_case);
    if (!isNaN(net) && !isNaN(qty)) {
      const total_net_wt = (net * qty).toFixed(3).toString();
      setForm((prev) => ({ ...prev, total_net_wt }));
    }
    if (!isNaN(gross) && !isNaN(total)) {
      const total_gross_wt = (gross * total).toFixed(3).toString();
      setForm((prev) => ({ ...prev, total_gross_wt }));
    }
  }, [form.net_wt, form.total_packing_qty, form.gross_wt, form.packed_in_plastic_bag]);

  useEffect(() => {
    const qty = parseFloat(form.total_packing_qty);
    const mrp = parseFloat(form.mrp_invoice);
    if (!isNaN(qty) && !isNaN(mrp)) {
      const total_mrp = (qty * mrp).toFixed(2).toString();
      setForm((prev) => ({ ...prev, total_mrp }));
    }
  }, [form.total_packing_qty, form.mrp_invoice]);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
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
    }
  };



  const handleBackPress = async () => {
    try {
      const res = await API.get("api/packing/packing-details/", {
        params: { client, marka },
      });
      if (res.data.length == 0 || res.data[res.data.length - 1].cbm !== "0.0000") {
        dispatch(setPackingType(null));
        console.log(res.data[res.data.length - 1].cbm)
      }
      navigation.navigate("RowPackingList");
    } catch (error) {
      console.error("Failed to fetch packing data:", error);

    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBackPress();
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      const unsubscribe = navigation.addListener('beforeRemove', () => {

        handleBackPress();
      });

      return () => {
        backHandler.remove();
        unsubscribe();
      };
    }, [navigation])
  );



  const handleSubmit = async () => {
    try {
      const res = await dispatch(submitPackingDetails({ form, passedData, client, marka })).unwrap();
      dispatch(setNextCaseNumber(parseInt(nextCaseNumber) + 1));
      Alert.alert("Success", "Packing detail added.");
      setForm(initialForm);
      handleNetwt();
      dispatch(setPackingType(null));
      navigation.navigate("PackingList");
    } catch (error) {
      console.error("Packing submit error:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="arrow-left" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}> Start Seperate Packing</Text>
        <View style={styles.card}>
          {Object.entries(form).map(([key, value]) => {
            if (notShow.includes(key)) return null;
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
                    style={styles.dropdown}
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
            return (
              <View key={key} style={styles.inputGroup}>
                <Text style={styles.label}>{key.replace(/_/g, " ")}</Text>
                <TextInput
                  keyboardType="numeric"
                  value={value}
                  onChangeText={(text) => handleChange(key, text)}
                  placeholder={`Enter ${key.replace(/_/g, " ")}`}
                  editable={!disable.includes(key)}
                  style={[styles.input, disable.includes(key) && styles.disabledInput]}
                />
              </View>
            );
          })}
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>


    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f2f4f7",
    flexGrow: 1,
  },
  backButton: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
    textTransform: "capitalize",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fefefe",
    fontSize: 14,
  },
  disabledInput: {
    backgroundColor: "#e0e0e0",
    color: "#888",
  },
  button: {
    marginTop: 24,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 14 : 8,
    backgroundColor: '#fefefe',
  },
  dropdownContainer: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 4,
  },
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
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 8,
  },

});

export default SeperatePacking;
