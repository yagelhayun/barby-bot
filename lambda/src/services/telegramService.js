import { Api } from 'telegram';
import { env, logger } from '../utils/config.js';
import { getTelegramClient } from '../clients/adminTelegramClient.js';
import { TelegramGroupCreationError, GroupNotFoundError } from '../utils/errors/index.js';

const getGroupName = (artistName) => `${artistName} בארבי`;

export const createGroup = async (artistName) => {
    const client = await getTelegramClient();

    try {
        await client.invoke(
            new Api.messages.CreateChat({
                users: [env.NOTIFICATIONS_BOT_USERNAME],
                title: getGroupName(artistName),
            }),
        );

        logger.info('Created group on Telegram successfully');
    } catch (err) {
        throw new TelegramGroupCreationError(artistName, err);
    }
}

export const getGroupChatIdByArtistName = async (artistName) => {
    const client = await getTelegramClient(); 
    
    const groupName = getGroupName(artistName);
    
    const dialogs = await client.getDialogs();
    const group = dialogs.find(({ title }) => title === groupName);

    if (!group) {
        logger.error(`Group with name "${groupName}" not found`);
        throw new GroupNotFoundError(groupName);
    }
    
    logger.debug("Found group ID", group.id);
    return group.id.value.toString();
}
