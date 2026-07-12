export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversation_id, user_name, user_email, call_duration_secs } = req.body;

    return res.status(200).json({
      success: true,
      message: 'Test OK',
      received: { conversation_id, user_name, user_email, call_duration_secs }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
