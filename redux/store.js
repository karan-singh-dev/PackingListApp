// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import packingReducer from './PackigListSlice';
import loginReducer from './LoginSlice'
import clientDataReducer from './ClientDataSlice'

const store = configureStore({
  reducer: {
    packing: packingReducer,
    clientData: clientDataReducer,
    login: loginReducer,
  },
});

export default store;
