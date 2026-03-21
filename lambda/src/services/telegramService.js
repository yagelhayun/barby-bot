import { Api } from 'telegram';
import { env, logger } from '../utils/config.js';
import { getTelegramClient } from '../clients/adminTelegramClient.js';
import { TelegramGroupCreationError } from '../utils/errors/index.js';

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

        logger.debug('Telegram group creation result:', result);
    } catch (err) {
        throw new TelegramGroupCreationError(artistName, err);
    }
}

export const getGroupChatIdByArtistName = async (artistName) => {
    const client = await getTelegramClient(); 

    const dialogs = await client.getDialogs();

    const myGroup = dialogs.find(d => d.title === getGroupName(artistName));

    if (myGroup) {
        logger.info("Found group ID", myGroup.id);
    } else {
        // TODO: clean code
        logger.error("Group not found in chat list.");
        throw new Error("Group not found");
    }

    return myGroup.id.value.toString();
}
