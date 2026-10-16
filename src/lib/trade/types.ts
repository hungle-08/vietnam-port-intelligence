export type TradeMode='month'|'quarter'|'year';
export type TradeMonth={period:string;exportsUsd:number|null;importsUsd:number|null};
export type TradeData={months:TradeMonth[];updatedAt:string|null};
export type TradePeriod=TradeMonth&{balanceUsd:number|null;coverage:number;expected:number};
