export type Carrier={id:string;name:string;shortName:string;sourceNames:string[];website:string;logoUrl:string;logoSourceUrl:string;color:string};
export type ShippingEntry={carrierId:string;rank:number;sourceName:string;capacityTeu:number;shipCount:number|null;sharePercent:number};
export type ShippingSnapshot={sourceId:'alphaliner';asOf:string;asOfBasis?:'retrieval-date';retrievedAt:string;retrievalMethod:'direct-http'|'web-search-index';sourceUrl:string;metric:'operated-container-capacity-teu';scope:'consolidated';entries:ShippingEntry[]};
export type ShippingRanking=ShippingSnapshot & {carriers:Carrier[];savedCopy?:boolean};
