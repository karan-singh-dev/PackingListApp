import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../components/API'; // centralized API instance

const ENDPOINTS = {
  STOCK: '/api/packing/stock/',
  ESTIMATE: '/api/asstimate/',
  PACKING: '/api/packing/packing/',
  DELETE: '/api/packing/packing/delete-by-partno/',
  DETAILS: '/api/packing/packing-details/',
};

// Async thunk to fetch all required packing data
export const fetchPackingData = createAsyncThunk(
  'packing/fetchPackingData',
  async ({ client, marka }, { rejectWithValue }) => {
    try {
      if (!API) throw new Error('API instance is not configured.');

      const [stockRes, estimateRes, packingRes] = await Promise.all([
        API.get(ENDPOINTS.STOCK),
        API.get(`${ENDPOINTS.ESTIMATE}?client_name=${client}&marka=${marka}`),
        API.get(ENDPOINTS.PACKING, {params: { client, marka }})
      ]);
// console.log(estimateRes.data, 'estimateRes');
      return {
        packing: packingRes.data,
        stock: stockRes.data,
        estimateList: estimateRes.data,
      };
    } catch (error) {
      console.error('Fetch packing data failed:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk to submit form data
export const submitPackingDetails = createAsyncThunk(
  'packing/submitPackingDetails',
  async ({ form, passedData, client, marka }, { rejectWithValue }) => {
    console.log(passedData,'passdata');
    
    try {
      if (!API) throw new Error('API instance is not configured.');

      const parsedForm = {
        ...form,
        client, // ID or UUID
        marka,

        part_no: form.part_no || '',
        description: form.description || '',
        hsn_no: form.hsn_no || '',
        brand_name: form.brand_name || '',

        total_packing_qty: Number(form.total_packing_qty) || 0,
        packed_in_plastic_bag: Number(form.packed_in_plastic_bag) || 0,
        case_no_start: Number(form.case_no_start) || 0,
        case_no_end: Number(form.case_no_end) || 0,
        total_case: Number(form.total_case) || 0,
        length: Number(form.length) || 0,
        width: Number(form.width) || 0,
        height: Number(form.height) || 0,
        gst: parseFloat(form.gst) || 0,

        mrp_invoice: Number(form.mrp_invoice) || 0,
        mrp_box: Number(form.box_mrp) || 0,
        total_mrp: (Number(form.box_mrp) || 0) * (Number(form.total_packing_qty) || 0),
        npr: Number(form.npr) || 0,
        nsr: Number(form.nsr) || 0,
        net_wt: Number(form.net_wt) || 0,
        gross_wt: Number(form.gross_wt) || 0,
        total_net_wt: Number(form.total_net_wt) || 0,
        total_gross_wt: Number(form.total_gross_wt) || 0,
        cbm: Number(form.cbm) || 0,
      };

      if (passedData) {
        try {
          const deleteRes = await API.post(ENDPOINTS.DELETE, {
            part_no: parsedForm.part_no,
            qty: parsedForm.total_packing_qty,
            client,
            marka,
          });
          console.log('Delete API success:', deleteRes.status);
        } catch (deleteError) {
          console.error('Delete API failed:', deleteError);
          throw deleteError; // block submission if delete fails
        }
      }

      const submitRes = await API.post(ENDPOINTS.DETAILS, parsedForm);
      console.log('Packing details submitted successfully:', submitRes.status);

      return submitRes.data; // returning API response data
    } catch (err) {
      console.error('Detailed error data:', JSON.stringify(err.response?.data, null, 2));
      console.error('Submit packing error:', {
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
    },
    resetNextCaseNumberToOne: (state) => {
      state.nextCaseNumber = 1;
    },
    setPackingType: (state, action) => {
      state.PackingType = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPackingData
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
        state.error = action.payload || action.error.message;
      })
      // submitPackingDetails
      .addCase(submitPackingDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitPackingDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.nextCaseNumber = action.payload; // or update as needed based on response
      })
      .addCase(submitPackingDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setNextCaseNumber, resetNextCaseNumberToOne, setPackingType } = packingSlice.actions;
export default packingSlice.reducer;
