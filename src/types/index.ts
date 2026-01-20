import type {
  Patient,
  MedicalRecord,
  Prescription,
  LabResult,
  MedicalImage,
  Appointment,
  Invoice,
  User,
} from "@prisma/client";

// Patient with relations
export type PatientWithRecords = Patient & {
  medicalRecords: MedicalRecord[];
  prescriptions: Prescription[];
  labResults: LabResult[];
  medicalImages: MedicalImage[];
  appointments: Appointment[];
};

// Medical record with relations
export type MedicalRecordWithRelations = MedicalRecord & {
  patient: Patient;
  doctor: User;
  prescriptions: Prescription[];
  labResults: LabResult[];
  medicalImages: MedicalImage[];
};

// Appointment with relations
export type AppointmentWithRelations = Appointment & {
  patient: Patient;
  doctor: User;
};

// Invoice with items
export type InvoiceWithItems = Invoice & {
  patient: Patient;
  items: { id: string; description: string; quantity: number; unitPrice: number; amount: number }[];
};

// Vital signs type
export interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

// Dashboard stats
export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingPrescriptions: number;
  monthlyRevenue: number;
}
