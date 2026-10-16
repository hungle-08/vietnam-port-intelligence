import 'server-only';
import {getDb} from '../db';
import {validateDay} from './config';
import {buildLachHuyenMonths} from './lach-huyen';
export async function getLachHuyenMonths(asOf:string){
 validateDay(asOf);const sql=getDb();
 // Only whole-region snapshots provide a valid denominator. Older PHP-only extracts do not.
 const [coverage,rows]=await Promise.all([
  sql`SELECT to_char(d.plan_date,'YYYY-MM') AS period,count(*)::int AS days FROM vessel_plan_days d JOIN vessel_plan_snapshots s ON s.id=d.snapshot_id WHERE d.source_id='haiphong-maritime-authority' AND d.plan_date <= ${asOf}::date AND s.raw_html LIKE '%TD_ShowShipPlan_Vao%' GROUP BY 1 ORDER BY 1`,
  sql`WITH arrivals AS (SELECT to_char(d.plan_date,'YYYY-MM') AS period,upper(trim(e.payload->>'toName')) AS name,e.dwt FROM vessel_plan_days d JOIN vessel_plan_snapshots s ON s.id=d.snapshot_id JOIN vessel_plan_events e ON e.snapshot_id=d.snapshot_id WHERE d.source_id='haiphong-maritime-authority' AND d.plan_date <= ${asOf}::date AND s.raw_html LIKE '%TD_ShowShipPlan_Vao%' AND e.movement='arrival') SELECT period,name,count(*)::int AS calls,sum(dwt)::text AS dwt,count(*) FILTER(WHERE dwt IS NULL)::int AS missing FROM arrivals WHERE name IN ('HICT','HTIT','HHIT') GROUP BY period,name ORDER BY period,name`
 ]);
 return buildLachHuyenMonths(coverage.map(r=>({period:String(r.period),days:Number(r.days)})),rows.map(r=>({period:String(r.period),name:String(r.name),calls:Number(r.calls),dwt:r.dwt===null?null:Number(r.dwt),missingDwt:Number(r.missing)})),asOf);
}
