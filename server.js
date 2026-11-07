import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API proxy endpoint for forwarding leads to Google Sheets (optional server route)
app.post('/api/lead', async (req, res) => {
  try {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL || req.body.scriptUrl || 'https://script.google.com/macros/s/AKfycbwbnMq4XOc6yNxp5de11mgI-071s0kdWhWEFq6fesxWqu7EB3BqtfZRqRq0JCP4GF2s/exec';
    if (!scriptUrl) {
      return res.status(200).json({
        success: true,
        message: 'Lead received by server. Configure GOOGLE_SCRIPT_URL to forward directly to Google Sheets.',
        data: req.body
      });
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return res.json({ success: true, result: data });
  } catch (error) {
    console.error('Error forwarding lead:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AutoFlow server running on http://0.0.0.0:${PORT}`);
});
