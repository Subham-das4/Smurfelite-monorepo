import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { RouterProvider } from "@tanstack/react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import { store, persistor } from "@/store/store";
import { router } from "@/router";
import "@/api";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          <RouterProvider router={router} />
          <ToastContainer position="top-right" autoClose={4000} />
        </PersistGate>
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>
);
