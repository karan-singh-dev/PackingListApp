import { createSlice } from '@reduxjs/toolkit';

const userInfoSlice = createSlice({
  name: 'userInfo',
  initialState: {
    user: null,   // Store logged-in user object (from /api/user/users/me/)
  },
  reducers: {
    setUserInfo: (state, action) => {
      state.user = action.payload; // Save user data
    },
    clearUserInfo: (state) => {
      state.user = null; // Clear when logging out
    },
  },
});

export const { setUserInfo, clearUserInfo } = userInfoSlice.actions;
export default userInfoSlice.reducer;