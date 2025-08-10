import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Dropdown } from "react-native-element-dropdown";



const CBMCalculator = () => {
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");
  const [quantity, setQuantity] = useState("1");


  const units = [
  { label: "in", value: "in" },
  { label: "cm", value: "cm" },
  { label: "mm", value: "mm" },
  { label: "m", value: "m" },
];

  // separate unit states
  const [heightUnit, setHeightUnit] = useState("in");
  const [widthUnit, setWidthUnit] = useState("in");
  const [lengthUnit, setLengthUnit] = useState("in");

  const [cbm, setCbm] = useState(0);


const unitConversion = {
  in: 0.0254, 
  cm: 0.01,   
  mm: 0.001,  
  m: 1        
};

const calculateCBM = () => {
  const h = parseFloat(height) || 0;
  const w = parseFloat(width) || 0;
  const l = parseFloat(length) || 0;
  const q = parseInt(quantity) || 1;

 

  
  const hMeters = h * unitConversion[heightUnit];
  const wMeters = w * unitConversion[widthUnit] ;
  const lMeters = l * unitConversion[lengthUnit];

 
  const result = hMeters * wMeters * lMeters * q;
  setCbm(result.toFixed(3));
  console.log("CBM:", result.toFixed(4));
};


  useEffect(() => {
    calculateCBM();
  }, [height, width, length, quantity, heightUnit, widthUnit, lengthUnit]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CBM Calculator</Text>

      {/* Height */}
      <Text style={styles.label}>Height</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Height"
          placeholderTextColor="#777"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />
        <Dropdown
          style={styles.dropdown}
          data={units}
          labelField="label"
          valueField="value"
          value={heightUnit}
          onChange={(item) => setHeightUnit(item.value)}
          selectedTextStyle={styles.dropdownText}
          placeholderStyle={styles.dropdownText}
        />
      </View>

      {/* Width */}
      <Text style={styles.label}>Width</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Width"
          placeholderTextColor="#777"
          keyboardType="numeric"
          value={width}
          onChangeText={setWidth}
        />
        <Dropdown
          style={styles.dropdown}
          data={units}
          labelField="label"
          valueField="value"
          value={widthUnit}
          onChange={(item) => setWidthUnit(item.value)}
          selectedTextStyle={styles.dropdownText}
          placeholderStyle={styles.dropdownText}
        />
      </View>

      {/* Length */}
      <Text style={styles.label}>Length</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Length"
          placeholderTextColor="#777"
          keyboardType="numeric"
          value={length}
          onChangeText={setLength}
        />
        <Dropdown
          style={styles.dropdown}
          data={units}
          labelField="label"
          valueField="value"
          value={lengthUnit}
          onChange={(item) => setLengthUnit(item.value)}
          selectedTextStyle={styles.dropdownText}
          placeholderStyle={styles.dropdownText}
        />
      </View>

      {/* Quantity */}
      <Text style={styles.label}>Quantity</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="1"
          placeholderTextColor="#777"
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
        />
      </View>

      {/* Result */}
      <Text style={styles.result}>CBM: {cbm} </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 5,
    marginLeft: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    padding: 10,
    color: "#fff",
    backgroundColor: "#111",
    marginRight: 10,
  },
  dropdown: {
    width: 80,
    height: 45,
    borderColor: "#555",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: "#111",
  },
  dropdownText: {
    color: "#fff", // white text inside dropdown
    fontSize: 14,
  },
  qtyText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
  },
  result: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
});

export default CBMCalculator;
