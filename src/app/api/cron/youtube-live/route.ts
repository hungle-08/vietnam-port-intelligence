import {authorizedCron} from '@/lib/cron/config';
import {getDb} from '@/lib/db';
import {findCurrentLive} from '@/lib/youtube-live/source';
export const maxDuration=60;
export async function GET(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(!authorizedCron(request.headers.get('authorization'),process.env.CRON_SECRET))return Response.json({error:'Unauthorized'},{status:401,headers});
 const sql=getDb();
 try{
  const [existing]=await sql`SELECT video_id FROM youtube_live_videos WHERE channel_id=${'UCc9u7xN-7YiVClOhm0k5akQ'} AND published_at >= ((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh') AND published_at < (((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + 1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh') LIMIT 1`;
  if(existing)return Response.json({status:'skipped',reason:'already_saved_today'},{headers});
  const key=process.env.YOUTUBE_API_KEY;if(!key)return Response.json({error:'YouTube API key is not configured'}, {status:503,headers});
  const {channelId,videos}=await findCurrentLive(key);
  for(const video of videos)await sql`INSERT INTO youtube_live_videos(video_id,channel_id,title,published_at) VALUES(${video.videoId},${channelId},${video.title},${video.publishedAt}::timestamptz) ON CONFLICT(video_id) DO UPDATE SET title=excluded.title,last_seen_at=now()`;
  await sql`INSERT INTO youtube_live_checks(status,found_count) VALUES(${videos.length?'found':'none'},${videos.length})`;
  return Response.json({status:videos.length?'found':'none',count:videos.length},{headers});
 }catch{try{await sql`INSERT INTO youtube_live_checks(status) VALUES('error')`}catch{}return Response.json({error:'Không thể kiểm tra livestream'}, {status:502,headers});}
}
