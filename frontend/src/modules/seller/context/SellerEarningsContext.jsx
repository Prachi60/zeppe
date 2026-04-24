import React, { createContext, useContext } from 'react';

const defaultEarnings = {
  balances: {},
  ledger: [],
  monthlyChart: [],
};

const defaultSellerEarningsContextValue = {
  earningsData: defaultEarnings,
  earningsLoading: false,
  refreshEarnings: () => {},
};

export const SellerEarningsContext = createContext(defaultSellerEarningsContextValue);

export const SellerEarningsProvider = ({ children, value = defaultSellerEarningsContextValue }) => (
  <SellerEarningsContext.Provider value={value}>
    {children}
  </SellerEarningsContext.Provider>
);

export const useSellerEarnings = () => useContext(SellerEarningsContext);
export { defaultEarnings };
