export type LiveVideo={videoId:string;title:string;publishedAt:string};
export function parseLiveSearch(data:unknown,channelId:string):LiveVideo[]{
 if(!data||typeof data!=='object'||!Array.isArray((data as {items?:unknown}).items))throw new Error('Invalid YouTube search response');
 const seen=new Set<string>();const result:LiveVideo[]=[];
 for(const raw of (data as {items:unknown[]}).items){if(!raw||typeof raw!=='object')continue;const item=raw as {id?:{videoId?:unknown};snippet?:{channelId?:unknown;title?:unknown;liveBroadcastContent?:unknown;publishedAt?:unknown}};const id=item.id?.videoId,s=item.snippet;
 if(typeof id!=='string'||! /^[\w-]{11}$/.test(id)||seen.has(id)||s?.channelId!==channelId||s.liveBroadcastContent!=='live'||typeof s.title!=='string'||typeof s.publishedAt!=='string'||!Number.isFinite(Date.parse(s.publishedAt)))continue;
 seen.add(id);result.push({videoId:id,title:s.title,publishedAt:s.publishedAt});}
 return result;
}
async function query(path:string,params:Record<string,string>,key:string){const url=new URL(`https://www.googleapis.com/youtube/v3/${path}`);for(const [k,v] of Object.entries({...params,key}))url.searchParams.set(k,v);const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error(`YouTube API HTTP ${response.status}`);return response.json();}
export async function findCurrentLive(key:string){
 const channel=await query('channels',{part:'id',forHandle:'NguyenHuy2594',maxResults:'1'},key);const id=channel.items?.[0]?.id;if(typeof id!=='string'||!/^UC[\w-]+$/.test(id))throw new Error('YouTube channel not found');
 const result=await query('search',{part:'snippet',channelId:id,type:'video',eventType:'live',maxResults:'25'},key);const videos=parseLiveSearch(result,id); if(!videos.length)return {channelId:id,videos}; const details=await query('videos',{part:'liveStreamingDetails',id:videos.map(v=>v.videoId).join(',')},key);if(!Array.isArray(details.items))throw new Error('Invalid video details'); return {channelId:id,videos:resolveStartTimes(videos,details.items)};
}

/** YouTube's search publishedAt can be the scheduling time, not live start. */
export function resolveStartTimes(videos:LiveVideo[],details:unknown[]):LiveVideo[]{
 return videos.map(video=>{const detail=details.find(x=>x&&typeof x==='object'&&(x as {id?:unknown}).id===video.videoId) as {liveStreamingDetails?:{actualStartTime?:unknown}}|undefined;const start=detail?.liveStreamingDetails?.actualStartTime;if(typeof start!=='string'||!Number.isFinite(Date.parse(start)))throw new Error('Missing actual livestream start time');return {...video,publishedAt:start};});
}
