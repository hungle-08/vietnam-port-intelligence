// SVG positions only need millipixel precision. JS engines can differ in the last projection decimals.
export function svgNumber(value:number){return Number(value.toFixed(3));}
