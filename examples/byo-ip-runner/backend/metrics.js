import http from 'http'

export function startMetricsServer(getSnapshot, port) {
  const server = http.createServer((req, res) => {
    if (req.url === '/metrics') {
      const snapshot = getSnapshot()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(snapshot, null, 2))
      return
    }
    res.writeHead(404)
    res.end()
  })

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'metrics_ready',
      port
    }))
  })

  return server
}

