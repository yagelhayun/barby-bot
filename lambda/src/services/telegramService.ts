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

        // TypeUpdates is a union — only Api.Updates and UpdatesCombined carry chats[].
        // CreateChat always returns one of these, but we guard defensively.
        if (!('chats' in result.updates) || !Array.isArray(result.updates.chats) || result.updates.chats.length === 0) {
            throw new Error(`Unexpected updates shape from CreateChat: ${result.updates.className}`);
        }

        // dialog.id for basic groups is the marked peer ID (-chat.id).
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

export const deleteGroup = async (artistName: string): Promise<void> => {
    const client = await getTelegramClient();

    const groupName: string = getGroupName(artistName);
    const dialogs = await client.getDialogs();
    const group = dialogs.find(({ title }) => title === groupName);

    if (!group?.id) {
        logger.info('Telegram group not found, skipping deletion');
        return;
    }

    // Dialog.id is the marked peer-id (-chatId for basic groups).
    // messages.DeleteChat expects the raw positive chatId from the entity.
    const chatId = (group.entity as Api.Chat).id;

    try {
        await client.invoke(new Api.messages.DeleteChat({ chatId }));
        logger.info('Telegram group deleted');
    } catch (err) {
        throw new TelegramGroupDeletionError(artistName, err instanceof Error ? err : new Error(String(err)));
    }
};
