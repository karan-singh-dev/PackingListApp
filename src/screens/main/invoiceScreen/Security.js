import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Switch,
  TouchableOpacity,
} from "react-native";

const PermissionScreen = () => {
  const [subUsers, setSubUsers] = useState([
    { id: "1", name: "Alice", permissions: { view: true, edit: false, delete: false } },
    { id: "2", name: "Bob", permissions: { view: true, edit: true, delete: false } },
    { id: "3", name: "Charlie", permissions: { view: false, edit: false, delete: false } },
  ]);

  // Toggle specific permission
  const togglePermission = (id, type) => {
    setSubUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id
          ? {
              ...user,
              permissions: {
                ...user.permissions,
                [type]: !user.permissions[type],
              },
            }
          : user
      )
    );
  };

  const renderUser = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <View style={styles.permissionRow}>
        <View style={styles.permission}>
          <Text>View</Text>
          <Switch
            value={item.permissions.view}
            onValueChange={() => togglePermission(item.id, "view")}
          />
        </View>
        <View style={styles.permission}>
          <Text>Edit</Text>
          <Switch
            value={item.permissions.edit}
            onValueChange={() => togglePermission(item.id, "edit")}
          />
        </View>
        <View style={styles.permission}>
          <Text>Delete</Text>
          <Switch
            value={item.permissions.delete}
            onValueChange={() => togglePermission(item.id, "delete")}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Permissions</Text>

      <FlatList
        data={subUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
      />

      <TouchableOpacity style={styles.saveBtn}>
        <Text style={styles.saveText}>Save Permissions</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PermissionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  permissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  permission: {
    alignItems: "center",
  },
  saveBtn: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
