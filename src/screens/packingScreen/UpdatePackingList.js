import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import API from "../../components/API";

export default function UpdatePackingList() {
    const selectedClient = useSelector((state) => state.clientData.selectedClient);
    const client = selectedClient?.client_name;
    const marka = selectedClient?.marka;
    const route = useRoute();
    const navigation = useNavigation();
    const data = route.params?.item
    console.log("UpdatePackingList data:", data);
    const [formData, setFormData] = useState({ ...data });

    useEffect(() => {
        const qty = parseInt(formData.total_packing_qty, 10);
        const perBox = parseInt(formData.packed_in_plastic_bag, 10);
        if (!isNaN(qty) && !isNaN(perBox) && perBox !== 0) {
            const totalBox = Math.ceil(qty / perBox);
            setFormData((prev) => ({ ...prev, total_case: totalBox.toString() }));
        } else {
            setFormData((prev) => ({ ...prev, total_case: "" }));
        }
    }, [formData.total_packing_qty, formData.packed_in_plastic_bag]);

    useEffect(() => {
        const net_wt = parseFloat(formData.net_wt);
        const total = parseInt(formData.total_packing_qty, 10);
        if (!isNaN(net_wt) && !isNaN(total)) {
            const total_net_wt = (net_wt * total).toFixed(3);
            setFormData((prev) => ({ ...prev, total_net_wt: total_net_wt.toString() }));
        } else {
            setFormData((prev) => ({ ...prev, total_net_wt: "" }));
        }
    }, [formData.net_wt, formData.total_packing_qty]);

    useEffect(() => {
        const mrp = parseFloat(formData.mrp_invoice);
        const qty = parseInt(formData.total_packing_qty, 10);
        if (!isNaN(mrp) && !isNaN(qty)) {
            const total_mrp = (mrp * qty).toFixed(2);
            setFormData((prev) => ({ ...prev, total_mrp: total_mrp.toString() }));
        } else {
            setFormData((prev) => ({ ...prev, total_mrp: "" }));
        }
    }, [formData.mrp_invoice, formData.total_packing_qty]);

    useEffect(() => {
        const gross_wt = parseFloat(formData.gross_wt);
        const total = parseInt(formData.total_case, 10);
        if (!isNaN(gross_wt) && !isNaN(total)) {
            const total_gross_wt = (gross_wt * total).toFixed(3);
            setFormData((prev) => ({
                ...prev,
                total_gross_wt: total_gross_wt.toString(),
            }));
        } else {
            setFormData((prev) => ({ ...prev, total_gross_wt: "" }));
        }
    }, [formData.gross_wt, formData.total_case]);

    useEffect(() => {
        const length = parseFloat(formData.length);
        const width = parseFloat(formData.width);
        const height = parseFloat(formData.height);
        const totalBox = parseInt(formData.total_case, 10);
        if (!isNaN(length) && !isNaN(width) && !isNaN(height) && !isNaN(totalBox)) {
            const cbm = (length * width * height * totalBox * 0.00001638).toFixed(4);
            setFormData((prev) => ({ ...prev, cbm: cbm.toString() }));
        } else {
            setFormData((prev) => ({ ...prev, cbm: "" }));
        }
    }, [formData.length, formData.width, formData.height, formData.total_case]);

    if (!data) {
        return (
            <View style={styles.container}>
                <Text>No data received.</Text>
            </View>
        );
    }

    const handleChange = (name, value) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async () => {
        console.log(client, marka, formData, 'formData');
        try {
            await API.put("/api/packing/packing-details/", {
                id: formData.id,
                client_name: client,
                marka: marka,
                ...formData,
            });
            Alert.alert("Success", "Update successful");
            //   navigation.navigate("PackingList"); // screen name in your navigator
            navigation.goBack();
        } catch (error) {
            console.error("Error updating packing detail", error.response?.data || error);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Update Packing List</Text>

            {Object.entries(formData).map(([key, value]) => {
                if (key === "id" || key === "client") return null;

                return (
                    <View key={key} style={styles.inputGroup}>
                        <Text style={styles.label}>{key.replace(/_/g, " ")}</Text>
                        <TextInput
                            style={styles.input}
                            value={formData[key]?.toString()}
                            onChangeText={(text) => handleChange(key, text)}
                            keyboardType={typeof value === "number" ? "numeric" : "default"}
                        />
                    </View>
                );
            })}
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>submit</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#f2f4f7",
        flexGrow: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
        textTransform: "capitalize",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 8,
        borderRadius: 4,
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
});
