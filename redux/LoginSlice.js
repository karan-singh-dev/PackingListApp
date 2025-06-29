import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API } from '@env';


export const loginUser = createAsyncThunk(
    'login/loginUser',
    async ({ email, password }, thunkAPI) => {
        try {
            const response = await axios.post('https://your-api.com/api/login', {
                email,
                password,
            }, {
                headers: { 'Content-Type': 'application/json' },
            });

            return response.data.Token;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                'Login failed';
            return thunkAPI.rejectWithValue(message);
        }
    }
);


const loginSlice = createSlice({
    name: 'login',
    initialState: {
        Token: null,
        loading: false,
        error: null,
    },
    reducers: {
        setToken: (state, action) => {
            state.Token = action.payload;
        },

        logout(state) {
            state.Token = null;
            state.error = null;
        },

    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.Token = action.payload;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { logout, setToken } = loginSlice.actions;
export default loginSlice.reducer;
