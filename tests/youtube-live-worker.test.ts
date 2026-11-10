import {afterEach,describe,expect,it,vi} from 'vitest';
import worker from '../workers/youtube-live/index';

afterEach(()=>vi.unstubAllGlobals());
describe('livestream scheduled worker',()=>{
 it('calls the Vercel endpoint with the cron bearer secret',async()=>{
  const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({status:'found',count:1}),{status:200}));
  vi.stubGlobal('fetch',fetchMock);
  await worker.scheduled({}, {APP_URL:'https://example.vercel.app/',CRON_SECRET:'example-secret'});
  expect(fetchMock).toHaveBeenCalledOnce();
  const [url,options]=fetchMock.mock.calls[0];
  expect(String(url)).toBe('https://example.vercel.app/api/cron/youtube-live');
  expect(options.headers.Authorization).toBe('Bearer example-secret');
  expect(options.redirect).toBe('error');
 });
 it('fails the invocation on an HTTP error',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(null,{status:503})));
  await expect(worker.scheduled({}, {APP_URL:'https://example.vercel.app',CRON_SECRET:'secret'})).rejects.toThrow('503');
 });
 it('rejects missing secrets and insecure URLs before sending',async()=>{
  const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);
  await expect(worker.scheduled({}, {APP_URL:'http://example.vercel.app',CRON_SECRET:'secret'})).rejects.toThrow();
  await expect(worker.scheduled({}, {APP_URL:'https://example.vercel.app',CRON_SECRET:''})).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
 });
});
it('treats already saved as a successful check',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({status:'skipped'}),{status:200})));
 await expect(worker.scheduled({}, {APP_URL:'https://example.vercel.app',CRON_SECRET:'secret'})).resolves.toBeUndefined();
});
