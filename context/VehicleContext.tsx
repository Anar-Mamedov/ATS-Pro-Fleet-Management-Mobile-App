import { ReactNode, createContext, useContext, useState } from 'react';

interface VehicleContextType {
  selectedVehicleId: number | null;
  setSelectedVehicleId: (id: number | null) => void;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider = ({ children }: { children: ReactNode }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  return <VehicleContext.Provider value={{ selectedVehicleId, setSelectedVehicleId }}>{children}</VehicleContext.Provider>;
};

export const useVehicleContext = () => {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicleContext must be used within a VehicleProvider');
  }
  return context;
};
