import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileCheck, UploadCloud, XCircle, Clock, ExternalLink } from "lucide-react";
import Button from "@/shared/components/ui/Button";
import Card from "@/shared/components/ui/Card";
import { toast } from "sonner";
import { useAuth } from "@core/context/AuthContext";

const Documents = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const applicationStatus = user?.applicationStatus || "pending";
    const rejectionReason = user?.rejectionReason || "";

    const docs = [
        {
            id: "aadhar",
            title: "Aadhar Card",
            url: user?.documents?.aadhar,
            fileName: user?.documents?.aadhar ? "aadhar_document" : null,
            status: user?.documents?.aadhar ? (applicationStatus === "approved" ? "Verified" : applicationStatus === "rejected" ? "Rejected" : "Pending") : "Not Uploaded",
            uploadedOn: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"
        },
        {
            id: "pan",
            title: "PAN Card",
            url: user?.documents?.pan,
            fileName: user?.documents?.pan ? "pan_document" : null,
            status: user?.documents?.pan ? (applicationStatus === "approved" ? "Verified" : applicationStatus === "rejected" ? "Rejected" : "Pending") : "Not Uploaded",
            uploadedOn: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"
        },
        {
            id: "dl",
            title: "Driving License",
            url: user?.documents?.drivingLicense,
            fileName: user?.documents?.drivingLicense ? "dl_document" : null,
            status: user?.documents?.drivingLicense ? (applicationStatus === "approved" ? "Verified" : applicationStatus === "rejected" ? "Rejected" : "Pending") : "Not Uploaded",
            uploadedOn: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"
        }
    ];

    const handleUpload = (id) => {
        toast.info("Upload functionality is currently handled during registration. Contact support to update documents.");
    };

    const viewFile = (url) => {
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            toast.error("File URL not found");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "Verified":
                return (
                    <span className="flex items-center text-brand-600 bg-brand-50 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                        <FileCheck size={12} className="mr-1" /> Verified
                    </span>
                );
            case "Pending":
                return (
                    <span className="flex items-center text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                        <Clock size={12} className="mr-1" /> Pending
                    </span>
                );
            case "Rejected":
                return (
                    <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                        <XCircle size={12} className="mr-1" /> Rejected
                    </span>
                );
            case "Not Uploaded":
                return (
                    <span className="flex items-center text-gray-500 bg-gray-100 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                        Not Uploaded
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="flex items-center p-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-2"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="ds-h3 text-gray-900">My Documents</h1>
                </div>
            </div>

            <div className="p-4 max-w-lg mx-auto space-y-4">
                {docs.map((doc) => (
                    <Card key={doc.id} className="p-4 border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-800">{doc.title}</h4>
                            {getStatusBadge(doc.status)}
                        </div>

                        {doc.url && (
                            <p className="text-xs text-gray-500 mb-3 flex items-center">
                                <span className="truncate max-w-[200px]">{doc.id.toUpperCase()}_DOC</span>
                                <span className="mx-2">•</span>
                                <span>{doc.uploadedOn}</span>
                            </p>
                        )}

                        {doc.status === "Rejected" && rejectionReason && (
                            <div className="bg-red-50 text-red-700 text-xs p-2 rounded mb-3">
                                Reason: {rejectionReason}
                            </div>
                        )}

                        <div className="flex space-x-2">
                            {doc.status !== "Verified" && doc.status !== "Pending" && (
                                <Button
                                    size="sm"
                                    className="w-full text-xs h-8"
                                    onClick={() => handleUpload(doc.id)}
                                >
                                    <UploadCloud size={14} className="mr-1" />
                                    {doc.status === "Rejected" ? "Re-upload" : "Upload"}
                                </Button>
                            )}
                            {doc.url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs h-8"
                                    onClick={() => viewFile(doc.url)}
                                >
                                    <ExternalLink size={14} className="mr-1" />
                                    View File
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Documents;
