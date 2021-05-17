import AWS from 'aws-sdk';
const db = new AWS.DynamoDB.DocumentClient();
import { v4 as uuidv4 } from 'uuid';
import { isProductRequest, validate } from './domain/product';
const TABLE_NAME = process.env["TABLE_NAME"] || '';

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
    DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`,
    INVALID_MESSAGE_BODY = { statusCode: 400, body: JSON.stringify({ message: 'invalid message body' }) }

export const handler = async (event: any = {}): Promise<any> => {

    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({message: 'missing body'})};
    }
    if (typeof event.body != 'object') {
        return INVALID_MESSAGE_BODY;
    }
    const item = JSON.parse(event.body);
    if (!isProductRequest(item) || !validate(item)) {
        return INVALID_MESSAGE_BODY;
    }
    item['id'] = uuidv4();
    const params = {
        TableName: TABLE_NAME,
        Item: item
    };

    try {
        const res = await db.put(params).promise()
        return { statusCode: 201, body: JSON.stringify(res.$response) }
    } catch (dbError) {
        const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
            DYNAMODB_EXECUTION_ERROR : RESERVED_RESPONSE;
        return { statusCode: 500, body: errorResponse };
    }
};