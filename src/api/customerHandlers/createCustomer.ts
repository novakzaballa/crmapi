import { Customer } from "../../classes/Customer";
import {
  APIGatewayProxyResult,
  APIGatewayProxyWithLambdaAuthorizerHandler,
  APIGatewayProxyWithLambdaAuthorizerEvent,
} from "aws-lambda";
import "source-map-support/register";

export interface TAuthorizerContext {
  principalId: String;
}

/**
 * AWS Lambda Event handler to put a new or updated item into Customer DynamoDB
 * table.
 *
 * @param event APIGatewayProxyWithLambdaAuthorizerEvent<TAuthorizerContext>
 * containing the HTTP headers and request payload (body) and the principalId
 * or userid parsed by the authorizer and stored in the TAuthorizerContext
 */

export const createCustomer: APIGatewayProxyWithLambdaAuthorizerHandler<TAuthorizerContext> = async function (
  event: APIGatewayProxyWithLambdaAuthorizerEvent<TAuthorizerContext>
): Promise<APIGatewayProxyResult> {
  const { body: eventBody } = event;
  const result: APIGatewayProxyResult = {
    body: "Empty request body",
    statusCode: 400,
  };
  if (!eventBody) {
    return result;
  }
  try {
    const customer = new Customer();
    Object.assign(customer, JSON.parse(eventBody));
    if (customer) {
      if (customer.CustomerId || customer.GroupId){
        result.statusCode = 400;
        result.body = JSON.stringify({"Err":"GroupId and CustomerId can not be set."});
        return result;
      }
    // Validate against schema
      const valid: any = await customer.validateSchema();
      if (valid === "OK") {
        const customerData: Customer = await customer.createOrUpdate(event.requestContext.authorizer.principalId);
        result.body = JSON.stringify(customerData);
        result.statusCode = 201;
        return result;
      } else {
        result.body = JSON.stringify(valid);
      }
    }
    return result;
  } catch (err) {
    result.statusCode = 500;
    result.body = JSON.stringify(err);
    console.log("Create customer error", {
      err,
      event,
    });
    return result;
  }
};
