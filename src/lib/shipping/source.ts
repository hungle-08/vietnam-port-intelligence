export const ALPHALINER_PAGE='https://alphaliner.axsmarine.com/PublicTop100/';
export const ALPHALINER_API=`${ALPHALINER_PAGE}rooter.php`;
export function validateShippingSource(url:string){if(![ALPHALINER_PAGE,ALPHALINER_API].includes(url))throw Error('Unsupported shipping source');}
