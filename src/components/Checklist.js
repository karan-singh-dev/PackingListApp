// import libraries
import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import CheckBox from '@react-native-community/checkbox';

// create a component
const Checklist = ({ name, onProceed }) => {
    const [checkedItems, setCheckedItems] = useState({});

    const allChecked = name.every(key => checkedItems[key]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Please ensure the required columns are included in your excel file before uploading.
                {'\n'}
                <Text style={{ color: '#a5a7f8ff' }}>
                    Table headings must follow the specified syntax exactly, as described below.
                </Text>
            </Text>
            <View style={{ flex: 1, justifyContent: 'center' }}>
                {name.map(key => (
                    <View key={key} style={styles.checkboxRow}>
                        <CheckBox
                            value={!!checkedItems[key]}
                            onValueChange={() =>
                                setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))
                            }
                            tintColors={{ true: '#00ff00', false: '#fff' }}
                        />
                        <Text style={styles.label}>{key}</Text>
                    </View>
                ))}
            </View>

            <Button
                title="Proceed"
                onPress={onProceed}
                disabled={!allChecked}
            />
        </View>
    );
};


// define your styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 50,
        backgroundColor: '#2c3e50',
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        fontSize: 20,
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center'
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    label: {
        color: '#fff',
        fontSize: 18,
        marginLeft: 8,
    },
    success: {
        marginTop: 20,
        color: 'lightgreen',
        fontSize: 18,
    },
});

// make this component available to the app
export default Checklist;
