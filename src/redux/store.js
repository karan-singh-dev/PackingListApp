// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import packingReducer from './slices/PackigListSlice';
import loginReducer from './slices/LoginSlice'
import clientDataReducer from './slices/ClientDataSlice'
import  mrpDataReducer  from './slices/MrpDataSlice';
import userReducer from './slices/UserSlice';

const store = configureStore({
  reducer: {
    packing: packingReducer,
    clientData: clientDataReducer,
    login: loginReducer,
    parts:mrpDataReducer,
    userInfo:userReducer,
  },
});

export default store;
