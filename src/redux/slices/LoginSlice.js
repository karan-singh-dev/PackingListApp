import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../components/API"; // ✅ your Axios instance

// 🔹 LOGIN thunk
export const loginUser = createAsyncThunk(
  "login/loginUser",
  async ({ username, password }, thunkAPI) => {
    try {
      const response = await API.post(
        "/api/token/",
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const { access, refresh } = response.data;

      // ✅ Save tokens
      await AsyncStorage.setItem("access_token", access);
      await AsyncStorage.setItem("refresh_token", refresh);

      console.log("Login success. Tokens saved to AsyncStorage.");
      return access; // we’ll keep `access` in Redux
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

// 🔹 LOGOUT thunk
export const logOutUser = createAsyncThunk(
  "login/logOutUser",
  async (_, thunkAPI) => {
    try {
      // Optional: notify backend
      await API.post("/api/logout/", null, {
        headers: { "Content-Type": "application/json" },
      });

      // ✅ Clear storage
      await AsyncStorage.multiRemove(["access_token", "refresh_token"]);

      console.log("Logout success. Tokens removed from AsyncStorage.");
      return true;
    } catch (error) {
      console.log("Logout error:", error.response?.data || error.message);
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Logout failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const loginSlice = createSlice({
  name: "login",
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
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.Token = action.payload; // store access token
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 🔹 LOGOUT
      .addCase(logOutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logOutUser.fulfilled, (state) => {
        state.loading = false;
        state.Token = null;
      })
      .addCase(logOutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, setToken } = loginSlice.actions;
export default loginSlice.reducer;
