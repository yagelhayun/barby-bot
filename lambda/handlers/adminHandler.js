export const adminHandler = async (event, _context) => {
    if (
        event.headers["x-telegram-bot-api-secret-token"] !== process.env.TELEGRAM_BOT_API_SECRET_TOKEN
    ) {
        console.warn('Unauthorized access attempt detected');
        return { statusCode: 401, body: 'Unauthorized' }
    }

    const { message } = JSON.parse(event.body);
    // const { chat, text, entities } = message;
    const { entities } = message;

    if (!entities?.[0].type === 'bot_command') {
        console.warn('Non-command message received');
        return { statusCode: 400, body: 'Invalid message type' }
    }

    console.log('Received message:', JSON.stringify(message, null, 2));

    return { statusCode: 200, body: event.body }
}
