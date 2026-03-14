import { Api } from 'telegram';
import { getTelegramClient } from '../clients/adminTelegramClient.js';
import { TelegramGroupCreationError, TelegramAddBotError } from '../utils/errors/index.js';

export const createGroup = async (artistName) => {
    const client = await getTelegramClient();

    try {
        const result = await client.invoke(
            new Api.messages.CreateChat({
                users: [],
                title: artistName,
            }),
        );

        return result.chats[0];
    } catch (err) {
        throw new TelegramGroupCreationError(artistName, err);
    }
}

export const addNotificationsBot = async (chat) => {
    const client = await getTelegramClient();

    try {
        await client.invoke(
            new Api.messages.AddChatUser({
                chatId: chat.id,
                userId: process.env.NOTIFICATIONS_BOT_USERNAME,
                fwdLimit: 0,
            }),
        );
    } catch (err) {
        throw new TelegramAddBotError(chat.title, err);
    }
};
