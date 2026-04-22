import React from 'react';
import PageHeader from '@shared/components/ui/PageHeader';
import Badge from '@shared/components/ui/Badge';
import DynamicDataTable from '@shared/components/ui/DynamicDataTable';
import { HiOutlineUserAdd, HiOutlineEye } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
    const navigate = useNavigate();

    const columns = [
        {
            header: "User",
            width: "35%",
            cell: (row) => (
                <div className="flex items-center">
                    <img 
                        src={row.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                        alt="" 
                        className="h-10 w-10 rounded-xl bg-slate-50 ring-1 ring-slate-100 object-cover mr-3 shadow-sm" 
                    />
                    <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-[13px] truncate">{row.name}</p>
                        <p className="text-[11px] text-slate-500 truncate font-medium">{row.email || row.phone}</p>
                    </div>
                </div>
            )
        },
        {
            header: "Orders",
            accessor: "totalOrders",
            width: "15%",
            align: "center",
            cell: (row) => (
                <span className="font-bold text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded-lg">
                    {row.totalOrders || 0}
                </span>
            )
        },
        {
            header: "Spent",
            width: "15%",
            cell: (row) => (
                <span className="font-bold text-brand-600 text-xs">
                    ₹{(row.totalSpent || 0).toLocaleString()}
                </span>
            )
        },
        {
            header: "Status",
            width: "15%",
            align: "center",
            cell: (row) => (
                <Badge variant={row.status === 'active' ? 'success' : 'gray'} className="text-[10px] uppercase tracking-wider font-bold">
                    {row.status}
                </Badge>
            )
        },
        {
            header: "Actions",
            width: "20%",
            align: "right",
            cell: (row) => (
                <button 
                    onClick={() => navigate(`/admin/customers/${row._id || row.id}`)}
                    className="p-2 hover:bg-slate-100 text-slate-400 hover:text-primary transition-all rounded-xl ring-1 ring-slate-100 shadow-sm"
                >
                    <HiOutlineEye className="h-4 w-4" />
                </button>
            )
        }
    ];

    return (
        <div className="ds-section-spacing animate-in fade-in slide-in-from-bottom-2 duration-700">
            <PageHeader
                title="Customer Management"
                description="Manage all registered customers on the platform, view their order history and spending patterns."
                action={
                    <button className="ds-button-primary">
                        <HiOutlineUserAdd className="mr-2 h-4 w-4" />
                        Add New Customer
                    </button>
                }
            />

            <DynamicDataTable
                endpoint="/admin/users"
                columns={columns}
                searchPlaceholder="Search by name, email or phone..."
            />
        </div>
    );
};

export default UserManagement;
