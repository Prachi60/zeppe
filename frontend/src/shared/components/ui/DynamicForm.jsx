import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import Button from './Button';

/**
 * A generic, schema-driven form component.
 * 
 * @param {Object} props
 * @param {Object} props.schema - Zod schema for validation
 * @param {Array} props.fields - Array of field configurations
 * @param {Object} props.defaultValues - Initial form values
 * @param {Function} props.onSubmit - Callback on successful submission
 * @param {string} props.submitLabel - Text for the submit button
 * @param {boolean} props.isLoading - Loading state for the submit button
 */
const DynamicForm = ({ 
    schema, 
    fields, 
    defaultValues = {}, 
    onSubmit, 
    submitLabel = "Save Changes",
    isLoading = false,
    className
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues
    });

    const onFormSubmit = async (data) => {
        await onSubmit(data, reset);
    };

    const renderFieldWithData = (field) => {
        const value = watch(field.name);
        // Handle image preview logic: if it's a FileList (from input type=file), create a temporary URL
        let currentValue = value;
        if (field.type === 'image' && value instanceof FileList && value.length > 0) {
            currentValue = URL.createObjectURL(value[0]);
        } else if (field.type === 'image' && !value) {
            currentValue = defaultValues[field.name];
        }

        return renderField({ ...field, currentValue }, register, errors);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className={cn("space-y-8", className)}>
            {/* If we have sections, we can render them with headings */}
            {fields.some(f => f.section) ? (
                <div className="space-y-10">
                    {[...new Set(fields.map(f => f.section))].map(sectionName => (
                        <div key={sectionName} className="space-y-4">
                            {sectionName && (
                                <div className="border-b border-slate-100 pb-2">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{sectionName}</h4>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {fields.filter(f => f.section === sectionName).map(f => renderFieldWithData(f))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fields.map(f => renderFieldWithData(f))}
                </div>
            )}

            <div className="flex gap-4 pt-4">
                <Button 
                    type="submit" 
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/10 transition-all"
                    loading={isLoading}
                >
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
};

// Extracted render logic
const renderField = (field, register, errors) => (
    <div 
        key={field.name} 
        className={cn(
            "space-y-1.5 flex flex-col",
            field.fullWidth && "md:col-span-2"
        )}
    >
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            {field.label} {field.required && <span className="text-rose-500">*</span>}
        </label>
        
        {field.type === 'textarea' ? (
            <textarea
                {...register(field.name)}
                rows={field.rows || 4}
                placeholder={field.placeholder}
                className={cn(
                    "w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none shadow-sm",
                    errors[field.name] && "ring-2 ring-rose-500/20"
                )}
            />
        ) : field.type === 'select' ? (
            <select
                {...register(field.name)}
                className={cn(
                    "w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm cursor-pointer",
                    errors[field.name] && "ring-2 ring-rose-500/20"
                )}
            >
                <option value="">Select {field.label}</option>
                {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        ) : field.type === 'image' ? (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                        {field.currentValue ? (
                            <img src={field.currentValue} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center px-2">No Image</div>
                        )}
                    </div>
                    <div className="flex-1">
                        <input
                            type="file"
                            accept="image/*"
                            {...register(field.name)}
                            className="hidden"
                            id={`file-${field.name}`}
                        />
                        <label 
                            htmlFor={`file-${field.name}`}
                            className="inline-flex items-center px-4 py-2 bg-white ring-1 ring-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 cursor-pointer transition-all shadow-sm"
                        >
                            Change Photo
                        </label>
                        <p className="mt-1.5 text-[9px] font-bold text-slate-400">Recommended: 800x800px PNG/JPG</p>
                    </div>
                </div>
            </div>
        ) : (
            <input
                {...register(field.name)}
                type={field.type || 'text'}
                placeholder={field.placeholder}
                className={cn(
                    "w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm",
                    errors[field.name] && "ring-2 ring-rose-500/20"
                )}
            />
        )}
        
        {errors[field.name] && (
            <span className="text-[10px] font-bold text-rose-500 ml-1">
                {errors[field.name].message}
            </span>
        )}
    </div>
);

export default DynamicForm;
