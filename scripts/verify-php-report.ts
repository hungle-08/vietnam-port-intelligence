import {db} from './db-runtime';
import {getPhpDailyMetrics,getPhpReportMetadata,getPhpTerminalDailyMetrics} from '../src/lib/php/repository';
import {aggregatePhpMonths,aggregatePhpContributions} from '../src/lib/php/monthly';
import {vietnamDay} from '../src/lib/php/config';
async function main(){
 const sql=db(),asOf=vietnamDay(),year=2026;
 const [days,metadata]=await Promise.all([getPhpDailyMetrics('2026-01-01','2026-12-31','system'),getPhpReportMetadata(year,asOf)]);
 const report=aggregatePhpMonths(days,year,asOf);
 const contributions=aggregatePhpContributions(days,await getPhpTerminalDailyMetrics('2026-01-01','2026-12-31'),year,asOf);
 for(const month of contributions){
  const expectedMonth=report.months[month.month-1];
  for(const metric of ['dwt','calls'] as const){
   const values=month.sites.map(site=>site[metric]).filter(value=>value!==null);
   const total=values.length?values.reduce((sum,value)=>sum+value,0):null;
   if(total!==expectedMonth[metric])throw Error('Port contributions do not match PHP monthly totals');
  }
 }
 const [expected]=await sql`SELECT sum(known_dwt) AS dwt,sum(planned_arrivals)::integer AS calls FROM issuer_daily_planned_dwt WHERE ticker='PHP' AND plan_date BETWEEN '2026-01-01' AND '2026-12-31' AND plan_date<=${asOf}::date`;
 if(report.totalDwt!==Number(expected.dwt)||report.totalCalls!==expected.calls||report.months.length!==12)throw Error('Monthly totals mismatch');
 if(metadata.sites.length!==5)throw Error('Missing PHP sites');
 const old=aggregatePhpMonths(await getPhpDailyMetrics('2025-01-01','2025-12-31','system'),2025,asOf);if(old.hasData)throw Error('Unexpected 2025 coverage');
 console.log(JSON.stringify({year,sites:metadata.sites.length,contributionMonthsVerified:contributions.length,through:metadata.lastDay,totalDwt:report.totalDwt,totalCalls:report.totalCalls,months:report.months.map(m=>({month:m.month,dwt:m.dwt,status:m.status})),previousYear:'no data'}));
}
main().catch(()=>{console.error('PHP report verification failed; credentials omitted.');process.exitCode=1;});
