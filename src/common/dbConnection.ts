import { IS_OFFLINE, DYNAMODB_ENDPOINT, AWS_REGION } from './constants';
import { DynamoDB } from 'aws-sdk'

export function getDynamoCli() : DynamoDB {
    let dynamoDb: DynamoDB;
    if (IS_OFFLINE === 'true') {
        dynamoDb = new DynamoDB({
          region: 'localhost',
          endpoint: DYNAMODB_ENDPOINT,
        });
      } else {
        dynamoDb = new DynamoDB({region: AWS_REGION});
      }
      return dynamoDb;
}
