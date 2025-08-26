export default function handler(req, res) {
  // Debug endpoint to check environment variables (remove after testing)
  if (req.method === 'GET') {
    res.status(200).json({ 
      hasPasswordEnv: !!process.env.PASSWORD,
      passwordLength: process.env.PASSWORD ? process.env.PASSWORD.length : 0,
      fallbackPassword: 'financeflow123',
      // Don't expose actual password for security
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
