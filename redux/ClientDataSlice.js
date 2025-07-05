import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from "../src/components/API";

export const fetchClients = createAsyncThunk(
  'clientData/fetchClients',
  async (_, thunkAPI) => {
    try {
      const response = await API.get("/api/client/clients/");
      return response.data;
    } catch (error) {
      console.error('API error:', error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const addClientAsync = createAsyncThunk(
  'clientData/addClientAsync',
  async (clientData, thunkAPI) => {
    try {
      const response = await API.post("/api/client/clients/", clientData);
      return response.data;
    } catch (error) {
      console.error('API error:', error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);


export const updateClientAsync = createAsyncThunk(
  'clientData/updateClientAsync',
  async (clientData, thunkAPI) => {
    try {
      const response = await API.put(`/api/client/clients/${clientData.id}/`, clientData);
      return response.data;
    } catch (error) {
      console.error('API error:', error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);


export const deleteClientAsync = createAsyncThunk(
  'clientData/deleteClientAsync',
  async (clientId, thunkAPI) => {
    try {
      await API.delete(`/api/client/clients/${clientId}/`);
      return clientId;
    } catch (error) {
      console.error('API error:', error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);


const clientDataSlice = createSlice({
  name: 'clientData',
  initialState: {
    clients: [],
    selectedClient: null,
    loading: false,
    error: null,
  },
  reducers: {
    resetClients: (state) => {
      state.clients = [];
      state.error = null;
      state.selectedClient = null;
    },
    setSelectedClient: (state, action) => {
      state.selectedClient = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addClientAsync.fulfilled, (state, action) => {
        state.clients.push(action.payload);
      })
      .addCase(addClientAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateClientAsync.fulfilled, (state, action) => {
        const index = state.clients.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
      })
      .addCase(updateClientAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteClientAsync.fulfilled, (state, action) => {
        state.clients = state.clients.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteClientAsync.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { resetClients, setSelectedClient } = clientDataSlice.actions;
export default clientDataSlice.reducer;
