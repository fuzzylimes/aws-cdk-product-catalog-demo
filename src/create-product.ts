import AWS from 'aws-sdk';
const db = new AWS.DynamoDB.DocumentClient();
import { v4 as uuidv4 } from 'uuid';
import { isProductRequest, validate } from './domain/product';
const TABLE_NAME = process.env["TABLE_NAME"] || '';

export const handler = async (event: any = {}): Promise<any> => {

    // Check that body has a payload object, abort if not present
    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({message: 'missing body'})};
    }
    const product = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
    if (!isProductRequest(product)||!validate(product)) {
        return { statusCode: 400, body: JSON.stringify({ message: 'invalid message body' }) }
    }
    // Generate a UUID for our primary key in dynamoDB
    product['id'] = uuidv4();
    const params = {
        TableName: TABLE_NAME,
        Item: product
    };

    try {
        // Attempt to write item to DB, and return object if successful
        await db.put(params).promise()
        return { statusCode: 201, body: JSON.stringify(product) }
    } catch (dbError) {
        // No response message for public API, user should check logs
        return { statusCode: 500 };
    }
};