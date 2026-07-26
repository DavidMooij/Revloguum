export type RootTabParamList = {
  Dashboard: undefined;
  Fuel: undefined;
  Vehicles: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  AddEntry: { vehicleId?: string; editEntryId?: string };
  EntryDetail: { entryId: string };
  AddVehicle: { editId?: string };
  ManageServiceTypes: undefined;
  ImageViewer: { images: string[]; initialIndex: number };
  History: { vehicleId: string };
  VehicleDetail: { vehicleId: string };
  VehicleHistory: { vehicleId: string };
  VehicleCosts: { vehicleId: string };
  VehicleFuelHistory: { vehicleId: string };
  VehicleStats: { vehicleId: string };
  ExportPdf: undefined;
};
