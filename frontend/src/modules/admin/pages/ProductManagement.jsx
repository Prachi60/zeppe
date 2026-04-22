import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import PageHeader from '@shared/components/ui/PageHeader';
import Card from '@shared/components/ui/Card';
import Badge from '@shared/components/ui/Badge';
import Modal from '@shared/components/ui/Modal';
import DynamicDataTable from '@shared/components/ui/DynamicDataTable';
import DynamicForm from '@shared/components/ui/DynamicForm';
import { adminApi } from '../services/adminApi';
import { toast } from 'sonner';
import { 
    HiOutlineCube, 
    HiOutlinePlus, 
    HiOutlinePencilSquare, 
    HiOutlineTrash, 
    HiOutlineSwatch, 
    HiOutlineArchiveBox, 
    HiOutlineCheckCircle, 
    HiOutlineExclamationCircle 
} from 'react-icons/hi2';

const productSchema = z.object({
    name: z.string().min(3, 'Name is too short'),
    price: z.preprocess((a) => parseFloat(a), z.number().min(0)),
    stock: z.preprocess((a) => parseInt(a), z.number().min(0)),
    status: z.enum(['active', 'inactive']),
    categoryId: z.string().min(1, 'Category is required'),
    description: z.string().optional()
});

const ProductManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        adminApi.getCategoryTree().then(res => {
            if (res.data.success) {
                const flatCategories = [];
                // Flattening just for the select options
                (res.data.results || []).forEach(h => {
                    h.children?.forEach(c => {
                        flatCategories.push({ label: `${h.name} > ${c.name}`, value: c._id });
                    });
                });
                setCategories(flatCategories);
            }
        });
    }, []);

    const columns = [
        {
            header: "Product",
            width: "30%",
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 shadow-sm">
                        <img src={row.mainImage || row.images?.[0]} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-slate-900">{row.name}</p>
                        <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{row.unit || 'Unit'}</p>
                    </div>
                </div>
            )
        },
        {
            header: "Seller",
            width: "15%",
            cell: (row) => (
                <span className="text-[12px] font-bold text-slate-600 truncate block">
                    {row.sellerId?.shopName || 'Admin'}
                </span>
            )
        },
        {
            header: "Category",
            width: "15%",
            cell: (row) => (
                <span className="px-2 py-1 bg-slate-100 rounded-lg text-[11px] font-bold text-slate-600 truncate block">
                    {row.categoryId?.name || 'N/A'}
                </span>
            )
        },
        {
            header: "Inventory",
            width: "12%",
            align: "center",
            cell: (row) => (
                <div className="flex flex-col items-center">
                    <span className={cn(
                        "font-mono font-bold text-[13px]",
                        row.stock === 0 ? "text-rose-600" : row.stock < 10 ? "text-amber-600" : "text-slate-700"
                    )}>
                        {row.stock}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400">Items Left</span>
                </div>
            )
        },
        {
            header: "Price",
            width: "10%",
            cell: (row) => <span className="font-bold text-brand-600 text-[13px]">₹{row.price}</span>
        },
        {
            header: "Status",
            width: "10%",
            align: "center",
            cell: (row) => (
                <Badge variant={row.status === 'active' ? 'success' : 'gray'} className="text-[9px] font-black uppercase">
                    {row.status}
                </Badge>
            )
        },
        {
            header: "Actions",
            width: "12%",
            align: "right",
            cell: (row) => (
                <div className="flex justify-end gap-1.5">
                    <button 
                        onClick={() => { setEditingItem(row); setIsModalOpen(true); }}
                        className="p-2 hover:bg-slate-100 text-slate-400 hover:text-brand-600 rounded-xl transition-all shadow-sm ring-1 ring-slate-100"
                    >
                        <HiOutlinePencilSquare className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={() => handleDelete(row._id)}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm ring-1 ring-slate-100"
                    >
                        <HiOutlineTrash className="h-4 w-4" />
                    </button>
                </div>
            )
        }
    ];

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product permanently?')) return;
        try {
            await adminApi.deleteProduct(id);
            toast.success('Product deleted successfully');
            setRefreshTrigger(p => p + 1);
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    return (
        <div className="ds-section-spacing animate-in fade-in slide-in-from-bottom-2 duration-700 pb-12">
            <PageHeader
                title="Product Catalog"
                description="Monitor inventory levels, update pricing, and manage listing statuses across the platform."
                action={
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-5 py-3 bg-white ring-1 ring-slate-200 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm">
                            <HiOutlineSwatch className="h-4 w-4 text-indigo-500" />
                            VARIANTS
                        </button>
                        <button className="ds-button-primary">
                            <HiOutlinePlus className="mr-2 h-4 w-4" />
                            ADD NEW
                        </button>
                    </div>
                }
            />

            {/* Top Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Items', val: '1,240', icon: HiOutlineCube, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Active Listings', val: '1,192', icon: HiOutlineCheckCircle, color: 'text-brand-600', bg: 'bg-brand-50' },
                    { label: 'Low Stock', val: '18', icon: HiOutlineExclamationCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Out of Stock', val: '4', icon: HiOutlineArchiveBox, color: 'text-rose-600', bg: 'bg-rose-50' }
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm ring-1 ring-slate-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <h4 className="text-lg font-black text-slate-900 leading-none">{stat.val}</h4>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <DynamicDataTable
                endpoint="/products"
                columns={columns}
                refreshSelected={refreshTrigger}
                searchPlaceholder="Search products by name, SKU or brand..."
                filters={[
                    { key: 'status', label: 'All Status', options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }] }
                ]}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? "Quick Update Product" : "New Listing (Full form coming soon)"}
                size="xl"
            >
                <DynamicForm
                    schema={productSchema}
                    fields={[
                        { section: 'Basic Info', name: 'name', label: 'Product Title', fullWidth: true, required: true },
                        { section: 'Basic Info', name: 'categoryId', label: 'Category', type: 'select', options: categories, required: true },
                        { section: 'Basic Info', name: 'status', label: 'Listing Status', type: 'select', options: [{label: 'Active', value: 'active'}, {label: 'Inactive', value: 'inactive'}], required: true },
                        { section: 'Inventory & Pricing', name: 'price', label: 'Sale Price (₹)', type: 'number', required: true },
                        { section: 'Inventory & Pricing', name: 'stock', label: 'Stock Quantity', type: 'number', required: true },
                        { section: 'Details', name: 'description', label: 'Description', type: 'textarea', fullWidth: true }
                    ]}
                    defaultValues={editingItem}
                    onSubmit={async (data) => {
                        try {
                            await adminApi.updateProduct(editingItem._id, data);
                            toast.success('Product updated');
                            setIsModalOpen(false);
                            setRefreshTrigger(p => p + 1);
                        } catch (e) {
                            toast.error('Update failed');
                        }
                    }}
                    submitLabel="Update Product"
                />
            </Modal>
        </div>
    );
};

// Helper for class merger
const cn = (...classes) => classes.filter(Boolean).join(' ');

export default ProductManagement;
