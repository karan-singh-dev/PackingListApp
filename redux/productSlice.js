// redux/productSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  productList: [],estimatedList: [],
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    addestimatedList: (state, action) => {
      state.estimatedList.push(action.payload);
    },
    addProduct: (state, action) => {
      state.productList.push(action.payload);
    },
    updateProduct: (state, action) => {
      const { index, updatedProduct } = action.payload;
      state.productList[index] = updatedProduct;
    },
    deleteProduct: (state, action) => {
      state.productList.splice(action.payload, 1);
    },
    setProducts: (state, action) => {
      state.productList = action.payload;
    },
  },
});

export const { addProduct, updateProduct, deleteProduct, setProducts,addestimatedList } = productSlice.actions;
export default productSlice.reducer;
