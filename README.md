# Simple Product Catalog
Project explores how one could go about creating a simple product catalog using AWS serverless technologies. The
full stack includes:

* CDK - handles component orchestration
* API Gateway - makes our lambda functions accessible
* Lambda - runs our bite-sized rest controllers and interfaces with DB
* DynamoDB - stores our product data

## How to Run
1. Ensure you've completed the steps mentioned in the `SETUP` section below.
2. Ensure you have cdk installed globally: `npm i -g aws-cdk`
3. Run `npm ci` to install dev dependencies
4. Run `npm build` to compile ts and download lambda dependencies
5. Run `cdk diff` to check what will be deployed
6. Run `cdk deploy` and verify the changes to start deployment
    * You can verify your deployment from the `CloudFormation` screen on aws console
7. Begin using your APIs via the URL provided in your terminal output.

> When done, run `cdk destroy` to remove all configured resources from your account.

## Setup
Before you can use `cdk`, there are a few things that you're expected to have already done:

1. Setup an `IAM` account, with all needed permissions. The final permission list I ended up having to use was:
    * IAMFullAccess
    * AmazonS3FullAccess
    * AmazonAPIGatewayInvokeFullAccess
    * AmazonAPIGatewayAdministrator
    * AmazonDynamoDBFullAccess
    * AWSCloudFormationFullAccess
    * AWSLambda_FullAccess
2. You MUST setup your local machine to use these `IAM` credentials, [per the documentation](https://docs.aws.amazon.com/cdk/latest/guide/cli.html#cli-environment).
3. You must run `cdk bootstrap` to setup your environment, [per the documentation](https://docs.aws.amazon.com/cdk/latest/guide/bootstrapping.html)

## Notes
* Using a single 3rd party dependency, `uuid`, for two reasons:
    * want to ensure truly unique, non-incrementing, id values
    * experience handling 3rd party dependency within the deployment
* Using scan to search for tags vs query
    * Unable to make an embedded object field an index, which is needed in order to do a query
    * I guess a potential alternative would be to split the tables, and have an intermediary table that would map your item to individual tags

### Limitations
There is a known limitation that allows for duplicate products to be created
* In order to handle duplicates, product name would need to be normalized to a standard form that could be checked against
* I spent a lot of time researching to see what the correct way to handle this in DynamoDB, and it appears that what's most commonly suggested is to create a GlobalSecondaryIndex for the normalized name. But at the same time, it appears that this wouldn't be needed, and could still be achieved using a scan (like we're doing with the tag values).

### Pitfalls
1. Initial setup
    * As with most AWS documentation, it's hard to know where to start. Evidently I missed the part that discussed how to setup your environment first
    * Lost quite a bit of time here guessing as to which permissions I needed before it finally worked
2. Dependencies in lambda functions
    * node_modules at top level will not be included in deployment, so the packages will not be present when the functions start up
    * To solve this, I [found a recommendation](https://github.com/aws-samples/aws-cdk-examples/issues/110) from a few years ago to create a separate package file inside the lambda folder with ONLY the dependencies need.
    * This would then be installed prior to the final `cdk deploy`
3. I really wanted to have all of my compiled js files placed into an external directory as it seemed cluttered
    * I eventually ended up giving up on this and leaving things how they were - as only the generated files were placed in the folder, I would still need to piecemeal together the remaining files.
    * There's probably a better way to do this to maintain a cleaner codebase
4. Thinking that Typescript was able to handle types at runtime
    * Coming from a statically typed world, I had assumed I would easily be able to tell the lambda functions that they would be receiving a body of type `xyz` and have it automatically serialized to that object type.
    * What I found, and maybe I'm just reading a lot of old stuff and things have more recently changed, is that all of this work must be done by hand, or requires some 3rd party libraries.

### Resources
* [aws-samples github](https://github.com/aws-samples/aws-cdk-examples/tree/master/typescript/api-cors-lambda-crud-dynamodb)
    * This is a pretty good example of the desired application, but it took a lot of effort to get even a portion of the demo working
* [API Gateway event object](https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html) for handling event in lambda method
* Source code (honestly found it more useful than AWS documentation 99% of the time)