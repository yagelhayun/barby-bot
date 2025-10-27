const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { getShows } = require('./shows');

const WA_GROUP = '120363405332576442@g.us';
const TIMEOUT = 3;

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('ready', async () => {
    console.log('WhatsApp Client is ready!');

    try {
        const shows = await getShows("טונה");

        const messages = shows.map(async (show) => {
            try {
                await client.sendMessage(WA_GROUP, show);
                console.log('Successfully sent message');
            } catch (error) {
                console.error("Couldn't send message", error);
            }
        });

        await Promise.all(messages);
        console.log(`Waiting ${TIMEOUT} seconds for everything to be resolved...`);
        await new Promise((resolve) => setTimeout(resolve, TIMEOUT * 1000));
        process.exit(0)
    } catch (error) {
        console.log(error);
        throw error;
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.initialize();
