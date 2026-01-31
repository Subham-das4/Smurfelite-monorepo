import { persistReducer } from 'redux-persist';
import { encryptTransform } from 'redux-persist-transform-encrypt';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import Slices
import userReducer from './user/slice';
import { authReducer } from './auth/slice';
import { baseApi } from '@/api';

// Encryption configuration
const encryptor = encryptTransform({
    secretKey: "bxvbbxbxbxbxbxvbxbxvb",
    onError: function (error: unknown) {
        console.error('Encryption Error:', error);
    },
});

const persistConfig = {
    key: 'root',
    storage,
    transforms: [encryptor],
    whitelist: ['user', 'theme', 'auth'],
};

const rootReducers = combineReducers({
    user: userReducer,
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
});

type RootState = ReturnType<typeof rootReducers>;

const persistedRootReducer = persistReducer<RootState>(
    persistConfig,
    rootReducers
);

export default persistedRootReducer;

export * from './auth/slice';
export * from './user/slice';