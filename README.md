<!--
authorLink: 'https://github.com/novakzaballa'
authorName: 'Novak Zaballa'
Date: 'Apr 16 2020'
-->

# CRM REST API code example - Novak Zaballa

The scope of this sample code project is users and customers management of a CRM.

This project has been built with Serverless Framework and targeting AWS lambda with Node.js + DynamoDB. You can deploy the proyect to AWS installing and configuring serverless, or you can run the services locally, using the [serverless-offline](https://github.com/dherault/serverless-offline) plugin, which is included. The offline configuration also includes a local DynamoDB instance is provided by the [serverless-dynamodb-local](https://github.com/99xt/serverless-dynamodb-local) plugin.

## Setup and test locally

To test your service locally, without having to deploy it first, you will need node.js (tested with v13.7.0) and follow the steps below in the root directory of the project.

```bash
npm install
serverless dynamodb install
serverless dynamodb start --migrate
```

The --migrate option creates the schema. Ctl+C to stop the local DynamoDB. The DB schema and data will be lost since by default the local DB is stored in memory.

## Run service offline

To test the project locally use:

```bash
serverless offline start
```

Alternatively you can debug the project with VS Code. This repository includes the launch.json file needed by VS Code to run and debug this serverless project locally. How ever dynamodb needs to be started.

## Configure and Deploy service to AWS

For production you will need to configure authetication the OAuth 2 provider. Replace the file oauth2_public_key.pem in the root directory with the right public signature PEM file. Also cnfigure the file secrets.json with the corresponding OAUTH_AUDIENCE value.

To deploy the service you need an account in AWS. Use the following command:

```bash
serverless deploy -v
```  

### Authorization for testing

Every request must include an authorization header containing the OAuth Bearer token. For testing purposes currently an Auth0 account is in use,  The request content type must be application/json as per the examples below. While in dev stage, I will provide valid access token of quarklap user (with only customer priveleges and not users admin permissions) via slack channel.

### Live Demo

You can test locally following the former instructions, however it is also a live test with the following endpoints published in my AWS account for testing purposes:

#### Authenticate User Credentials And get Access Token

- POST - <https://mspjeecyw1.execute-api.us-east-1.amazonaws.com/dev/api/authorize>

Email address and password for testing purposes will be shared through email or slack.

#### User Management

- GET - <https://mspjeecyw1.execute-api.us-east-1.amazonaws.com/dev/api/users>
- POST - <https://mspjeecyw1.execute-api.us-east-1.amazonaws.com/dev/api/users>
- POST - <https://mspjeecyw1.execute-api.us-east-1.amazonaws.com/dev/api/users/role>

#### Customer Management

- POST - <https://mspjeecyw1.execute-api.us-east-1.amazonaws.com/dev/api/customers>
- PUT - <https://mspjeecyw1.execute-api.us-east-1.amazonaws.com/dev/api/customers/{id}>
- GET - <https://mspjeecyw1.execute-api.us-east-1.amazonaws.com/dev/api/customers/{id}>
- GET - <https://mspjeecyw1.execute-api.us-east-1.amazonaws.com/dev/api/customers>
- PUT - <https://mspjeecyw1.execute-api.us-east-1.amazonaws.com/dev/api/customers/{id}/photo>
- GET - <https://mspjeecyw1.execute-api.us-east-1.amazonaws.com/dev/api/customers/{id}/photo>

### Live Testing with Swagger UI

[Click here to see API documentation and test iit n Swagger UI](https://app.swaggerhub.com/apis-docs/novakzaballa/crm-api_v_1_0_0/1.0)

## Usage Examples

You can test locally the create, list, update, or delete customers endpoints of the CRM using postman or curl commands using the following payload exmaples: (currently only is implemented the add and modify customers endpoint).

<!--
```bash
curl -X POST -H "Content-Type:application/json" http://localhost:3000/todos --data '{ "text": "Learn Serverless" }'

-->

### Create a Customer (Validation implemented)

Example Succesfull Request Payload:

```bash
{
"Name":"Paul Ray",
"Surname":"Ghost",
"Phone":"(122)23878 343",
"Email":"pghost@midominio.com",
"Age":16
}
```

Example Result (Status 200 - OK):

```bash
{
"GroupId": "4",
"CustomerId": "4532324",
"Name": "Paul Ray",
"Surname": "Ghost",
"Age": 16,
"Email": "pghost@midominio.com",
"Phone": "(122)23878 343",
"CreateUser": "HardcodedTestUser",
"CreateDate": "2020-04-16T03:51:37.626Z"
}
```  

Example Rejected Request Payload:

```bash
    {
      "Name":"John",
      "Surname":"Wayne",
      "Phone":"(123) 22388 765",
      "Email":"jwaynemidominio.com",
      "Age":2
}
```  

Example validation error result (Status 400 - Bad Request):

```bash
[
    {
        "target": {
            "CustomerId": 3644565,
            "Name": "John",
            "Surname": "Wayne",
            "Phone": "(123) 22388 765",
            "Email": "jwaynemidominio.com",
            "Age": 2,
            "CreateDate": "2020-04-16T11:34:53.636Z",
            "CreateUser": "HardcodedTestUser"
        },
        "value": 3644565,
        "property": "CustomerId",
        "children": [],
        "constraints": {
            "isString": "CustomerId must be a string"
        }
    },
    {
        "target": {
            "CustomerId": 3644565,
            "Name": "John",
            "Surname": "Wayne",
            "Phone": "(123) 22388 765",
            "Email": "jwaynemidominio.com",
            "Age": 2,
            "CreateDate": "2020-04-16T11:34:53.636Z",
            "CreateUser": "HardcodedTestUser"
        },
        "value": 2,
        "property": "Age",
        "children": [],
        "constraints": {
            "min": "Age must not be less than 16"
        }
    },
    {
        "target": {
            "CustomerId": 3644565,
            "Name": "John",
            "Surname": "Wayne",
            "Phone": "(123) 22388 765",
            "Email": "jwaynemidominio.com",
            "Age": 2,
            "CreateDate": "2020-04-16T11:34:53.636Z",
            "CreateUser": "HardcodedTestUser"
        },
        "value": "jwaynemidominio.com",
        "property": "Email",
        "children": [],
        "constraints": {
            "isEmail": "Email must be an email"
        }
    }
]
```
