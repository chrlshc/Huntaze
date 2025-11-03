import { http, HttpResponse } from "msw";

const json = (data: unknown, init?: ResponseInit) => HttpResponse.json(data, init);

export const igHandlers = [
  http.post<never, URLSearchParams | undefined>(
    "https://graph.facebook.com/:version/:igUserId/media",
    async () => {
      const containerId = `IGC_${Date.now()}`;
      return json({ id: containerId });
    }
  ),
  http.get("https://graph.facebook.com/:version/:creationId", async ({ request, params }) => {
    const url = new URL(request.url);
    const fields = url.searchParams.get("fields");
    if (fields?.includes("status_code")) {
      return json({ id: params.creationId, status: "FINISHED", status_code: "FINISHED" });
    }
    return json({ id: params.creationId });
  }),
  http.post("https://graph.facebook.com/:version/:igUserId/media_publish", async () => {
    const mediaId = `IGM_${Date.now()}`;
    return json({ id: mediaId });
  }),
];

export const tiktokHandlers = [
  http.post("https://open.tiktokapis.com/v2/post/publish/video/init/", async () => {
    const publish_id = `TT_${Date.now()}`;
    const upload_url = "https://upload.tiktokapis.com/fake";
    return json({ data: { publish_id, upload_url } });
  }),
  http.put("https://upload.tiktokapis.com/fake", async () => new HttpResponse(null, { status: 200 })),
];

export const redditHandlers = [
  http.post("https://oauth.reddit.com/api/submit", async () => {
    const id = `t3_${Math.floor(Math.random() * 1e8)}`;
    return json({ json: { data: { id } } });
  }),
];

export const handlers = [...igHandlers, ...tiktokHandlers, ...redditHandlers];
// Twitter (MSW) – used when not running with Undici mocks
handlers.push(
  http.get('https://api.twitter.com/2/tweets', async ({ request }) => {
    const url = new URL(request.url)
    if (url.pathname === '/2/tweets' && url.searchParams.get('ids')) {
      return json({ data: [
        { id: '111', public_metrics: { retweet_count: 1, reply_count: 2, like_count: 3, quote_count: 0 }, created_at: new Date().toISOString() },
        { id: '222', public_metrics: { retweet_count: 4, reply_count: 0, like_count: 10, quote_count: 1 }, created_at: new Date().toISOString() },
      ] })
    }
    return new HttpResponse('Not Found', { status: 404 })
  }),
  http.get('https://api.twitter.com/2/users/:id', async () =>
    json({ data: { id: '999', public_metrics: { followers_count: 123, following_count: 45, tweet_count: 678, listed_count: 9 } } })
  ),
)
// TikTok Insights
handlers.push(
  http.post('https://open.tiktokapis.com/v2/video/list/', async () =>
    HttpResponse.json({ data: { videos: [
      { id: 'vid_1', create_time: Math.floor(Date.now()/1000)-3600, like_count: 10, comment_count: 3, share_count: 1, view_count: 100 },
      { id: 'vid_2', create_time: Math.floor(Date.now()/1000)-7200, like_count: 5, comment_count: 1, share_count: 0, view_count: 50 },
    ], cursor: String(Date.now()), has_more: false } })
  ),
  http.post('https://open.tiktokapis.com/v2/video/query/', async () =>
    HttpResponse.json({ data: { videos: [
      { id: 'vid_1', like_count: 10, comment_count: 3, share_count: 1, view_count: 100 },
      { id: 'vid_2', like_count: 5, comment_count: 1, share_count: 0, view_count: 50 },
    ] } })
  ),
  http.get('https://open.tiktokapis.com/v2/user/info', async () =>
    HttpResponse.json({ data: { open_id: 'open_1', follower_count: 123, likes_count: 456, video_count: 7 } })
  ),
)

// Instagram Insights
handlers.push(
  http.get('https://graph.facebook.com/:version/:id/insights', async ({ params, request }) => {
    const url = new URL(request.url)
    const metric = url.searchParams.get('metric') || ''
    if (metric.includes('engagement')) {
      return HttpResponse.json({ data: [
        { name: 'engagement', values: [{ value: 20 }] },
        { name: 'reach', values: [{ value: 200 }] },
        { name: 'saved', values: [{ value: 3 }] },
        { name: 'views', values: [{ value: 150 }] },
      ] })
    }
    // user insights fallback
    return HttpResponse.json({ data: [
      { name: 'reach', values: [{ value: 200 }] },
      { name: 'profile_views', values: [{ value: 10 }] },
      { name: 'followers_count', values: [{ value: 1000 }] },
    ] })
  })
)
