import Dexie, { type Table } from 'dexie';

export interface Patient {
  id?: number;
  name: string;
  phone: string;
  age: string;
  gender: string;
  weight?: string;
  lastVisit?: Date;
  createdAt: Date;
}

export interface Medicine {
  id?: number;
  name: string;
  dosage: string;
  type: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Drops';
  defaultInstructions?: string;
}

export interface PrescriptionItem {
  medicineId: number;
  name: string;
  dosage: string;
  type: string;
  timings: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    night: boolean;
  };
  duration: string;
  instructions: string;
}

export interface Prescription {
  id?: number;
  patientId: number;
  patientName: string;
  patientAge: string;
  patientGender: string;
  patientPhone: string;
  treatment: string;
  treatmentNotes: string;
  selectedTeeth?: { number: number; treatment: string }[];
  upperSnapshot?: string; // base64 image of upper jaw
  lowerSnapshot?: string; // base64 image of lower jaw
  items: PrescriptionItem[];
  date: Date;
  doctorName: string;
  clinicName: string;
}

export interface Settings {
  id?: number;
  doctorName: string;
  clinicName: string;
  phone: string;
  address: string;
  signature?: string; // base64
  logo?: string; // base64
  horizontalOffset: number;
  verticalOffset: number;
}

export class DentalDB extends Dexie {
  patients!: Table<Patient>;
  medicines!: Table<Medicine>;
  prescriptions!: Table<Prescription>;
  settings!: Table<Settings>;

  constructor() {
    super('DentalPrescriptionDB');
    this.version(1).stores({
      patients: '++id, name, phone, lastVisit',
      medicines: '++id, name, type',
      prescriptions: '++id, patientId, patientName, date',
      settings: '++id'
    });
  }
}

export const db = new DentalDB();

// Seed initial medicines if empty
export async function seedDatabase() {
  const medicineCount = await db.medicines.count();
  if (medicineCount === 0) {
    await db.medicines.bulkAdd([
      { name: 'Amoxicillin', dosage: '500 mg', type: 'Capsule' },
      { name: 'Metrogyl', dosage: '400 mg', type: 'Tablet' },
      { name: 'Zerodol SP', dosage: '', type: 'Tablet' },
      { name: 'Ibuprofen', dosage: '400 mg', type: 'Tablet' },
      { name: 'Paracetamol', dosage: '650 mg', type: 'Tablet' },
      { name: 'Augmentin', dosage: '625 mg', type: 'Tablet' },
      { name: 'Ketorol DT', dosage: '10 mg', type: 'Tablet' },
      { name: 'Chymoral Forte', dosage: '', type: 'Tablet' },
    ]);
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      doctorName: 'Dr. John Doe',
      clinicName: 'Smile Dental Clinic',
      phone: '+1 234 567 890',
      address: '123 Dental St, City, Country',
      horizontalOffset: 0,
      verticalOffset: 0
    });
  }
}
