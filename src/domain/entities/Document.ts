export type DocumentOwnerType = "vehicle" | "service" | "cost";

export interface DocumentPage {
  id: string;
  path: string;
  sortOrder: number;
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  ownerType: DocumentOwnerType;
  ownerId: string;
  title: string;
  category: string | null;
  dateTs: number;
  notes: string | null;
  pages: DocumentPage[];
  createdAt: number;
  updatedAt: number;
}

export interface SaveDocumentInput {
  vehicleId: string;
  ownerType: DocumentOwnerType;
  ownerId: string;
  title: string;
  category: string | null;
  dateTs: number;
  notes: string | null;
  pagePaths: string[];
}