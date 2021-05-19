import { LambdaIntegration } from '@aws-cdk/aws-apigateway';
import apigateway = require('@aws-cdk/aws-apigateway');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/core');

const partitionKey: string = 'id';

// This file is used to generate out the full stack of resources that our application will
// need, by defining everything programmatically via code. CDK supports a few different
// languages, but evidently all support has been translated from the typescript version.
//
// This file must first be compiled to js before it can be used. It is then run via the 
// reference in the `cdk.json` file. When cdk commands are issued, they will reference the
// generated index.js file.
//
// When this file is run, it will build out a CloudFormation template that the CDK then uses
// to manage the deployment. It is smart enough to handle incremental changes to defined
// resources, as well as the addition of new resources, without requiring a full re-deployment
// of the stack.

export class ProductStoreStack extends cdk.Stack {
    constructor(app: cdk.App, id: string) {
        super(app, id)

        // This section defines pieces of our core infrastructure so they can be wired together
        // For our use case, we need to create a dynamoDB table, as well as the lambda functions
        // that will support our API.
        
        // Configure the dynamoDB table, 'products', with primary key of 'id'
        const dynoTable = new dynamodb.Table(this, 'products', {
            partitionKey: {
                name: partitionKey,
                type: dynamodb.AttributeType.STRING
            },
            tableName: 'products',
            // TODO: Comment this out for production, this will wipe all data on `cdk destroy`
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // Configure lambda for adding a new product
        const addProductLambda = new lambda.Function(this, 'addProduct', {
            code: new lambda.AssetCode('src'),
            // links lambda to the generated 'create-product.js` file in src folder
            handler: 'create-product.handler',
            runtime: lambda.Runtime.NODEJS_10_X,
            // setup our common env properties used by lambda from this config file
            environment: {
                TABLE_NAME: dynoTable.tableName,
                PRIMARY_KEY: partitionKey
            }
        });

        // Configure lambda for retrieving a specific product
        const getProductLambda = new lambda.Function(this, 'getProduct', {
            code: new lambda.AssetCode('src'),
            // links lambda to the generated 'get-product.js` file in src folder
            handler: 'get-product.handler',
            runtime: lambda.Runtime.NODEJS_10_X,
            environment: {
                TABLE_NAME: dynoTable.tableName,
                PRIMARY_KEY: partitionKey
            }
        });

        // Configure lambda for retrieving products with specific tag values
        const getProductsByTagsLambda = new lambda.Function(this, 'getProductsByTags', {
            code: new lambda.AssetCode('src'),
            // links lambda to the generated 'get-products-by-tags.js` file in src folder
            handler: 'get-products-by-tags.handler',
            runtime: lambda.Runtime.NODEJS_10_X,
            environment: {
                TABLE_NAME: dynoTable.tableName,
                PRIMARY_KEY: partitionKey
            }
        });

        // Configure lambda for deleting specific producs
        const deleteProductLambda = new lambda.Function(this, 'deleteProduct', {
            code: new lambda.AssetCode('src'),
            handler: 'delete-product.handler',
            runtime: lambda.Runtime.NODEJS_10_X,
            environment: {
                TABLE_NAME: dynoTable.tableName,
                PRIMARY_KEY: partitionKey
            }
        });

        // Wire the dynamo table and lambda's together
        dynoTable.grantReadWriteData(addProductLambda);
        dynoTable.grantReadWriteData(getProductLambda);
        dynoTable.grantReadWriteData(getProductsByTagsLambda);
        dynoTable.grantReadWriteData(deleteProductLambda);

        // This section handles the creation of a new API Gateway API set, and connects
        // our established lambda functions to it. This is where all of the routing is
        // defined.
        //
        // The process for adding a new route follows a similar pattern:
        //    * Add a resource/route to the API
        //    * Set up an integration to the lambda
        //    * Wire that integration to a method call

        // Crete new API Gateway API
        const gateway = new apigateway.RestApi(this, 'productsAPI', {
            restApiName: 'Products API'
        })
 
        const productsAPI = gateway.root.addResource('products')
        const addProductIntegration = new LambdaIntegration(addProductLambda);
        productsAPI.addMethod('POST', addProductIntegration);
        addCorsOptions(productsAPI);

        // Resources surrounded by { } brackets indicates a path variable.
        const specificProductAPI = productsAPI.addResource('{productId}');
        const getProductIntegration = new LambdaIntegration(getProductLambda);
        specificProductAPI.addMethod('GET', getProductIntegration)

        const deleteProductIntegration = new LambdaIntegration(deleteProductLambda);
        specificProductAPI.addMethod('DELETE', deleteProductIntegration);
        addCorsOptions(specificProductAPI);

        const productSearchAPI = productsAPI.addResource('search');
        const productSearchIntegration = new LambdaIntegration(getProductsByTagsLambda);
        productSearchAPI.addMethod('GET', productSearchIntegration);
        addCorsOptions(productSearchAPI);

    }

}

// Setup cors so we can reach these APIs. All of this fancy boilerplate tells the
// API resource to automatically handle any OPTIONS request that comes in
export function addCorsOptions(apiResource: apigateway.IResource) {
    apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
        integrationResponses: [{
            statusCode: '200',
            responseParameters: {
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Credentials': "'false'",
                'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
            },
        }],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
            "application/json": "{\"statusCode\": 200}"
        },
    }), {
        methodResponses: [{
            statusCode: '200',
            responseParameters: {
                'method.response.header.Access-Control-Allow-Headers': true,
                'method.response.header.Access-Control-Allow-Methods': true,
                'method.response.header.Access-Control-Allow-Credentials': true,
                'method.response.header.Access-Control-Allow-Origin': true,
            },
        }]
    })
}

const app = new cdk.App;
new ProductStoreStack(app, 'BasicProductStore');
// generates the cloudformation template and all assets needed
app.synth;