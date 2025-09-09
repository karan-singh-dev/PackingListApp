import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import API from "../../../components/API"; // replace with your actual API import

const PermissionScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch users from API
  useEffect(() => {
    API.get("/api/user/permissions/")
      .then((res) => {
        console.log("API response:", res.data);
        setUsers(res.data);
      })
      .catch((err) => {
        console.error(err);
        Alert.alert("Error", "Failed to fetch users.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Toggle individual permission
  const togglePermission = (id) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, permission: !u.permission } : u
      )
    );
  };

  // Save all changes
  const save = async () => {
    try {
      await API.put(
        "/api/user/permissions/",
        users.map(({ id, permission }) => ({ id, permission }))
      );
      Alert.alert("Success", "Permissions updated!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update permissions.");
    }
  };

  // Render each user
  const renderUser = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.permissionRow}>
        <Text style={styles.name}>{item.username}</Text>
        <View style={styles.permission}>
          <Text style={{ marginRight: 10 }}>
            {item.permission ? "Allowed" : "Denied"}
          </Text>
          <Switch
            value={item.permission}
            onValueChange={() => togglePermission(item.id)}
          />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Text style={styles.header}>Sub-User Permissions</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>Save Permissions</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PermissionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E40AF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  permission: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveBtn: {
    backgroundColor: "#1E40AF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
