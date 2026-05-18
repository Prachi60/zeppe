import React from 'react';
import { X, Printer, Download, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@core/context/SettingsContext';

const InvoiceModal = ({ isOpen, onClose, order }) => {
    const { settings } = useSettings();
    const appName = settings?.appName || 'App';
    const primaryColor = '#f59931';
    if (!order) return null;

    const donationVal = (Number(localStorage.getItem(`donation_${order?.orderId || order?.id || 'latest'}`)) || Number(localStorage.getItem('latest_donation_amount')) || order.donationAmount || 0);
    const tipVal = order.pricing?.tip || order.tipAmount || 0;
    const handlingVal = order.pricing?.handlingFee || order.pricing?.platformFee || order.platformFee || order.handlingFee || 0;
    const taxVal = order.pricing?.tax || order.pricing?.taxTotal || order.bill?.tax || 0;
    const deliveryVal = order.pricing?.deliveryFee || order.bill?.deliveryFee || 0;

    const handlePrint = () => {
        const printContent = document.getElementById('printable-invoice');
        if (!printContent) return;

        // Create a hidden iframe
        let iframe = document.getElementById('print-iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'print-iframe';
            iframe.style.position = 'absolute';
            iframe.style.top = '-9999px';
            iframe.style.left = '-9999px';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            document.body.appendChild(iframe);
        }

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <html>
                <head>
                    <title>${appName} - Invoice #${order.orderId || order.id}</title>
                    <style>
                        body { 
                            font-family: 'Inter', system-ui, sans-serif; 
                            padding: 40px; 
                            color: #1e293b;
                            line-height: 1.5;
                        }
                        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
                        .brand { color: ${primaryColor}; font-size: 28px; font-weight: 900; margin: 0; }
                        .address { font-size: 12px; color: #64748b; margin-top: 4px; }
                        .bill-to { text-align: right; }
                        .bill-to-title { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
                        .bill-to-details { font-size: 12px; color: #64748b; }
                        
                        table { width: 100%; border-collapse: collapse; margin: 30px 0; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden; }
                        th { background: #f8fafc; color: #64748b; font-weight: 700; text-align: left; padding: 12px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
                        td { padding: 12px 16px; border-top: 1px solid #f1f5f9; font-size: 14px; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: 700; }
                        
                        .totals { margin-top: 20px; border-top: 2px solid #f1f5f9; padding-top: 20px; }
                        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #64748b; }
                        .grand-total { border-top: 1px solid #f1f5f9; margin-top: 12px; padding-top: 12px; font-weight: 900; color: #0f172a; font-size: 18px; }
                        
                        @media print {
                            body { padding: 0; }
                            @page { margin: 10mm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1 class="brand">${appName}</h1>
                            <div class="address">${settings?.companyName || 'Quick Commerce'}<br />${settings?.address || '—'}</div>
                        </div>
                        <div class="bill-to">
                            <div class="bill-to-title">Bill To:</div>
                            <div class="bill-to-details">${order.customer?.name || order.address?.name || 'Customer'}<br />${order.customer?.phone || order.address?.phone || ''}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th class="text-right">Qty</th>
                                <th class="text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td class="text-right">${item.quantity || item.qty}</td>
                                    <td class="text-right font-bold">₹${item.price}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="totals">
                        <div class="total-row">
                            <span>Subtotal</span>
                            <span>₹${order.pricing?.subtotal || order.bill?.itemTotal || 0}</span>
                        </div>
                        <div class="total-row">
                            <span>Tax</span>
                            <span>₹${taxVal}</span>
                        </div>
                        ${deliveryVal > 0 ? `
                            <div class="total-row">
                                <span>Delivery Fee</span>
                                <span>₹${deliveryVal}</span>
                            </div>
                        ` : ''}
                        ${handlingVal > 0 ? `
                            <div class="total-row">
                                <span>Platform Fee</span>
                                <span>₹${handlingVal}</span>
                            </div>
                        ` : ''}
                        ${tipVal > 0 ? `
                            <div class="total-row">
                                <span>Tip</span>
                                <span>₹${tipVal}</span>
                            </div>
                        ` : ''}
                        ${donationVal > 0 ? `
                            <div class="total-row">
                                <span>Donation</span>
                                <span>₹${donationVal}</span>
                            </div>
                        ` : ''}
                        <div class="total-row grand-total">
                            <span>Total Paid</span>
                            <span>₹${(order.pricing?.total || order.bill?.grandTotal || 0) + 
                                (donationVal > 0 && !order.pricing?.total?.toString().includes(donationVal.toString()) ? donationVal : 0)}</span>
                        </div>
                    </div>
                </body>
            </html>
        `);
        iframeDoc.close();

        // Trigger print after a short delay
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }, 300);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                         <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                            onClick={(e) => e.stopPropagation()}
                            id="invoice-modal-root"
                            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative"
                        >
                            {/* Header */}
                             <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between no-print">
                                <div>
                                    <h2 className="text-lg font-black text-slate-800">Invoice</h2>
                                    <p className="text-xs text-slate-500 font-medium">#{order.orderId || order.id}</p>
                                </div>
                                <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-slate-200 transition-colors shadow-sm border border-slate-100">
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>

                            {/* Printable Area */}
                            <div className="p-8 space-y-6" id="printable-invoice">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="text-2xl font-black tracking-tight" style={{ color: primaryColor }}>{appName}</h1>
                                        <p className="text-xs text-slate-500 mt-1">{settings?.companyName || 'Quick Commerce'}<br />{settings?.address || '—'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-800">Bill To:</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {order.customer?.name || order.address?.name || 'Customer'}<br />
                                            {order.customer?.phone || order.address?.phone}
                                        </p>
                                    </div>
                                </div>

                                <div className="border rounded-xl overflow-hidden border-slate-100">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                            <tr>
                                                <th className="px-4 py-3">Item</th>
                                                <th className="px-4 py-3 text-right">Qty</th>
                                                <th className="px-4 py-3 text-right">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {order.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3 text-slate-700 font-medium">{item.name}</td>
                                                    <td className="px-4 py-3 text-slate-500 text-right">{item.quantity || item.qty}</td>
                                                    <td className="px-4 py-3 text-slate-800 font-bold text-right">₹{item.price}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Subtotal</span>
                                        <span>₹{order.pricing?.subtotal || order.bill?.itemTotal || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Tax</span>
                                        <span>₹{taxVal}</span>
                                    </div>
                                    {deliveryVal > 0 && (
                                        <div className="flex justify-between text-sm text-slate-500">
                                            <span>Delivery Fee</span>
                                            <span>₹{deliveryVal}</span>
                                        </div>
                                    )}
                                    {handlingVal > 0 && (
                                        <div className="flex justify-between text-sm text-slate-500">
                                            <span>Platform Fee</span>
                                            <span>₹{handlingVal}</span>
                                        </div>
                                    )}
                                    {tipVal > 0 && (
                                        <div className="flex justify-between text-sm text-slate-500">
                                            <span>Tip</span>
                                            <span>₹{tipVal}</span>
                                        </div>
                                    )}
                                    {donationVal > 0 && (
                                        <div className="flex justify-between text-sm text-slate-500">
                                            <span>Donation</span>
                                            <span>₹{donationVal}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base font-black text-slate-800 pt-2 border-t border-slate-100">
                                        <span>Total Paid</span>
                                        <span>
                                            ₹{(order.pricing?.total || order.bill?.grandTotal || 0) + 
                                              (donationVal > 0 && !order.pricing?.total?.toString().includes(donationVal.toString()) ? donationVal : 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                             {/* Footer Actions */}
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 no-print">
                                <button onClick={() => handlePrint('Print')} className="flex-1 py-3 text-black rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-100" style={{ backgroundColor: primaryColor }}>
                                    <Printer size={18} /> Print
                                </button>
                                <button onClick={() => handlePrint('PDF')} className="flex-1 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                                    <Download size={18} /> Save PDF
                                </button>
                            </div>


                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default InvoiceModal;

