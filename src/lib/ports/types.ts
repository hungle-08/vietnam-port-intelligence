export type Region = 'north' | 'central' | 'south';
export type PortCode = { type: string; scope: string; value: string; sourceUrl: string };
export type PortMapLocation = {id:string;label:string;latitude:number;longitude:number;region:Region;accuracy:'approximate'|'verified';sourceUrl:string;method?:'area-estimate'};
export type PortRecord = {
  internalCode: string; nameVi: string; nameEn: string | null; seaportName: string; region: Region;
  sourceLocation: string; address: string | null; latitude: number | null; longitude: number | null;
  coordinateAccuracy: 'unknown' | 'approximate' | 'verified';
  operationalStatus: 'unverified' | 'active' | 'suspended' | 'closed';
  officialCodes: PortCode[]; sources: { directory: string | null; codes: string | null; coordinates: string | null; operation: string | null };
  verifiedAt: string | null; website: string | null; stockTicker: string | null;
  mapVisible?: boolean;
  mapLocations?: PortMapLocation[];
  entityType?: 'port' | 'group'; exchange?: string; regions?: Region[]; referenceStatus?: string;
  sourceId: string; appendix: string; ordinal: number; sourcePages: number[];
};
