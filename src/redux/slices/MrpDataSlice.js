import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from "../../components/API";

export const fetchMrpList = createAsyncThunk(
  'clientData/fetchMrpList',
  async (_, thunkAPI) => {
    try {
      const response = await API.get("api/mrp/data/");
      return response.data;
    } catch (error) {
      console.error('API error:', error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

const MrpDataSlice = createSlice({
  name: 'MrpData',
  initialState: {
    parts: [],
    selectedpart: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedPart: (state, action) => {
      state.selectedpart = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMrpList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMrpList.fulfilled, (state, action) => {
        state.loading = false;
        state.parts = action.payload; // ✅ Corrected here
      })
      .addCase(fetchMrpList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedPart } = MrpDataSlice.actions;
export default MrpDataSlice.reducer;
