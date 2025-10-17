import { MockAgent, setGlobalDispatcher } from "undici";

let mockAgent: MockAgent | null = null;

export function getMockAgent(): MockAgent {
  if (!mockAgent) throw new Error("MockAgent not installed");
  return mockAgent;
}

export async function installUndiciMockAgent() {
  if (mockAgent) return mockAgent;
  mockAgent = new MockAgent({ connections: 1 });
  mockAgent.disableNetConnect();
  setGlobalDispatcher(mockAgent);
  installHappyPathInterceptors(mockAgent);
  return mockAgent;
}

export async function resetUndiciMockAgent() {
  if (!mockAgent) return;
  await mockAgent.close();
  mockAgent = null;
  await installUndiciMockAgent();
}

export async function closeUndiciMockAgent() {
  if (!mockAgent) return;
  await mockAgent.close();
  mockAgent = null;
}

function installHappyPathInterceptors(agent: MockAgent) {
  // Instagram Graph
  const ig = agent.get("https://graph.facebook.com");
  ig
    .intercept({ method: "POST", path: /\/v\d+\.\d+\/[^/]+\/media$/ })
    .reply(200, () => ({ id: `IGC_${Date.now()}` }))
    .persist();

  ig
    .intercept({ method: "GET", path: /\/v\d+\.\d+\/[^/?]+(\?.*)?$/ })
    .reply(200, () => ({ status: "FINISHED", status_code: "FINISHED" }))
    .persist();

  ig
    .intercept({ method: "POST", path: /\/v\d+\.\d+\/[^/]+\/media_publish$/ })
    .reply(200, () => ({ id: `IGM_${Date.now()}` }))
    .persist();

  // TikTok
  const tt = agent.get("https://open.tiktokapis.com");
  tt
    .intercept({ method: "POST", path: "/v2/post/publish/video/init/" })
    .reply(200, () => ({ data: { publish_id: `TT_${Date.now()}`, upload_url: "https://upload.tiktokapis.com/fake" } }))
    .persist();

  const ttu = agent.get("https://upload.tiktokapis.com");
  ttu.intercept({ method: "PUT", path: "/fake" }).reply(200, "").persist();

  // TikTok Insights
  tt
    .intercept({ method: "POST", path: "/v2/video/list/" })
    .reply(200, () => ({ data: { videos: [
      { id: "vid_1", create_time: Math.floor(Date.now()/1000)-3600, like_count: 10, comment_count: 3, share_count: 1, view_count: 100 },
      { id: "vid_2", create_time: Math.floor(Date.now()/1000)-7200, like_count: 5, comment_count: 1, share_count: 0, view_count: 50 },
    ], cursor: String(Date.now()), has_more: false } }))
    .persist();
  tt
    .intercept({ method: "POST", path: "/v2/video/query/" })
    .reply(200, () => ({ data: { videos: [
      { id: "vid_1", create_time: Math.floor(Date.now()/1000)-3600, like_count: 10, comment_count: 3, share_count: 1, view_count: 100 },
      { id: "vid_2", create_time: Math.floor(Date.now()/1000)-7200, like_count: 5, comment_count: 1, share_count: 0, view_count: 50 },
    ] } }))
    .persist();
  tt
    .intercept({ method: "GET", path: /\/v2\/user\/info\/?(\?.*)?$/ })
    .reply(200, () => ({ data: { open_id: "open_1", follower_count: 123, likes_count: 456, video_count: 7 } }))
    .persist();

  // Reddit: no default intercept here (tests will add scenario-specific mocks)

  // Twitter
  const tw = agent.get("https://api.twitter.com");
  tw
    .intercept({ method: "GET", path: /\/2\/tweets(\?.*)?$/ })
    .reply(200, () => ({
      data: [
        { id: "111", public_metrics: { retweet_count: 1, reply_count: 2, like_count: 3, quote_count: 0 }, created_at: new Date().toISOString() },
        { id: "222", public_metrics: { retweet_count: 4, reply_count: 0, like_count: 10, quote_count: 1 }, created_at: new Date().toISOString() },
      ],
    }))
    .persist();

  tw
    .intercept({ method: "GET", path: /\/2\/users\/\d+(\?.*)?$/ })
    .reply(200, () => ({
      data: { id: "999", public_metrics: { followers_count: 123, following_count: 45, tweet_count: 678, listed_count: 9 } },
    }))
    .persist();

  // Azure OpenAI Chat Completions (mock)
  try {
    const base = (process.env.AZURE_OPENAI_ENDPOINT || 'https://azure.openai.mock').replace(/\/$/, '')
    const dep = process.env.AZURE_OPENAI_DEPLOYMENT || 'test-deploy'
    const az = agent.get(base)
    az
      .intercept({ method: 'POST', path: new RegExp(`/openai/deployments/${dep}/chat/completions(\\?.*)?$`) })
      .reply(200, () => ({
        id: 'cmpl_azure_mock',
        choices: [{ index: 0, message: { role: 'assistant', content: 'Hello from Azure!' } }],
        usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
      }))
      .persist();
  } catch {}
}
