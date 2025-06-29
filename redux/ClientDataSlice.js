import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API } from '@env';

console.log(API,'API===============')

// 🔄 Fetch all clients
export const fetchClients = createAsyncThunk('clientData/fetchClients', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API}api/client/clients/`);
    console.log(response)
    return response.data;
  } catch (error) {
   console.error("API error:", error.response?.data || error.message);
    return rejectWithValue(error.response?.data || error.message);
  }
});

// ➕ Add a new client
export const addClientAsync = createAsyncThunk('clientData/addClientAsync', async (clientData, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API}api/client/clients/`, clientData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

// ✏️ Update existing client
export const updateClientAsync = createAsyncThunk('clientData/updateClientAsync', async (clientData, { rejectWithValue }) => {
  try {
    const response = await axios.put(`${API}api/client/clients/${clientData.id}`, clientData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

// ❌ Delete a client
export const deleteClientAsync = createAsyncThunk('clientData/deleteClientAsync', async (clientId, { rejectWithValue }) => {
   console.log('delet api call',`${API}api/client/clients/${clientId}/)`)
  try {
    const res = await axios.delete(`${API}api/client/clients/${clientId}/`);

    return clientId;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

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
        const index = state.clients.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
      })
      .addCase(updateClientAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteClientAsync.fulfilled, (state, action) => {
        state.clients = state.clients.filter(c => c.id !== action.payload);
      })
      .addCase(deleteClientAsync.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { resetClients, setSelectedClient } = clientDataSlice.actions;
export default clientDataSlice.reducer;
