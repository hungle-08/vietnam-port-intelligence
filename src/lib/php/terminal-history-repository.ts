import 'server-only';
import {getDb} from '../db';
import {validateDay} from './config';
import {buildTerminalHistory} from './terminal-history';
export async function getPhpTerminalHistory(asOf:string){
 validateDay(asOf);const sql=getDb();
 const [coverage,rows]=await Promise.all([
  sql`SELECT to_char(plan_date,'YYYY-MM') AS period,count(*)::integer AS days FROM vessel_plan_days WHERE source_id='haiphong-maritime-authority' AND plan_date<=${asOf}::date GROUP BY 1 ORDER BY 1`,
  // The existing view applies PHP membership and counts arrivals only, without ownership weighting.
  sql`SELECT to_char(plan_date,'YYYY-MM') AS period,terminal_id,sum(planned_arrivals)::integer AS calls,sum(known_dwt) AS dwt,sum(missing_dwt)::integer AS missing FROM issuer_daily_planned_dwt WHERE ticker='PHP' AND plan_date<=${asOf}::date GROUP BY 1,terminal_id ORDER BY 1,terminal_id`
 ]);
 return buildTerminalHistory(coverage.map(r=>({period:String(r.period),days:Number(r.days)})),rows.map(r=>({period:String(r.period),terminalId:String(r.terminal_id),calls:Number(r.calls),dwt:r.dwt===null?null:Number(r.dwt),missingDwt:Number(r.missing)})),asOf);
}
