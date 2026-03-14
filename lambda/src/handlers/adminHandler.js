export const adminHandler = async (event, _context) => {
    console.debug('Received event:', JSON.stringify(event, null, 2));

    const { message } = JSON.parse(event.body);
    const { chat, text, entities } = message;

    if (
        event.headers["x-telegram-bot-api-secret-token"] !== process.env.ADMIN_BOT_SECRET_TOKEN ||
        chat?.id !== parseInt(process.env.ADMIN_BOT_OWNER_ID)
    ) {
        console.error('Unauthorized access attempt detected');
        return { statusCode: 401, body: 'Unauthorized' }
    }

    if (!entities || entities[0]?.type !== 'bot_command') {
        console.error('Non-command message received');
        return { statusCode: 400, body: 'Invalid message type' }
    }

    const artistName = text.split(' ').slice(1).join(' ');

    console.debug('Received artist:', artistName);
    console.debug('Received message:', JSON.stringify(message, null, 2));

    return { statusCode: 200, body: 'Successfully added artist' }
}
