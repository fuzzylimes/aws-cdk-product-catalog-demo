import { LambdaIntegration } from '@aws-cdk/aws-apigateway';
import apigateway = require('@aws-cdk/aws-apigateway');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/core');

const partitionKey: string = 'productId';

export class GatewayLambdaDynoStack extends cdk.Stack {
    constructor(app: cdk.App, id: string) {
        super(app, id)
        
        const dynoTable = new dynamodb.Table(this, 'products', {
            partitionKey: {
                name: partitionKey,
                type: dynamodb.AttributeType.STRING
            },
            tableName: 'products',
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        const addProductLambda = new lambda.Function(this, 'addProduct', {
            code: new lambda.AssetCode('src'),
            handler: 'create.handler',
            runtime: lambda.Runtime.NODEJS_10_X,
            environment: {
                TABLE_NAME: dynoTable.tableName,
                PRIMARY_KEY: partitionKey
            }
        });

        const getProductLambda = new lambda.Function(this, 'getProduct', {
            code: new lambda.AssetCode('src'),
            handler: 'get-product.handler',
            runtime: lambda.Runtime.NODEJS_10_X,
            environment: {
                TABLE_NAME: dynoTable.tableName,
                PRIMARY_KEY: partitionKey
            }
        });

        const deleteProductLambda = new lambda.Function(this, 'deleteProduct', {
            code: new lambda.AssetCode('src'),
            handler: 'delete-product.handler',
            runtime: lambda.Runtime.NODEJS_10_X,
            environment: {
                TABLE_NAME: dynoTable.tableName,
                PRIMARY_KEY: partitionKey
            }
        });

        dynoTable.grantReadWriteData(addProductLambda);

        const gateway = new apigateway.RestApi(this, 'productsAPI', {
            restApiName: 'Products API'
        })

        const productsAPI = gateway.root.addResource('products')
        const addProductIntegration = new LambdaIntegration(addProductLambda);
        productsAPI.addMethod('POST', addProductIntegration);

        const specificProductAPI = productsAPI.addResource('{id}');
        const getProductIntegration = new LambdaIntegration(getProductLambda);
        specificProductAPI.addMethod('GET', getProductIntegration)

        const deleteProductIntegration = new LambdaIntegration(deleteProductLambda);
        specificProductAPI.addMethod('DELETE', deleteProductIntegration);


    }
}

const app = new cdk.App;
new GatewayLambdaDynoStack(app, 'Basic product store');
app.synth;