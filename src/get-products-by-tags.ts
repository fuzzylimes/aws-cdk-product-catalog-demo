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
    // iterate through tag list and build out our query objects
    for (let i = 0; i < tags.length; i++) {
        // create a dynamic key for the query
        let key: string = `:t${i}`;
        // build query string...
        queryArray.push(`contains(tags, ${key})`);
        // add value
        queryValues[key] = tags[i];
    }
    // Join all of the query strings
    const filter = queryArray.join(' AND ')

    // Build out the parameters to be used in the db query
    const params = {
        TableName: TABLE_NAME,
        FilterExpression: filter,
        ExpressionAttributeValues: queryValues
    };

    try {
        // Because we're not querying by the index, we have to use scan in order to execute
        // our desired query expression. Return a response based on contents of resulting query
        const response = await db.scan(params).promise();
        return { statusCode: 200, body: JSON.stringify({_records: response.Items}) };
    } catch (dbError) {
        // log error, don't pass back to user
        console.error(dbError);
        return { statusCode: 500 };
    }
};
