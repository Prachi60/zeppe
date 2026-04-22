import React from 'react';
import PageHeader from '@shared/components/ui/PageHeader';
import DynamicDataTable from '@shared/components/ui/DynamicDataTable';
import { Users, Eye, Phone, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '@shared/components/ui/Badge';

const CustomerManagement = () => {
    const navigate = useNavigate();

    const columns = [
        {
            header: "Customer",
            width: "35%",
            cell: (row) => (
                <div className="flex items-center gap-4">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        alt=""
                        className="h-10 w-10 rounded-xl bg-slate-100 ring-2 ring-white shadow-sm object-cover"
                    />
                    <div>
                        <p 
                            onClick={() => navigate(`/admin/customers/${row.id}`)}
                            className="text-sm font-bold text-slate-900 hover:text-primary cursor-pointer transition-colors"
                        >
                            {row.name}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400">{row.email || 'No email'}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Phone className="h-3 w-3 text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400">{row.phone}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: "Activity Indicators",
            width: "25%",
            cell: (row) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                        {row.totalOrders || 0} lifetime orders
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        Joined {new Date(row.joinedDate || row.createdAt).toLocaleDateString()}
                    </p>
                </div>
            )
        },
        {
            header: "Financial Value",
            width: "20%",
            cell: (row) => (
                <div className="ds-h4 text-slate-900">
                    ₹{(row.totalSpent || 0).toLocaleString()}
                </div>
            )
        },
        {
            header: "Status",
            width: "15%",
            cell: (row) => (
                <Badge variant={row.status === 'active' ? 'success' : 'error'} className="uppercase tracking-widest text-[9px] font-black">
                    {row.status}
                </Badge>
            )
        },
        {
            header: "Actions",
            width: "5%",
            align: "right",
            cell: (row) => (
                <button
                    onClick={() => navigate(`/admin/customers/${row.id}`)}
                    className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                    <Eye className="h-4 w-4" />
                </button>
            )
        }
    ];

    return (
        <div className="ds-section-spacing animate-in fade-in slide-in-from-bottom-2 duration-700">
            <PageHeader
                title="Customer Intelligence"
                description="Manage customer accounts, track lifetime value and monitor platform engagement."
                badge={
                    <div className="p-3 bg-sky-50 rounded-2xl">
                        <Users className="h-6 w-6 text-sky-600" />
                    </div>
                }
            />

            <DynamicDataTable
                endpoint="/admin/users"
                columns={columns}
                searchPlaceholder="Search customers by name, email or mobile..."
            />
        </div>
    );
};

export default CustomerManagement;
