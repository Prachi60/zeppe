import React, { useState, useEffect, useCallback } from 'react';
import Card from './Card';
import Pagination from './Pagination';
import { HiOutlineMagnifyingGlass, HiOutlineArrowPath, HiOutlineFunnel } from 'react-icons/hi2';
import { adminApi } from '@/modules/admin/services/adminApi';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * A robust, dynamic table component that handles its own data fetching,
 * pagination, searching, and sorting.
 * 
 * @param {Object} props
 * @param {string} props.endpoint - API endpoint to fetch data from
 * @param {Array} props.columns - Column configuration
 * @param {Array} props.filters - Optional filter configuration
 * @param {string} props.searchPlaceholder - Placeholder for search input
 * @param {Object} props.defaultParams - Default API parameters
 * @param {Function} props.onRowClick - Callback when a row is clicked
 * @param {Object} props.apiService - API service to use for fetching (defaults to adminApi)
 */
const DynamicDataTable = ({ 
    endpoint, 
    columns, 
    filters = [], 
    searchPlaceholder = "Search...",
    defaultParams = {},
    onRowClick,
    refreshSelected = 0,
    apiService = adminApi
}) => {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [activeFilters, setActiveFilters] = useState({});

    const fetchData = useCallback(async (requestedPage = 1) => {
        setIsLoading(true);
        try {
            const params = {
                page: requestedPage,
                limit: pageSize,
                sort: sortBy,
                search: searchTerm,
                ...activeFilters,
                ...defaultParams
            };

            const response = await apiService.fetchData(endpoint, params);
            
            if (response.data.success) {
                const payload = response.data.result || {};
                const list = Array.isArray(payload.items) ? payload.items : (response.data.results || []);
                setData(list);
                setTotal(typeof payload.total === 'number' ? payload.total : list.length);
                setPage(typeof payload.page === 'number' ? payload.page : requestedPage);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [endpoint, pageSize, sortBy, searchTerm, activeFilters, defaultParams]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchData, refreshSelected]);

    const handleFilterChange = (key, value) => {
        setActiveFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Toolbox: Search & Filters */}
            <Card className="border-none shadow-sm ring-1 ring-slate-100 p-3 bg-white/60 backdrop-blur-xl">
                <div className="flex flex-col lg:flex-row gap-3 items-center">
                    <div className="relative flex-1 group w-full">
                        <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-all" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border-none rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/5 transition-all outline-none"
                        />
                    </div>
                    
                    <div className="flex gap-2 shrink-0 w-full lg:w-auto">
                        {filters.map(filter => (
                            <select
                                key={filter.key}
                                value={activeFilters[filter.key] || ''}
                                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                className="px-4 py-2.5 bg-white ring-1 ring-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary/5 outline-none appearance-none cursor-pointer"
                            >
                                <option value="">{filter.label}</option>
                                {filter.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ))}

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2.5 bg-white ring-1 ring-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary/5 outline-none appearance-none cursor-pointer"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="name-asc">Name A-Z</option>
                            <option value="name-desc">Name Z-A</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card className="border-none shadow-xl ring-1 ring-slate-100 overflow-hidden rounded-xl">
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                {columns.map((col, idx) => (
                                    <th 
                                        key={idx} 
                                        className={cn(
                                            "px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-[0.18em]",
                                            col.align === 'right' && 'text-right',
                                            col.align === 'center' && 'text-center'
                                        )}
                                        style={{ width: col.width }}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <HiOutlineArrowPath className="h-8 w-8 text-primary animate-spin" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                        No results found
                                    </td>
                                </tr>
                            ) : data.map((item, rowIdx) => (
                                <tr 
                                    key={item._id || rowIdx} 
                                    className={cn(
                                        "group transition-colors hover:bg-slate-50/60",
                                        onRowClick && "cursor-pointer"
                                    )}
                                    onClick={() => onRowClick && onRowClick(item)}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td 
                                            key={colIdx} 
                                            className={cn(
                                                "px-6 py-4 align-middle",
                                                col.align === 'right' && 'text-right',
                                                col.align === 'center' && 'text-center'
                                            )}
                                        >
                                            {col.cell ? col.cell(item) : (item[col.accessor] || '-')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-3 border-t border-slate-100">
                    <Pagination
                        page={page}
                        total={total}
                        pageSize={pageSize}
                        totalPages={Math.ceil(total / pageSize) || 1}
                        onPageChange={(p) => fetchData(p)}
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setPage(1);
                        }}
                        loading={isLoading}
                    />
                </div>
            </Card>
        </div>
    );
};

export default DynamicDataTable;
