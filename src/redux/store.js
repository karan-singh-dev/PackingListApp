// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import packingReducer from './slices/PackigListSlice';
import loginReducer from './slices/LoginSlice'
import clientDataReducer from './slices/ClientDataSlice'

const store = configureStore({
  reducer: {
    packing: packingReducer,
    clientData: clientDataReducer,
    login: loginReducer,
  },
});

export default store;
