export const adminHandler = async (event, context) => {
    console.log('Admin handler invoked');
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));

    return { statusCode: 200, body: event.body }
}
