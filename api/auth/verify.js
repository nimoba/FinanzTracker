import bcrypt from 'bcryptjs';

const PASSWORD_HASH = bcrypt.hashSync(process.env.PASSWORD || 'financeflow123', 10);

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { password } = req.body;
    
    if (!password || !bcrypt.compareSync(password, PASSWORD_HASH)) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
}
