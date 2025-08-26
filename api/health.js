export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: process.env.POSTGRES_URL ? 'connected' : 'not configured'
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
