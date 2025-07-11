import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../src/components/API"; // ✅ Use your Axios instance!

export const loginUser = createAsyncThunk(
    "login/loginUser",
    async ({ username, password }, thunkAPI) => {
        try {
            const response = await API.post("/api/token/", { username, password }, {
                headers: { "Content-Type": "application/json" },
            });

            const { access, refresh } = response.data;

            // ✅ Save tokens to AsyncStorage
            await AsyncStorage.setItem("access_token", access);
            await AsyncStorage.setItem("refresh_token", refresh);

            console.log("Login success. Tokens saved to AsyncStorage.");
            return access;
        } catch (error) {
            console.log("Login error:", error.response?.data || error.message);
            const message =
                error.response?.data?.detail ||
                error.response?.data?.message ||
                error.message ||
                "Login failed";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const loginSlice = createSlice({
    name: 'login',
    initialState: {
        Token: null,
        loading: false,
        error: null,
    },
    reducers: {
        setToken: (state, action) => {
            state.Token = action.payload;
        },
        logout: (state) => {
            state.Token = null;
            AsyncStorage.removeItem("access_token");
            AsyncStorage.removeItem("refresh_token");
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.Token = action.payload;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { logout, setToken } = loginSlice.actions;
export default loginSlice.reducer;
