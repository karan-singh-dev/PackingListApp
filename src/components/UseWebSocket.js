import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { resetToLogin } from "../navigation/RootNavigation"; // adjust path
import { useDispatch } from "react-redux";
import { logOutUser } from "../redux/slices/LoginSlice";

export default function useLogoutWebSocket(userId) {
  const wsRef = useRef(null);
  const dispatch = useDispatch();
  useEffect(() => {
    if (!userId) return;

    console.log("🔗 Opening WS for user:", userId);

    const ws = new WebSocket(`wss://gk-backend-c2ih.onrender.com/ws/logout/${userId}/`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 WS data:", data);
        if (data.type === "logout") {
          Alert.alert("Logged out", data.message || "Your session has ended.");
          dispatch(logOutUser());
        }
      } catch (err) {
        console.log("❌ WS parse error:", err);
      }
    };

    ws.onerror = (err) => {
      console.log("❌ WebSocket error:", err.message);
    };

    ws.onclose = (event) => {
      console.log("🔌 WebSocket closed", event.code, event.reason);
      wsRef.current = null;
    };

    return () => {
      console.log("🧹 Cleaning up WS");
      ws.close?.();
    };
  }, [userId]);

  return wsRef;
}
