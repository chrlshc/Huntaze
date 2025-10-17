import { describe, it, expect } from 'vitest'
import { fetchTweetPublicMetrics, fetchUserPublicMetrics } from '../src/lib/integration/twitter'

describe('twitter insights', () => {
  it('fetches tweet public metrics (mocked)', async () => {
    const map = await fetchTweetPublicMetrics(['111','222'], 'TEST')
    expect(map['111']).toBeTruthy()
    expect(map['222']).toBeTruthy()
    expect(map['111'].like_count).toEqual(expect.any(Number))
  })

  it('fetches user public metrics (mocked)', async () => {
    const m = await fetchUserPublicMetrics('999', 'TEST')
    expect(m?.followers_count).toEqual(expect.any(Number))
  })
})
