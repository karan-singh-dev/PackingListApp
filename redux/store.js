// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import productReducer from './productSlice';
import packingReducer from './PackigListSlice';
import clientDataReducer from './ClientDataSlice'

const store = configureStore({
  reducer: {
    products: productReducer,
    packing:packingReducer,
    clientData: clientDataReducer,
  },
});

export default store;
