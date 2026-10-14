'use client';
import {useActionState} from 'react';
import {Ship,Clock} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {updatePhpConfig} from '@/lib/php/actions';
import type {PhpJobConfig,PhpRun} from '@/lib/php/jobs';
import type {getPhpDataSummary} from '@/lib/php/repository';
const time=(s:string)=>new Intl.DateTimeFormat('vi-VN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(s));
const number=(n:number)=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:3}).format(n);
const status:Record<string,string>={running:'Đang chạy',success:'Thành công',failed:'Thất bại',interrupted:'Bị gián đoạn'};
export function PhpDataConfig({config,runs,summary}:{config:PhpJobConfig;runs:PhpRun[];summary:Awaited<ReturnType<typeof getPhpDataSummary>>}){
 const [state,action,pending]=useActionState(updatePhpConfig,{ok:false,message:''});
 return <section className="cron-panel" aria-labelledby="php-config-title"><div className="cron-title"><span className="brand-mark"><Ship size={22}/></span><div><p className="eyebrow">PHP · CẢNG HẢI PHÒNG</p><h2 id="php-config-title">Kế hoạch tàu & tổng DWT vào cảng</h2><p>Theo dõi bến trực thuộc và đơn vị góp vốn của PHP.</p></div></div>
 <div className="cron-schedule-note"><Clock size={17}/><p>DWT là trọng tải tàu, không phải lượng hàng bốc dỡ. Chỉ tính lượt vào theo kế hoạch; lượt rời PHP lưu riêng; lượt chuyển bến, qua luồng và cảng khác không lưu. Dữ liệu chưa xác nhận tàu thực tế đã cập bến.</p></div>
 <div className="cron-summary"><div><span>Ngày có snapshot trong DB</span><strong>{summary.coverage.complete} ngày</strong></div><div><span>Khoảng dữ liệu đã lưu</span><strong>{summary.coverage.firstDay??'—'} → {summary.coverage.lastDay??'—'}</strong></div><div><span>Ngày cần thử lại</span><strong>{summary.coverage.failed} ngày</strong></div></div>
 <div className="php-site-list">{summary.sites.map(site=><div key={site.id}><strong>{site.name}</strong><span>{site.scope==='direct'?'Trực thuộc / công ty con 100%':`Đơn vị góp vốn ${site.ownershipPercent}%`}</span></div>)}</div>
 <div className="cron-summary"><div><span>Lượt vào · toàn hệ thống PHP · ngày đã lưu</span><strong>{number(summary.totals.arrivals)}</strong></div><div><span>Tổng DWT đã biết · theo kế hoạch</span><strong>{summary.totals.dwt===null?'Chưa có dữ liệu':number(summary.totals.dwt)}</strong></div><div><span>Lượt vào thiếu DWT</span><strong>{number(summary.totals.missingDwt)}</strong></div></div>
 <form action={action} className="cron-form"><input type="hidden" name="revision" value={config.revision}/><input type="hidden" name="runHour" value="0"/><label className="cron-switch"><input type="checkbox" name="enabled" defaultChecked={config.enabled}/>Bật thu thập tự động</label>
 <div className="cron-fields"><label>Chu kỳ (ngày)<input type="number" name="intervalDays" min={1} max={4} defaultValue={config.intervalDays} required/><small>Mặc định mỗi ngày. Tối đa 4 ngày để không bỏ sót cửa sổ dữ liệu.</small></label><label>Giờ chạy · Việt Nam<input type="text" value="00:00 — đầu ngày" readOnly/><small>Gói Hobby: lịch Vercel cố định, có thể trễ trong giờ. Đổi giờ cần cập nhật lịch Vercel và deploy lại.</small></label></div>
 <label>URL nguồn<input type="url" name="sourceUrl" defaultValue={config.sourceUrl} required/><small>Hỗ trợ trang /ke-hoach-tau/ của cangvuhaiphong.gov.vn và https://csdltau.cangvuhaiphong.gov.vn/pages/ship_plan.aspx. Nguồn khác cần bổ sung bộ đọc.</small></label>
 <p className="php-config-help">Mỗi lượt chạy lấy kế hoạch ngày hiện tại và đọc lại 3 ngày trước để cập nhật chỉnh sửa. Ngày lỗi giữ snapshot tốt trước đó; các khoảng trống cũ được xử lý bằng script thử lại.</p>
 <div className="cron-submit"><Button type="submit" disabled={pending}>{pending?'Đang lưu…':'Lưu cấu hình PHP'}</Button>{state.message&&<p role={state.ok?'status':'alert'}>{state.message}</p>}</div></form>
 <div className="cron-summary"><div><span>Thu thập tự động</span><strong>{config.enabled?'Đã bật':'Tạm dừng'}</strong></div><div><span>Lịch tiếp theo</span><strong>{config.enabled?time(config.nextRunAt):'—'}</strong></div><div><span>Cấu hình cập nhật</span><strong>{time(config.updatedAt)}</strong></div></div>
 <div className="cron-history"><h3>Lịch sử cron PHP</h3>{runs.length?<ol>{runs.map(r=><li key={r.id}><div><strong data-status={r.status}>{status[r.status]??r.status}</strong><time dateTime={r.startedAt}>{time(r.startedAt)}</time></div><p>{r.message??'Đang thu thập…'} · {r.daysSaved} ngày đã cập nhật</p></li>)}</ol>:<p>Chưa chạy cron tự động. Lịch sử script nhập dữ liệu được ghi riêng trong DB.</p>}</div></section>;
}
