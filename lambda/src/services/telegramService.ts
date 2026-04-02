import { Api } from 'telegram';
import { env, logger } from '../utils/config';
import { getTelegramClient } from '../clients/adminTelegramClient';
import {
    TelegramGroupCreationError,
    TelegramGroupDeletionError,
    GroupNotFoundInTelegramError,
} from '../utils/errors';

const getGroupName = (artistName: string): string => `${artistName} בארבי`;

export const createGroup = async (artistName: string): Promise<string> => {
    const client = await getTelegramClient();

    try {
        const result = await client.invoke(
            new Api.messages.CreateChat({
                users: [env.NOTIFICATIONS_BOT_USERNAME],
                title: getGroupName(artistName),
            }),
        );

        if (!('chats' in result.updates) || !Array.isArray(result.updates.chats) || result.updates.chats.length === 0) {
            throw new Error(`Unexpected updates shape from CreateChat: ${result.updates.className}`);
        }

        const chatId = (result.updates.chats[0] as Api.Chat).id.negate().toString();
        logger.info('Telegram group created', { chatId });
        return chatId;
    } catch (err) {
        throw new TelegramGroupCreationError(artistName, err instanceof Error ? err : new Error(String(err)));
    }
};

export const getGroupChatIdByArtistName = async (artistName: string): Promise<string> => {
    const client = await getTelegramClient();

    const groupName: string = getGroupName(artistName);

    const dialogs = await client.getDialogs();
    const group = dialogs.find(({ title }) => title === groupName);

    if (!group?.id) {
        logger.error('Telegram group not found', { groupName });
        throw new GroupNotFoundInTelegramError(groupName);
    }

    logger.debug('Telegram group found', { groupId: group.id.toString() });
    return group.id.toString();
};

export const filterExistingGroupIds = async (chatIds: string[]): Promise<Set<string>> => {
    const client = await getTelegramClient();
    const dialogs = await client.getDialogs();
    const dialogIds = new Set(dialogs.map(({ id }) => id?.toString()));
    return new Set(chatIds.filter(id => dialogIds.has(id)));
};

export const deleteGroup = async (artistName: string): Promise<void> => {
    const client = await getTelegramClient();

    const groupName: string = getGroupName(artistName);
    const dialogs = await client.getDialogs();
    const group = dialogs.find(({ title }) => title === groupName);

    if (!group?.id) {
        logger.info('Telegram group not found, skipping deletion');
        return;
    }

    const chatId = (group.entity as Api.Chat).id;

    try {
        await client.invoke(new Api.messages.DeleteChat({ chatId }));
        logger.info('Telegram group deleted');
    } catch (err) {
        throw new TelegramGroupDeletionError(artistName, err instanceof Error ? err : new Error(String(err)));
    }
};
