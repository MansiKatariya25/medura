export interface Prescription {
    id: string;
    medicine: string;
    dosage: string;
    date: string;
    doctor: string;
    status: "Active" | "Completed";
}

export interface LabReport {
    id: string;
    testName: string;
    laboratory: string;
    date: string;
    status: "Normal" | "Abnormal" | "Pending";
}

export interface Imaging {
    id: string;
    scanType: string;
    hospital: string;
    date: string;
    imageUrl?: string;
}

export const activePrescriptions: Prescription[] = [
    {
        id: "rx-01",
        medicine: "Amoxicillin 500mg",
        dosage: "1 tablet, 3x daily",
        date: "20 Dec 2024",
        doctor: "Dr. Rohini Sharma",
        status: "Active",
    },
    {
        id: "rx-02",
        medicine: "Paracetamol 650mg",
        dosage: "SOS (When needed)",
        date: "18 Dec 2024",
        doctor: "Dr. A. K. Verma",
        status: "Active",
    },
];

export const recentLabs: LabReport[] = [
    {
        id: "lab-01",
        testName: "Complete Blood Count (CBC)",
        laboratory: "Dr. Lal PathLabs",
        date: "15 Dec 2024",
        status: "Normal",
    },
    {
        id: "lab-02",
        testName: "HbA1c (Diabetes)",
        laboratory: "Thyrocare",
        date: "10 Nov 2024",
        status: "Abnormal",
    },
];

export const recentImaging: Imaging[] = [
    {
        id: "img-01",
        scanType: "MRI - Brain Plain",
        hospital: "Apollo Hospital",
        date: "05 Dec 2024",
    },
    {
        id: "img-02",
        scanType: "X-Ray Chest PA View",
        hospital: "Max Healthcare",
        date: "22 Nov 2024",
    },
];
