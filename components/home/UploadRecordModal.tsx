"use client";

import { useState } from "react";
import { Upload, X, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

const typeOptions = [
    { value: "prescription", label: "Prescription" },
    { value: "lab_report", label: "Lab Report" },
    { value: "imaging", label: "Imaging/Scan" },
    { value: "discharge_summary", label: "Discharge Summary" },
];

export default function UploadRecordModal({
    isOpen,
    onClose,
    onUpload,
}: {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (data: any) => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState("prescription");
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [doctor, setDoctor] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title || !date) return;

        setLoading(true);

        // Simulate upload delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        onUpload({
            id: Math.random().toString(36).substr(2, 9),
            type,
            title, // mapped to medicine/testName/scanType based on type
            date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            doctor, // mapped as provider/hospital
            file: file.name
        });

        setLoading(false);
        onClose();
        // Reset form
        setFile(null);
        setTitle("");
        setDate("");
        setDoctor("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#10111A] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 p-6">
                    <h2 className="text-xl font-semibold text-white">Upload Record</h2>
                    <button onClick={onClose} className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* File Drop Zone (Simplified) */}
                    <div className="relative group cursor-pointer">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            accept="image/*,.pdf"
                        />
                        <div className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors ${file ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-white/5 group-hover:bg-white/10 group-hover:border-white/20'}`}>
                            {file ? (
                                <>
                                    <CheckCircle className="mb-3 h-10 w-10 text-green-500" />
                                    <p className="text-sm font-medium text-white">{file.name}</p>
                                    <p className="text-xs text-white/50">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </>
                            ) : (
                                <>
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                                        <Upload className="h-6 w-6 text-white" />
                                    </div>
                                    <p className="text-sm font-medium text-white">Tap to upload file</p>
                                    <p className="text-xs text-white/40">PDF, JPG, PNG up to 10MB</p>
                                </>
                            )}
                        </div>
                    </div>

                    <Select
                        label="Record Type"
                        name="type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        options={typeOptions}
                    />

                    <Input
                        label="Title / Medicine Name"
                        placeholder="e.g. Dolo 650 or Blood Test"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                        <Input
                            label="Provider / Doctor"
                            placeholder="Dr. Name or Lab"
                            value={doctor}
                            onChange={(e) => setDoctor(e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={!file || loading}>
                        {loading ? "Uploading..." : "Save Record"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
