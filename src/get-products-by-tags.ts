import AWS from 'aws-sdk';
const db = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env["TABLE_NAME"] || '';

export const handler = async (event: any = {}): Promise<any> => {

    // check that tags were included in querystring
    const qsTags = event.queryStringParameters.tags;
    if (!qsTags) {
        return { statusCode: 400, body: JSON.stringify({ message: "missing tags in query string" }) };
    }
    // check for valid payload
    if (typeof qsTags !== "string") {
        return { statusCode: 400, body: JSON.stringify({ message: "invalid query string" })}
    }
    // get our set of tags
    const tags = qsTags.split(',');

    const queryArray: string[] = [];
    let queryValues: {[key: string]: any} = {};
    for (let i = 0; i < tags.length; i++) {
        let key: string = `:t${i}`;
        queryArray.push(`contains(tags, ${key})`);
        queryValues[key] = tags[i];
    }
    const filter = queryArray.join(' AND ')

    const params = {
        TableName: TABLE_NAME,
        FilterExpression: filter,
        ExpressionAttributeValues: queryValues
    };

    try {
        const response = await db.scan(params).promise();
        if (response.Items && response.Items.length > 0) {
            return { statusCode: 200, body: JSON.stringify({_records: response.Items}) };
        } else {
            return { statusCode: 404}
        }
    } catch (dbError) {
        return { statusCode: 500, body: JSON.stringify(dbError) };
    }
};
