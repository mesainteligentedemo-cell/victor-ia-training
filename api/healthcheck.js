export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    endpoint: '/api/healthcheck',
    timestamp: new Date().toISOString()
  });
}