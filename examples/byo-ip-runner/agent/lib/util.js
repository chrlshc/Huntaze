export function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms))
}

export function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function jitter(minMs, jitterMs = 0) {
  return rand(minMs, minMs + jitterMs)
}

