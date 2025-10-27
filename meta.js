require('dotenv/config');
const axios = require('axios');

const TEST_PHONE_ID = "812126058658049";
const TO = "972504537753";

const sendMessage = async (message) => {
    const data = JSON.stringify({
        "messaging_product": "whatsapp",
        "to": TO,
        "recipient_type": "individual",
        "type": "text",
        "text": {
            "preview_url": true,
            "body": message
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

    try {
        const response = await axios.request(config);
        console.log(JSON.stringify(response.data))
    } catch (error) {
        console.log(error);
    }
}

sendMessage("zorem li liad");
