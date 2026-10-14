'use client';
import {useActionState} from 'react';
import {ChartNoAxesCombined,Clock} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {updateTradeConfig} from '@/lib/trade/actions';
import type {TradeJobConfig} from '@/lib/trade/jobs';
const time=(s:string)=>new Intl.DateTimeFormat('vi-VN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(s));
export function TradeDataConfig({config}:{config:TradeJobConfig}) {
 const [state,action,pending]=useActionState(updateTradeConfig,{ok:false,message:''});
 return <section className="cron-panel" aria-labelledby="trade-config-title"><div className="cron-title"><span className="brand-mark"><ChartNoAxesCombined size={22}/></span><div><p className="eyebrow">ĐỒNG BỘ DỮ LIỆU</p><h2 id="trade-config-title">Xuất nhập khẩu hàng hóa Việt Nam</h2><p>Kiểm tra Excel chính thức. Chỉ lưu tổng xuất khẩu và nhập khẩu từng tháng.</p></div></div>
 <form action={action} className="cron-form"><input type="hidden" name="revision" value={config.revision}/><label className="cron-switch"><input type="checkbox" name="enabled" defaultChecked={config.enabled}/>Bật thu thập tự động</label><div className="cron-fields"><label>Lịch thu thập<input value={`Mỗi ${config.intervalMonths} tháng · Ngày ${config.dayOfMonth}`} readOnly/><small>Chạy một lần mỗi tháng vào ngày 25, sau mốc công bố Excel đã quan sát của nguồn.</small></label><label>Nguồn dữ liệu<select name="sourceUrl" defaultValue={config.sourceUrl}><option value={config.sourceUrl}>Cục Thống kê · Excel xuất nhập khẩu</option></select><small>Nguồn khác cần bổ sung bộ đọc tương thích.</small></label></div>
 <div className="cron-schedule-note"><Clock size={17}/><p>Chạy ngày 25 khoảng 08:00–08:59 giờ Việt Nam. Cập nhật năm hiện tại và năm trước. Nếu nguồn chưa công bố hoặc lỗi, giữ nguyên dữ liệu cũ và ghi nhận trạng thái. Lịch tháng tiếp theo sẽ kiểm tra lại.</p></div><div className="cron-submit"><Button type="submit" disabled={pending}>{pending?'Đang lưu…':'Lưu cấu hình'}</Button>{state.message&&<p role={state.ok?'status':'alert'}>{state.message}</p>}</div></form>
 <div className="cron-summary"><div><span>Lịch tiếp theo</span><strong>{config.enabled?time(config.nextRunAt):'Tạm dừng'}</strong></div><div><span>Kiểm tra gần nhất</span><strong>{config.lastCheckedAt?time(config.lastCheckedAt):'Chưa chạy tự động'}</strong></div><div><span>Kết quả</span><strong>{config.lastResult==='success'?'Thành công':config.lastResult==='failed'?'Chưa cập nhật được':'Chờ lần chạy đầu'}</strong></div></div>{config.lastMessage&&<p>{config.lastMessage}</p>}<a href={config.sourceUrl} target="_blank" rel="noopener noreferrer">Nguồn Cục Thống kê ↗</a></section>;
}
