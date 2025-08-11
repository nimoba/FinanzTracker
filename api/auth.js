const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  const correctPassword = process.env.PASSWORD || 'financeflow123';
  const passwordHash = bcrypt.hashSync(correctPassword, 10);

  if (!password || !bcrypt.compareSync(password, passwordHash)) {
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }

  res.status(200).json({ success: true });
};