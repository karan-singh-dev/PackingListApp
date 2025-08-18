import React, { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import store from "./src/redux/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { setLogoutHandler } from "./src/components/AuthService";
import { logOutUser } from "./src/redux/slices/LoginSlice";

function Root() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Inject Redux logout into AuthService
    setLogoutHandler(() => dispatch(logOutUser()));
  }, [dispatch]);

  return <AppNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <Root />
    </Provider>
  );
}
