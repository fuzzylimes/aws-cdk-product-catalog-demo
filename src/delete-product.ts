import AWS from 'aws-sdk';
const db = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env["TABLE_NAME"] || '';
const PRIMARY_KEY = process.env["PRIMARY_KEY"] || '';

export const handler = async (event: any = {}): Promise<any> => {

    const requestedItemId = event.pathParameters.productId;
    if (!requestedItemId) {
        return { statusCode: 400, body: JSON.stringify({message: "null productId in path"}) };
    }

    const params = {
        TableName: TABLE_NAME,
        Key: {
            [PRIMARY_KEY]: requestedItemId
        }
    };

    try {
        await db.delete(params).promise();
        return { statusCode: 200, body: '' };
    } catch (dbError) {
        return { statusCode: 500, body: JSON.stringify(dbError) };
    }
};