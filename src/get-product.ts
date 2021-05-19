import AWS from 'aws-sdk';
const db = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env["TABLE_NAME"] || '';
const PRIMARY_KEY = process.env["PRIMARY_KEY"] || '';

export const handler = async (event: any = {}): Promise<any> => {
    // get product ID from query, verify non-null
    const requestedItemId = event.pathParameters.productId;
    if (!requestedItemId) {
        return { statusCode: 400, body: JSON.stringify({ message: "null productId in path" }) };
    }

    // build out our query
    const params = {
        TableName: TABLE_NAME,
        Key: {
            [PRIMARY_KEY]: requestedItemId
        }
    };

    try {
        // Query for product (get used for primary key query)
        const response = await db.get(params).promise();
        // Return based on message body based on result
        if (response.Item) {
            return { statusCode: 200, body: JSON.stringify(response.Item) };
        } else {
            return { statusCode: 404}
        }
    } catch (dbError) {
        // log error, don't pass back to user
        console.error(dbError);
        return { statusCode: 500 };
    }
};