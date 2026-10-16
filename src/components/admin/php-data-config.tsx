'use client';
import {Spinner} from '@/components/ui/spinner';
import {useActionState} from 'react';
import {Ship,Clock} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {updatePhpConfig} from '@/lib/php/actions';
import type {PhpJobConfig} from '@/lib/php/jobs';
import type {getPhpDataSummary} from '@/lib/php/repository';
const time=(s:string)=>new Intl.DateTimeFormat('vi-VN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(s));
const number=(n:number)=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:3}).format(n);
export function PhpDataConfig({config,lastRunAt,summary}:{config:PhpJobConfig;lastRunAt:string|null;summary:Awaited<ReturnType<typeof getPhpDataSummary>>}){
 const [state,action,pending]=useActionState(updatePhpConfig,{ok:false,message:''});
 return <section className="cron-panel" aria-labelledby="php-config-title"><div className="cron-title"><span className="brand-mark"><Ship size={22}/></span><div><p className="eyebrow">PHP · CẢNG HẢI PHÒNG</p><h2 id="php-config-title">Kế hoạch tàu & tổng DWT vào cảng</h2><p>Lưu kế hoạch tàu toàn Hải Phòng; báo cáo PHP lọc 5 cảng thành viên.</p></div></div>
 <div className="cron-schedule-note"><Clock size={17}/><p>DWT là trọng tải tàu, không phải lượng hàng bốc dỡ. Lưu toàn bộ lượt vào, rời, chuyển cảng và qua luồng trong kế hoạch Hải Phòng. Tổng DWT PHP chỉ tính lượt vào của 5 cảng thành viên. Dữ liệu chưa xác nhận tàu thực tế đã cập bến.</p></div>
 <div className="cron-summary"><div><span>Ngày có snapshot trong DB</span><strong>{summary.coverage.complete} ngày</strong></div><div><span>Khoảng dữ liệu đã lưu</span><strong>{summary.coverage.firstDay??'—'} → {summary.coverage.lastDay??'—'}</strong></div><div><span>Ngày cần thử lại</span><strong>{summary.coverage.failed} ngày</strong></div></div>
 <div className="php-site-list">{summary.sites.map(site=><div key={site.id}><strong>{site.name}</strong><span>{site.scope==='direct'?'Trực thuộc / công ty con 100%':`Đơn vị góp vốn ${site.ownershipPercent}%`}</span></div>)}</div>
 <div className="cron-summary"><div><span>Lượt vào · toàn hệ thống PHP · ngày đã lưu</span><strong>{number(summary.totals.arrivals)}</strong></div><div><span>Tổng DWT đã biết · theo kế hoạch</span><strong>{summary.totals.dwt===null?'Chưa có dữ liệu':number(summary.totals.dwt)}</strong></div><div><span>Lượt vào thiếu DWT</span><strong>{number(summary.totals.missingDwt)}</strong></div></div>
 <form action={action} className="cron-form"><input type="hidden" name="revision" value={config.revision}/><input type="hidden" name="runHour" value="7"/><label className="cron-switch"><input type="checkbox" name="enabled" defaultChecked={config.enabled}/>Bật thu thập tự động</label>
 <div className="cron-fields"><label>Chu kỳ (ngày)<input type="number" name="intervalDays" min={1} max={4} defaultValue={config.intervalDays} required/><small>Mặc định mỗi ngày. Tối đa 4 ngày để không bỏ sót cửa sổ dữ liệu.</small></label><label>Giờ chạy · Việt Nam<input type="text" value="07:00 — buổi sáng" readOnly/><small>Gói Hobby: cron chạy trong khoảng 07:00–07:59. Đổi giờ cần cập nhật lịch Vercel và deploy lại.</small></label></div>
 <label>URL nguồn<input type="url" name="sourceUrl" defaultValue={config.sourceUrl} required/><small>Hỗ trợ trang /ke-hoach-tau/ của cangvuhaiphong.gov.vn và https://csdltau.cangvuhaiphong.gov.vn/pages/ship_plan.aspx. Nguồn khác cần bổ sung bộ đọc.</small></label>
 <p className="php-config-help">Mỗi lượt chạy lấy kế hoạch ngày hiện tại và đọc lại 3 ngày trước để cập nhật chỉnh sửa. Ngày lỗi giữ snapshot tốt trước đó; các khoảng trống cũ được xử lý bằng script thử lại.</p>
 <div className="cron-submit"><Button type="submit" disabled={pending} aria-busy={pending}>{pending?<><Spinner aria-hidden="true" role={undefined} aria-label={undefined}/>Đang lưu…</>:'Lưu cấu hình PHP'}</Button>{state.message&&<p role={state.ok?'status':'alert'}>{state.message}</p>}</div></form>
 <div className="cron-summary"><div><span>Thu thập tự động</span><strong>{config.enabled?'Đã bật':'Tạm dừng'}</strong></div><div><span>Lịch tiếp theo</span><strong>{config.enabled?time(config.nextRunAt):'—'}</strong></div><div><span>Lần cron gần nhất</span><strong>{lastRunAt?<time dateTime={lastRunAt}>{time(lastRunAt)}</time>:'Chưa chạy cron'}</strong></div></div></section>;
}
