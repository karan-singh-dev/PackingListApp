// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import productReducer from './productSlice';
import packingReducer from './PackigListSlice';
import loginReducer from './LoginSlice'
import clientDataReducer from './ClientDataSlice'

const store = configureStore({
  reducer: {
    products: productReducer,
    packing: packingReducer,
    clientData: clientDataReducer,
    login: loginReducer,
  },
});

export default store;
