import {describe,it,expect} from 'vitest';
import {parseLiveSearch,resolveStartTimes} from '../src/lib/youtube-live/source';
describe('YouTube live discovery',()=>{
 it('accepts only matching channel live videos and removes duplicates',()=>{
  const item={id:{videoId:'abc_123-xyz'},snippet:{channelId:'UC123',title:'Live',liveBroadcastContent:'live',publishedAt:'2026-11-09T03:20:00Z'}};
  expect(parseLiveSearch({items:[item,item,{...item,snippet:{...item.snippet,channelId:'OTHER'}},{...item,snippet:{...item.snippet,liveBroadcastContent:'none'}}]},'UC123')).toEqual([{videoId:'abc_123-xyz',title:'Live',publishedAt:'2026-11-09T03:20:00Z'}]);
 });
 it('rejects malformed response instead of claiming no live',()=>expect(()=>parseLiveSearch({},'UC123')).toThrow());
});

it('uses actual live start rather than the scheduled video creation time',()=>{const video={videoId:'abc_123-xyz',title:'Live',publishedAt:'2026-11-01T00:00:00Z'};expect(resolveStartTimes([video],[{id:video.videoId,liveStreamingDetails:{actualStartTime:'2026-11-09T03:20:00Z'}}])[0].publishedAt).toBe('2026-11-09T03:20:00Z');expect(()=>resolveStartTimes([video],[])).toThrow();});
