import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  const correctPassword = process.env.PASSWORD || "fallback123";
  
  if (password === correctPassword) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Invalid password" });
  }
}