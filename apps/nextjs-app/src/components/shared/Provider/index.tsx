"use client";

import { persistor, store } from '@/store';
import React from 'react'
import { Bounce, ToastContainer } from 'react-toastify';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';

export const GlobalProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <ToastContainer
                    stacked
                    position="bottom-right"
                    newestOnTop={false}
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored"
                    transition={Bounce}
                    closeButton={({ closeToast }) => (
                        <button
                            title=""
                            aria-label="close"
                            onClick={(e) => closeToast?.(e)}
                            className="bg-white p-1! border! border-solid! border-grey-15! absolute top-2 right-2 w-5.5 h-5.5 max-w-5.5 max-h-5.5 rounded-sm!"
                        >
                            {/* <Icon icon="close" color={COLORS.black} /> */}
                        </button>
                    )}
                />
                {children}
            </PersistGate>
        </Provider>
    )
}
