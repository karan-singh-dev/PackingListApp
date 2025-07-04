import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = axios.create({
    baseURL: "https://gk-backend-c2ih.onrender.com",
});

// Add access token to every request
API.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auto-refresh on 401
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;
            try {
                const refreshToken = await AsyncStorage.getItem("refresh_token");
                if (!refreshToken) throw new Error("No refresh token found");

                const res = await axios.post(
                    "https://gk-backend-c2ih.onrender.com/api/token/refresh/",
                    { refresh: refreshToken }
                );

                await AsyncStorage.setItem("access_token", res.data.access);
                originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
                return API(originalRequest);
            } catch (refreshError) {
                console.error("Refresh token expired or invalid");
                await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
                // Optionally navigate to login screen:
                // navigation.navigate("Login"); // if using React Navigation
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default API;
