// Data store for drivers and dustbins using localStorage
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "active" | "break" | "offline";
  currentRoute: string;
  location: string;
  completedToday: number;
  efficiency: number;
  vehicleId: string;
  address: string;
  emergencyContact: string;
  licenseNumber: string;
  experience: string;
}

export interface Dustbin {
  id: string;
  location: string;
  fillLevel: number;
  batteryLevel: number;
  signalStrength: number;
  lastEmptied: string;
  status: "critical" | "warning" | "good";
  temperature: number;
  coordinates: { lat: number; lng: number };
  installDate: string;
  model: string;
  capacity: number;
}

// Driver operations
export const getDrivers = async (): Promise<Driver[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "drivers"));
    return querySnapshot.docs.map(doc => ({ ...(doc.data() as Omit<Driver, 'id'>), id: doc.id }));
  } catch {
    return [];
  }
};

export const addDriver = async (driver: Omit<Driver, 'id'>): Promise<void> => {
  await addDoc(collection(db, "drivers"), driver);
};

export const deleteDriver = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "drivers", id));
};

// Dustbin operations
export const getDustbins = async (): Promise<Dustbin[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "dustbins"));
    return querySnapshot.docs.map(doc => ({ ...(doc.data() as Omit<Dustbin, 'id'>), id: doc.id }));
  } catch {
    return [];
  }
};

export const addDustbin = async (dustbin: Omit<Dustbin, 'id'>): Promise<void> => {
  await addDoc(collection(db, "dustbins"), dustbin);
};

export const deleteDustbin = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "dustbins", id));
};