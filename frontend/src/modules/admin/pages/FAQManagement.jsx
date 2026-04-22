import React, { useState } from 'react';
import { z } from 'zod';
import PageHeader from '@shared/components/ui/PageHeader';
import Card from '@shared/components/ui/Card';
import Badge from '@shared/components/ui/Badge';
import Modal from '@shared/components/ui/Modal';
import DynamicDataTable from '@shared/components/ui/DynamicDataTable';
import DynamicForm from '@shared/components/ui/DynamicForm';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineEye, HiOutlineEyeSlash, HiOutlineQuestionMarkCircle } from 'react-icons/hi2';
import { adminApi } from '../services/adminApi';
import { toast } from 'sonner';

const faqSchema = z.object({
    question: z.string().min(10, 'Question must be at least 10 characters'),
    answer: z.string().min(20, 'Answer must be at least 20 characters'),
    category: z.string().min(1, 'Category is required'),
    status: z.enum(['active', 'inactive', 'published', 'draft']).default('published')
});

const FAQManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const columns = [
        {
            header: "Question",
            width: "40%",
            cell: (row) => (
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400 mt-1">
                        <HiOutlineQuestionMarkCircle className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-[13px] leading-tight">{row.question}</p>
                        <p className="text-[11px] text-slate-400 mt-1 font-medium italic truncate max-w-xs">{row.answer}</p>
                    </div>
                </div>
            )
        },
        {
            header: "Category",
            accessor: "category",
            width: "15%",
            cell: (row) => (
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {row.category}
                </span>
            )
        },
        {
            header: "Status",
            width: "15%",
            align: "center",
            cell: (row) => (
                <Badge variant={row.status === 'published' || row.status === 'active' ? 'success' : 'gray'} className="text-[10px] font-bold uppercase">
                    {row.status}
                </Badge>
            )
        },
        {
            header: "Views",
            accessor: "views",
            width: "10%",
            align: "center",
            cell: (row) => <span className="font-mono text-[12px] font-bold text-slate-500">{(row.views || 0).toLocaleString()}</span>
        },
        {
            header: "Actions",
            width: "20%",
            align: "right",
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => handleToggleStatus(row)}
                        className="p-2 hover:bg-slate-100 text-slate-400 hover:text-sky-600 rounded-xl transition-all"
                    >
                        {row.status === 'published' ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
                    </button>
                    <button 
                        onClick={() => { setEditingItem(row); setIsModalOpen(true); }}
                        className="p-2 hover:bg-slate-100 text-slate-400 hover:text-brand-600 rounded-xl transition-all"
                    >
                        <HiOutlinePencilSquare className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={() => handleDelete(row._id)}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                    >
                        <HiOutlineTrash className="h-4 w-4" />
                    </button>
                </div>
            )
        }
    ];

    const fields = [
        { name: 'question', label: 'Question', placeholder: 'What are the delivery charges?', required: true, fullWidth: true },
        { name: 'answer', label: 'Detailed Answer', placeholder: 'Type the answer here...', type: 'textarea', required: true, fullWidth: true },
        { 
            name: 'category', 
            label: 'Category', 
            type: 'select', 
            required: true,
            options: [
                { label: 'Customer', value: 'Customer' },
                { label: 'Seller', value: 'Seller' },
                { label: 'Delivery', value: 'Delivery' },
                { label: 'Orders', value: 'Orders' }
            ] 
        },
        { 
            name: 'status', 
            label: 'Initial Status', 
            type: 'select', 
            required: true,
            options: [
                { label: 'Published', value: 'published' },
                { label: 'Draft', value: 'draft' }
            ] 
        }
    ];

    const handleSave = async (data, reset) => {
        setIsSaving(true);
        try {
            if (editingItem) {
                await adminApi.updateFAQ(editingItem._id, data);
                toast.success('FAQ updated successfully');
            } else {
                await adminApi.createFAQ(data);
                toast.success('FAQ created successfully');
            }
            setIsModalOpen(false);
            setEditingItem(null);
            setRefreshTrigger(p => p + 1);
        } catch (error) {
            toast.error('Failed to save FAQ');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this FAQ?')) return;
        try {
            await adminApi.deleteFAQ(id);
            toast.success('FAQ removed');
            setRefreshTrigger(p => p + 1);
        } catch (error) {
            toast.error('Deletion failed');
        }
    };

    const handleToggleStatus = async (faq) => {
        try {
            const newStatus = faq.status === 'published' ? 'draft' : 'published';
            await adminApi.updateFAQ(faq._id, { status: newStatus });
            toast.success(`Visibility updated to ${newStatus}`);
            setRefreshTrigger(p => p + 1);
        } catch (error) {
            toast.error('Status update failed');
        }
    };

    return (
        <div className="ds-section-spacing animate-in fade-in slide-in-from-bottom-2 duration-700">
            <PageHeader
                title="FAQ Management"
                description="Easily manage customer and seller assistance content through this dynamic interface."
                action={
                    <button 
                        onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                        className="ds-button-primary"
                    >
                        <HiOutlinePlus className="mr-2 h-4 w-4" />
                        ADD FAQ
                    </button>
                }
            />

            <DynamicDataTable
                endpoint="/admin/faqs"
                columns={columns}
                refreshSelected={refreshTrigger}
                searchPlaceholder="Search questions or answers..."
                filters={[
                    { 
                        key: 'category', 
                        label: 'All Categories', 
                        options: [
                            { label: 'Customer', value: 'Customer' },
                            { label: 'Seller', value: 'Seller' },
                            { label: 'Delivery', value: 'Delivery' }
                        ] 
                    }
                ]}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? "Edit FAQ" : "Create New FAQ"}
            >
                <DynamicForm
                    schema={faqSchema}
                    fields={fields}
                    defaultValues={editingItem || { category: 'Customer', status: 'published' }}
                    onSubmit={handleSave}
                    submitLabel={editingItem ? "Update FAQ" : "Create FAQ"}
                    isLoading={isSaving}
                />
            </Modal>
        </div>
    );
};

export default FAQManagement;
