import type {Locale} from '../i18n';
const vi={
 title:'Cảng Hải Phòng',intro:'Theo dõi hệ thống cảng và DWT tàu vào theo kế hoạch của PHP.',back:'Về danh mục cảng',
 sitesTitle:'Hệ thống cảng thuộc PHP',sitesIntro:'Các cảng trực thuộc và đơn vị có quan hệ vốn với Cảng Hải Phòng.',direct:'Trực thuộc',system:'Đơn vị góp vốn',ownership:'Tỷ lệ sở hữu',evidence:'Nguồn quan hệ sở hữu',
 monthlyTitle:'DWT tàu vào theo kế hoạch',monthlyIntro:'Tổng hợp theo tháng · Toàn hệ thống PHP · Không điều chỉnh theo tỷ lệ sở hữu',year:'Năm',apply:'Xem',loading:'Đang tải…',
 month:'Tháng',dwt:'Tổng DWT',calls:'Lượt tàu vào',coverage:'Ngày có dữ liệu',state:'Trạng thái',total:'Tổng số liệu hiện có',
 empty:'Chưa có dữ liệu cho năm',error:'Chưa thể tải dữ liệu PHP. Vui lòng thử lại sau.',retry:'Thử lại',
 updated:'Cập nhật',through:'Dữ liệu đến',noUpdate:'Chưa có dữ liệu',yearTotal:'DWT đã ghi nhận trong năm',yearCalls:'Lượt vào theo kế hoạch',
 definition:'DWT là trọng tải thiết kế của tàu, không phải lượng hàng bốc dỡ. Chỉ cộng lượt tàu vào theo kế hoạch; lượt rời, chuyển cảng và qua luồng không được tính vào chỉ số này.',
 source:'Nguồn: Cảng vụ Hải Phòng',missing:'lượt tàu thiếu DWT; tổng chỉ bao gồm DWT đã biết.',membershipNote:'Quan hệ sở hữu dựa trên hồ sơ cuối năm 2025. Các đơn vị góp vốn được tổng hợp theo DWT thực của lượt tàu, không nhân với tỷ lệ sở hữu.',
 status:{future:'Chưa đến kỳ','no-data':'Chưa có dữ liệu',collecting:'Đang tổng hợp',complete:'Đã tổng hợp',incomplete:'Dữ liệu chưa đầy đủ'},
};
const en:typeof vi={
 title:'Port of Hai Phong',intro:'Track PHP’s port network and planned inbound vessel DWT.',back:'Back to port directory',
 sitesTitle:'PHP port network',sitesIntro:'Directly operated ports and companies with equity links to Port of Hai Phong.',direct:'Direct operations',system:'Equity-linked companies',ownership:'Ownership',evidence:'Ownership source',
 monthlyTitle:'Planned inbound vessel DWT',monthlyIntro:'Monthly totals · PHP port network · No ownership weighting',year:'Year',apply:'View',loading:'Loading…',
 month:'Month',dwt:'Total DWT',calls:'Planned arrivals',coverage:'Days with data',state:'Status',total:'Available data total',
 empty:'No data available for',error:'Unable to load PHP data. Please try again later.',retry:'Try again',
 updated:'Updated',through:'Data through',noUpdate:'No data yet',yearTotal:'Recorded DWT this year',yearCalls:'Planned arrivals',
 definition:'DWT is a vessel’s design deadweight capacity, not cargo handled. Only planned inbound movements are counted; departures, transfers and channel transits are excluded.',
 source:'Source: Hai Phong Maritime Administration',missing:'arrivals have no DWT; totals include known DWT only.',membershipNote:'Ownership links are based on year-end 2025 documents. Equity-linked companies contribute the full DWT of vessel movements, without ownership weighting.',
 status:{future:'Upcoming','no-data':'No data',collecting:'In progress',complete:'Aggregated',incomplete:'Incomplete data'},
};
export function phpMessages(locale:Locale){return locale==='vi'?vi:en;}
