import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { encryptTransform } from "redux-persist-transform-encrypt";
import { authReducer } from "./authSlice";
import { userReducer } from "./userSlice";
import { baseApi } from "@/api/baseApi";

const encryptor = encryptTransform({
  secretKey:
    import.meta.env.VITE_PERSIST_SECRET ?? "smurfelite-portal-dev-secret",
  onError: (error) => console.error("Persist encryption error", error),
});

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

const persistedReducer = persistReducer(
  {
    key: "seller-root",
    storage,
    whitelist: ["auth", "user"],
    transforms: [encryptor],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rootReducer as any
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
