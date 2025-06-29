import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API } from '@env';

// Async thunk to fetch all required packing data
export const fetchPackingData = createAsyncThunk(

  'packing/fetchPackingData',

  async ({ client, marka }) => {
    console.log(API,'API===============')
    const [stockRes, estimateRes, packingRes] = await Promise.all([
      axios.get(`${API}api/packing/stock/`),
      axios.get(`${API}api/asstimate/?client_name=${client}&marka=${marka}`),
      axios.get(`${API}api/packing/packing/?client_name=${client}&marka=${marka}`),
    ]);
    return {

      packing: packingRes.data,
      stock: stockRes.data,
      estimateList: estimateRes.data,
    };
  }
);

// Async thunk to submit form data
export const submitPackingDetails = createAsyncThunk(
  'packing/submitPackingDetails',
  async ({ form, passedData, client, marka, PackingType }, { rejectWithValue }) => {
    try {
  
      const parsedForm = {
  ...form,
  client, // Assuming this is the client ID (int or UUID depending on your model)
  marka,  // Not in model, assuming it’s a custom field used elsewhere

  // Foreign Key
  client: client, // Make sure it's just the ID (e.g., 1), not the whole object

  // Strings
  part_no: form.part_no || "",
  description: form.description || "",
  hsn_no: form.hsn_no || "",
  brand_name: form.brand_name || "",

  // Integers
  total_packing_qty: parseInt(form.total_packing_qty, 10) || 0,
  packed_in_plastic_bag: parseInt(form.packed_in_plastic_bag, 10) || 0,
  case_no_start: parseInt(form.case_no_start, 10) || 0,
  case_no_end: parseInt(form.case_no_end, 10) || 0,
  total_case: parseInt(form.total_case, 10) || 0,
  length: parseInt(form.length, 10) || 0,
  width: parseInt(form.width, 10) || 0,
  height: parseInt(form.height, 10) || 0,
  gst: form.gst !== "" ? parseInt(form.gst, 10) : null, // null if not provided

  // Decimals
  mrp_invoice: parseFloat(form.mrp_invoice) || 0,
  mrp_box: parseFloat(form.box_mrp) || 0, // box_mrp maps to mrp_box
  total_mrp: parseFloat(form.box_mrp || 0) * parseInt(form.total_packing_qty || 0), // matches model
  npr: parseFloat(form.npr) || 0, // was "" – should be number
  nsr: parseFloat(form.nsr) || 0,
  net_wt: parseFloat(form.net_wt) || 0,
  gross_wt: parseFloat(form.gross_wt) || 0,
  total_net_wt: parseFloat(form.total_net_wt) || 0,
  total_gross_wt: parseFloat(form.total_gross_wt) || 0,
  cbm: parseFloat(form.cbm) || 0
};
      if (passedData) {
        try {
          const deleteRes = await axios.post(`${API}api/packing/packing/delete-by-partno/`, {
            part_no: parsedForm.part_no,
            qty: parsedForm.total_packing_qty,
            client:client,
            marka,
          });
          console.log("Delete API response:=====", deleteRes);
        } catch (deleteError) {
          console.error("Delete API failed:", deleteError);
          throw deleteError;
        }
      }

      try {
        
        const submitRes = await axios.post(`${API}api/packing/packing-details/`, parsedForm);
         console.log(submitRes)
      } catch (submitError) {
        console.error("Packing details API failed:", submitError.message);
        throw submitError;
      }

    } catch (err) {
      console.error("Detailed error data:", JSON.stringify(err.response?.data, null, 2));
      console.error("Submit packing error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
        config: err.config,
      });
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);






const packingSlice = createSlice({
  name: 'packing',
  initialState: {
    nextCaseNumber: 1,
    PackingType: null,
    packing: [],
    stock: [],
    estimateList: [],
    loading: false,
    error: null,
  },
  reducers: {
    setNextCaseNumber: (state, action) => {
      state.nextCaseNumber = action.payload;
      console.log('action.payload',action.payload)
    },
    resetNextCaseNumberToOne: (state) => {
      state.nextCaseNumber = 1;
    },
    setPackingType: (state, action) => {
      state.PackingType = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPackingData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPackingData.fulfilled, (state, action) => {
        state.loading = false;
        state.packing = action.payload.packing;
        state.stock = action.payload.stock;
        state.estimateList = action.payload.estimateList;
      })
      .addCase(fetchPackingData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(submitPackingDetails.fulfilled, (state, action) => {
        state.nextCaseNumber = action.payload;
      });
  },
});

export const { setNextCaseNumber, resetNextCaseNumberToOne, setPackingType, } = packingSlice.actions;
export default packingSlice.reducer;
