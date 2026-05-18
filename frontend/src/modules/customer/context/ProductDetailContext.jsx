import React, { createContext, useContext, useState, useEffect } from 'react';

const ProductDetailContext = createContext();

export const useProductDetail = () => {
    const context = useContext(ProductDetailContext);
    if (!context) {
        return {};
    }
    return context;
};

export const ProductDetailProvider = ({ children }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    const openProduct = (product) => {
        setSelectedProduct(product);
        setIsOpen(true);
        // Push a new state so back button can close the modal
        window.history.pushState({ modalOpen: true }, '');
    };

    const closeProduct = (fromPopState = false) => {
        setIsOpen(false);
        setTimeout(() => setSelectedProduct(null), 300);
        
        // If closed via UI (not back button), we need to remove the pushed state
        if (!fromPopState && window.history.state?.modalOpen) {
            window.history.back();
        }
    };

    useEffect(() => {
        const handlePopState = (event) => {
            // Close modal if back button is pressed and modal is open
            if (isOpen) {
                closeProduct(true);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOpen]);

    return (
        <ProductDetailContext.Provider value={{ selectedProduct, isOpen, openProduct, closeProduct }}>
            {children}
        </ProductDetailContext.Provider>
    );
};
