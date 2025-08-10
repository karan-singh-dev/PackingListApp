// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import packingReducer from './slices/PackigListSlice';
import loginReducer from './slices/LoginSlice'
import clientDataReducer from './slices/ClientDataSlice'
import  mrpDataReducer  from './slices/MrpDataSlice';

const store = configureStore({
  reducer: {
    packing: packingReducer,
    clientData: clientDataReducer,
    login: loginReducer,
    parts:mrpDataReducer,
  },
});

export default store;
