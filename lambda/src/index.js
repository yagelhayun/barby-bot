import 'dotenv/config';
import { validateEnvironmentVariables } from './utils/config.js';
import { adminHandler, notificationsHandler } from './handlers/index.js';

export const main = async (event, context) => {
    validateEnvironmentVariables();

    if (event.source === "aws.events") {
        console.log('Notifications handler invoked');
        return await notificationsHandler(event, context);
    }

    if (event.version === "2.0") {
        console.log('Admin handler invoked');
        return await adminHandler(event, context);
    }

    return { statusCode: 200, body: "Request ignored" };
}

if (process.env.NODE_ENV === 'development') {
    const event = process.argv[2] === 'notifications' ? { source: "aws.events" } : {
        version: "2.0",
        routeKey: "POST /telegram",
        rawPath: "/telegram",
        rawQueryString: "",
        headers: {
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "cache-control": "no-cache",
            "content-length": "28",
            "content-type": "application/json",
            "host": "8byszoh0bd.execute-api.il-central-1.amazonaws.com",
            "postman-token": "c09f8b97-aa4b-4dd5-9b17-13c151ca6843",
            "user-agent": "PostmanRuntime/7.52.0",
            "x-amzn-trace-id": "Root=1-69b444c4-274142a004a6cd2a27649d69",
            "x-forwarded-for": "217.132.73.12",
            "x-forwarded-port": "443",
            "x-forwarded-proto": "https",
            "x-telegram-bot-api-secret-token": process.env.ADMIN_BOT_SECRET_TOKEN
        },
        requestContext: {
            accountId: "718460151815",
            apiId: "8byszoh0bd",
            domainName: "8byszoh0bd.execute-api.il-central-1.amazonaws.com",
            domainPrefix: "8byszoh0bd",
            http: {
                method: "POST",
                path: "/telegram",
                protocol: "HTTP/1.1",
                sourceIp: "217.132.73.12",
                userAgent: "PostmanRuntime/7.52.0"
            },
            requestId: "aK-uyhGHzXUEJwA=",
            routeKey: "POST /telegram",
            stage: "$default",
            time: "13/Mar/2026:17:09:24 +0000",
            timeEpoch: 1773421764661
        },
        body: JSON.stringify({
            update_id: 597378858,
            message: {
                message_id: 16,
                from: {
                    id: 7184717183,
                    is_bot: false,
                    first_name: "Yagel",
                    last_name: "Hayun",
                    language_code: "en"
                },
                chat: {
                    id: 7184717183,
                    first_name: "Yagel",
                    last_name: "Hayun",
                    type: "private"
                },
                entities: [{
                    offset: 0,
                    length: 7,
                    type: "bot_command"
                }],
                date: 1773453376,
                text: "/create Queen"
            }
        }),
        isBase64Encoded: false
    };
    const context = {
        invokedFunctionArn: "arn:aws:lambda:il-central-1:718460151815:function:barby_bot",
        awsRequestId: "11d56879-9ce8-46b0-b15d-ecb67549c46f",
        xRayTraceId: "Root=1-69b444c4-1f42fbcc100da55f2a673bfc;Parent=35f91924185a4925;Sampled=0;Lineage=1:67334a2f:0",
        functionName: "barby_bot",
        functionVersion: "$LATEST",
        memoryLimitInMB: "128",
        logGroupName: "/aws/lambda/barby_bot",
        logStreamName: "2026/03/13/[$LATEST]2a02f97518e44555be8dd16b50c21661"
    };

    main(event, context)
        .then(() => {
            console.log('Execution completed successfully');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Error during execution:', err);
            process.exit(1);
        });
}
