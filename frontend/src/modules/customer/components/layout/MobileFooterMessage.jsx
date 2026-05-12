import React from 'react';
import { useSettings } from '@core/context/SettingsContext';
import { motion } from 'framer-motion';

const MobileFooterMessage = () => {
    const { settings } = useSettings();
    const appName = settings?.appName || 'Zeppe';
    return (
        <div className="md:hidden w-full flex flex-col items-center -mt-8 pt-0 pb-28 px-6 bg-transparent">
            <div className="w-full flex flex-col">
                <h2 className="text-[38px] leading-[1.1] font-black text-slate-300 tracking-tight text-left">
                    India's fastest<br />app <motion.span 
                        className="inline-block text-red-500"
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{ 
                            duration: 0.8, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                    >❤️</motion.span>
                </h2>

                <div className="w-full h-[1px] bg-slate-200 mt-6 mb-4"></div>

                <div className="text-slate-300 font-black text-2xl tracking-tighter text-left">
                    Zeppe
                </div>
            </div>
        </div>
    );
};

export default MobileFooterMessage;
