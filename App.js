
import React from 'react';
import { Provider } from 'react-redux';
import store from './redux/store';
import AppNavigator from './AppNavigator'; // or wherever your navigation is

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}