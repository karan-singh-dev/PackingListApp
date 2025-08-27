// services/AuthService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

let logoutHandler = null;

export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

export const handleLogout = async (reason = "Session expired") => {
  await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
  if (logoutHandler) logoutHandler(); // 🔑 call Redux logout from outside
};
