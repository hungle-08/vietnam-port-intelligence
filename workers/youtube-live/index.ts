type Env = { APP_URL: string; CRON_SECRET: string };

const worker = {
  async scheduled(_controller: unknown, env: Env): Promise<void> {
    if (!env.APP_URL || !env.CRON_SECRET) throw new Error('Missing APP_URL or CRON_SECRET');
    const base = new URL(env.APP_URL);
    if (base.protocol !== 'https:' || base.username || base.password) throw new Error('APP_URL must be an HTTPS origin');
    const endpoint = new URL('/api/cron/youtube-live', base.origin);
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      redirect: 'error',
      signal: AbortSignal.timeout(70_000),
    });
    if (!response.ok) throw new Error(`Livestream endpoint returned HTTP ${response.status}`);
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('status' in data) || !['found', 'none', 'skipped'].includes(String(data.status))) {
      throw new Error('Livestream endpoint returned an invalid response');
    }
    console.log(`Livestream check: ${data.status}`);
  },
};

export default worker;
