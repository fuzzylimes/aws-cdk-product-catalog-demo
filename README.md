## Notes
* Using a single 3rd party dependency, `uuid`, for two reasons:
    * want to ensure truly unique, non-incrementing, id values
    * experience handling 3rd party dependency within the deployment

### Setup
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
3. Not sure when this should be done, but before you try to deploy, you must run `cdk bootstrap` to setup your environment, [per the documentation](https://docs.aws.amazon.com/cdk/latest/guide/bootstrapping.html)

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
    * What I found, and maybe I'm just reading a lot of old stuff and things have more recently changed, is that all of this work must be done by hand, or requires some 3rd party libraries

### Resources
* [aws-samples github](https://github.com/aws-samples/aws-cdk-examples/tree/master/typescript/api-cors-lambda-crud-dynamodb)
    * This is a pretty good example of exactly what was asked for, but it took a lot of effort to get even a subportion of the demo working