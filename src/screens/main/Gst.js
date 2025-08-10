import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';

export default function Gst() {
  const [less, setLess] = useState('');
  const [results, setResults] = useState(null);

  const calculateGST = () => {
    const parsedLess = parseFloat(less);

    if (isNaN(parsedLess)) {
      alert('Please enter a valid number');
      return;
    }

    const val_28 = +(100 - ((100 * (100 - parsedLess)) / 128)).toFixed(2);
    const val_18 = +(100 - ((100 * (100 - parsedLess)) / 118)).toFixed(2);
    const val_12 = +(100 - ((100 * (100 - parsedLess)) / 112)).toFixed(2);
    const val_5 = +(100 - ((100 * (100 - parsedLess)) / 105)).toFixed(2);

    setResults({ val_28, val_18, val_12, val_5 });
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GST Calculator</Text>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Enter LESS"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={less}
          onChangeText={setLess}
          style={styles.input}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={calculateGST}>
        <Text style={styles.buttonText}>Calculate</Text>
      </TouchableOpacity>

      {results && (
        <View style={styles.resultBox}>
          <GSTRow label="GST @ 28%" value={results.val_28} />
          <GSTRow label="GST @ 18%" value={results.val_18} />
          <GSTRow label="GST @ 12%" value={results.val_12} />
          <GSTRow label="GST @ 5%" value={results.val_5} />
        </View>
      )}
    </View>
  );
}

const GSTRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}%</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111114',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#888',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  resultBox: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#1a1a1f',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  label: {
    color: '#aaa',
    fontSize: 16,
  },
  value: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
