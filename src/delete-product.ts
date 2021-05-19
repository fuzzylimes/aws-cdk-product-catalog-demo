import AWS from 'aws-sdk';
const db = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env["TABLE_NAME"] || '';
const PRIMARY_KEY = process.env["PRIMARY_KEY"] || '';

export const handler = async (event: any = {}): Promise<any> => {
    // get product ID from query, verify non-null
    const requestedItemId = event.pathParameters.productId;
    if (!requestedItemId) {
        return { statusCode: 400, body: JSON.stringify({message: "null productId in path"}) };
    }

    // setup query parameters
    const params = {
        TableName: TABLE_NAME,
        Key: {
            [PRIMARY_KEY]: requestedItemId
        },
        // Used to easily handle 404
        ConditionExpression: `attribute_exists(${requestedItemId})`
    };

    try {
        // delete based on primary key
        await db.delete(params).promise();
        return { statusCode: 200 };
    } catch (dbError) {
        // handle 404
        if (dbError.code === 'ValidationException' && dbError.message.includes('does not match the schema')) {
            return { statusCode: 404};
        }
        // log error, don't pass back to user
        console.error(dbError);
        return { statusCode: 500 };
    }
};