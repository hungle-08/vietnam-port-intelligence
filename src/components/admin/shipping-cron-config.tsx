'use client';
import {useActionState} from 'react';
import {Clock,Database,RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {updateShippingConfig} from '@/lib/cron/actions';
import type {JobConfig,JobRun} from '@/lib/cron/repository';
const time=(date:string)=>new Intl.DateTimeFormat('vi-VN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(date));
const statuses:Record<string,string>={running:'Đang chạy',success:'Thành công',failed:'Thất bại',interrupted:'Bị gián đoạn'};
export function ShippingCronConfig({config,runs}:{config:JobConfig;runs:JobRun[]}) {
 const [state,action,pending]=useActionState(updateShippingConfig,{ok:false,message:''});
 return <section className="cron-panel" aria-labelledby="cron-title"><div className="cron-title"><span className="brand-mark"><RefreshCw size={22}/></span><div><p className="eyebrow">ĐỒNG BỘ DỮ LIỆU</p><h2 id="cron-title">Top 10 hãng tàu lớn nhất thế giới</h2><p>Lưu lịch thu thập và nguồn dữ liệu vào Neon.</p></div></div>
 <form action={action} className="cron-form"><input type="hidden" name="revision" value={config.revision}/><label className="cron-switch"><input type="checkbox" name="enabled" defaultChecked={config.enabled}/>Bật thu thập tự động</label>
 <div className="cron-fields"><label>Chu kỳ (tháng)<input type="number" name="intervalMonths" min={1} max={12} defaultValue={config.intervalMonths} required/><small>1 = mỗi tháng, 3 = mỗi quý.</small></label><label>Ngày trong tháng<input type="number" name="dayOfMonth" min={1} max={28} defaultValue={config.dayOfMonth} required/><small>Ngày 1–28 để có lịch ở mọi tháng.</small></label></div>
 <label>Nguồn dữ liệu<select name="sourceId" defaultValue="alphaliner"><option value="alphaliner">Alphaliner · TOP 100</option></select></label>
 <label>URL nguồn<input type="url" name="sourceUrl" defaultValue={config.sourceUrl} required/><small>Hỗ trợ https://alphaliner.axsmarine.com/PublicTop100/ và đường dẫn rooter.php của trang. Nguồn khác cần bổ sung bộ đọc dữ liệu trước khi sử dụng.</small></label>
 <div className="cron-schedule-note"><Clock size={17}/><p>Vercel kiểm tra mỗi ngày, khoảng 07:00 giờ Việt Nam. Chỉ thu thập khi đến lịch trong DB. Đổi chu kỳ hoặc ngày chạy sẽ tính lại lịch tiếp theo; lưu cùng lịch giữ nguyên ngày đến hạn.</p></div>
 <div className="cron-submit"><Button type="submit" disabled={pending}>{pending?'Đang lưu…':'Lưu cấu hình'}</Button>{state.message&&<p role={state.ok?'status':'alert'}>{state.message}</p>}</div></form>
 <div className="cron-summary"><div><span>Trạng thái</span><strong>{config.enabled?'Đã bật':'Đã tắt'}</strong></div><div><span>Lịch tiếp theo (giờ Việt Nam)</span><strong>{config.enabled?time(config.nextRunAt):'Tạm dừng'}</strong></div><div><span>Cấu hình cập nhật</span><strong>{time(config.updatedAt)}</strong></div></div>
 <div className="cron-history"><h3><Database size={17}/>Lịch sử thu thập</h3>{runs.length===0?<p>Chưa có lần chạy tự động. Lịch sẽ hoạt động sau khi deploy bản Production lên Vercel.</p>:<ol>{runs.map(run=><li key={run.id}><div><strong data-status={run.status}>{statuses[run.status]??run.status}</strong><time dateTime={run.startedAt}>{time(run.startedAt)}</time></div><p>{run.message??(run.status==='interrupted'?'Lượt chạy bị gián đoạn; hệ thống sẽ thử lại ở lượt kiểm tra tiếp theo.':'Đang lấy và kiểm tra dữ liệu từ Alphaliner…')}</p><a href={run.sourceUrl} target="_blank" rel="noopener noreferrer">Nguồn Alphaliner ↗</a></li>)}</ol>}</div></section>;
}
