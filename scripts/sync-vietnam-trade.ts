import {db} from './db-runtime';
import {collectTrade} from '../src/lib/trade/collect';
import {saveTradeReleases,getTradeDataset} from '../src/lib/trade/repository';
async function main(){
 db();
 const years=process.argv.slice(2).map(Number);if(!years.length)years.push(2024,2025,2026);
 const releases=await collectTrade(years);
 await saveTradeReleases(releases);
 const saved=await getTradeDataset();
 for(const release of releases){
  const rows=saved.months.filter(m=>m.period.startsWith(String(release.year)));
  if(JSON.stringify(rows)!==JSON.stringify(release.months))throw Error('Database does not match official source');
  console.log(`${release.year}: ${rows.length} months verified · latest ${rows.at(-1)!.period}`);
 }
 console.log(`${saved.months.length} monthly records in Neon. No cumulative/commodity/raw workbook data stored.`);
}
main().catch(()=>{console.error('Trade sync failed. Credentials omitted.');process.exitCode=1;});
