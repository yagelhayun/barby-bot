require('dotenv/config');
const axios = require('axios');
const { getShows } = require('./shows');

const TEST_PHONE_ID = "812126058658049";
const TO = "972504537753";

const sendMessage = async (show) => {
    const data = JSON.stringify({
        "messaging_product": "whatsapp",
        "to": TO,
        "recipient_type": "individual",
        "type": "text",
        "text": {
            "preview_url": true,
            "body": show
        }
    });

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://graph.facebook.com/v24.0/${TEST_PHONE_ID}/messages`,
        headers: { 
            'Authorization': `Bearer ${process.env.META_TOKEN}`,
            'Content-Type': 'application/json'
        },
        data
    };

    await axios.request(config);
}

const main = async () => {
    const shows = await getShows("טונה");

    const messages = shows.map(async (show) => {
        try {
            await sendMessage(show);
            console.log('Successfully sent message');
        } catch (error) {
            console.error("Couldn't send message", error);
        }
    });

    await Promise.all(messages);
}

main();
