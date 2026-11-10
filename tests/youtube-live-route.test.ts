import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({sql:vi.fn(),find:vi.fn()}));
vi.mock('../src/lib/db',()=>({getDb:()=>mocks.sql}));
vi.mock('../src/lib/youtube-live/source',()=>({findCurrentLive:mocks.find}));
import {GET} from '../src/app/api/cron/youtube-live/route';

describe('daily livestream detection',()=>{
 beforeEach(()=>{vi.resetAllMocks();vi.stubEnv('CRON_SECRET','test-secret');vi.stubEnv('YOUTUBE_API_KEY','test-key');});
 it('skips YouTube if a video from the channel is already saved for today in Vietnam',async()=>{
  mocks.sql.mockResolvedValueOnce([{video_id:'existing'}]);
  const response=await GET(new Request('https://example.test/api/cron/youtube-live',{headers:{authorization:'Bearer test-secret'}}));
  expect(await response.json()).toMatchObject({status:'skipped'});
  expect(mocks.find).not.toHaveBeenCalled();
 });
 it('continues searching when no video has been saved today',async()=>{
  mocks.sql.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
  mocks.find.mockResolvedValue({channelId:'UCtest',videos:[]});
  const response=await GET(new Request('https://example.test/api/cron/youtube-live',{headers:{authorization:'Bearer test-secret'}}));
  expect(await response.json()).toMatchObject({status:'none'});
  expect(mocks.find).toHaveBeenCalledOnce();
 });
});
