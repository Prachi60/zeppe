import React, { createContext, useContext } from 'react';

const defaultSellerOrdersContextValue = {
  orders: [],
  ordersLoading: false,
  refreshOrders: () => {},
};

export const SellerOrdersContext = createContext(defaultSellerOrdersContextValue);

export const SellerOrdersProvider = ({ children, value = defaultSellerOrdersContextValue }) => (
  <SellerOrdersContext.Provider value={value}>
    {children}
  </SellerOrdersContext.Provider>
);

export const useSellerOrders = () => useContext(SellerOrdersContext);
