import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const DownloadModal = ({ visible, onClose, onDownloadPDF, onDownloadExcel, onShare }) => {
  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>File Options</Text>

          <TouchableOpacity style={styles.button} onPress={onDownloadPDF}>
            <Text style={styles.buttonText}>Download PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={onDownloadExcel}>
            <Text style={styles.buttonText}>Download Excel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={onShare}>
            <Text style={styles.buttonText}>Share File</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: '#ccc' }]} onPress={onClose}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
  },
});

export default DownloadModal;
