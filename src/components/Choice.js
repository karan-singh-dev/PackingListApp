import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { setPackingType } from '../../redux/PackigListSlice';

const Choice = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const dispatch = useDispatch();
  const route = useRoute();
  const item = route.params.item
  const { PackingType } = useSelector((state) => state.packing);

  console.log(PackingType, 'PackingType====')
  useEffect(() => {
    if (PackingType == null) {
      setModalVisible(true)
    } else if (PackingType == 'seperate') {
      navigation.navigate('SeperatePacking', { item: item });
    } else {
      navigation.navigate('MixPacking', { item: item });
    }
    ;
  }, []);

  const handleSelection = (option) => {
    setSelectedOption(option);
    setModalVisible(false);
    if (option === 'seperate') {
      dispatch(setPackingType(option))
      navigation.navigate('SeperatePacking', { item: item });

    } else if (option === 'Mix') {
      dispatch(setPackingType(option))
      navigation.navigate('MixPacking', { item: item });
    }
  };

  return (
    <View>
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select your packing type</Text>

            <TouchableOpacity
              style={styles.optionContainer}
              onPress={() => handleSelection('seperate')}
            >
              <View style={styles.radioCircle}>
                {selectedOption === 'seperate' && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.optionText}>Separate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionContainer}
              onPress={() => handleSelection('Mix')}
            >
              <View style={styles.radioCircle}>
                {selectedOption === 'Mix' && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.optionText}>Mix</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 25,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007BFF',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default Choice;
