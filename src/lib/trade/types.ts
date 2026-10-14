export type TradeMonth = {period:string;exportsUsd:number;importsUsd:number};
export type TradeRelease = {
 id:string;year:number;sourceUrl:string;exportsUrl:string;importsUrl:string;
 retrievedAt:string;months:TradeMonth[];
};
export type TradeDataset = {months:TradeMonth[];updatedAt:string|null;sourceUrl:string|null};
export type TradePeriod = {
 id:string;year:number;ordinal:number;months:string[];coverage:number;expected:number;
 exportsUsd:number|null;importsUsd:number|null;balanceUsd:number|null;
 state:'complete'|'partial'|'missing'|'future';
};
export type TradeMode='month'|'quarter'|'year';
