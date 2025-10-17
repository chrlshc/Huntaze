import { RATE_LIMITS } from './config.js'

class TokenBucket {
  constructor({ capacity, refillPerHour, burst }) {
    this.capacity = capacity
    this.tokens = capacity
    this.refillPerMs = (refillPerHour / 3600) / 1000
    this.burst = burst ?? capacity
    this.last = Date.now()
  }

  tryTake(cost = 1) {
    this.refill()
    if (this.tokens >= cost) {
      this.tokens -= cost
      return true
    }
    return false
  }

  refill() {
    const now = Date.now()
    const delta = now - this.last
    if (delta <= 0) return
    this.last = now
    this.tokens = Math.min(this.capacity, this.tokens + delta * this.refillPerMs)
  }
}

const buckets = new Map()

export function takeToken(jobType) {
  const config = RATE_LIMITS[jobType]
  if (!config) return { allowed: true, remaining: null }
  if (!buckets.has(jobType)) {
    buckets.set(jobType, new TokenBucket(config))
  }
  const bucket = buckets.get(jobType)
  const allowed = bucket.tryTake(1)
  return { allowed, remaining: bucket.tokens }
}

export function resetRateLimit(jobType) {
  if (jobType) buckets.delete(jobType)
  else buckets.clear()
}

