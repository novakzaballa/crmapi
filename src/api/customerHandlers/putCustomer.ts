import { Customer } from "../../classes/customer";
import {
  APIGatewayProxyResult,
  APIGatewayProxyWithLambdaAuthorizerHandler,
  Context,
  APIGatewayProxyWithLambdaAuthorizerEvent,
} from "aws-lambda";
import "source-map-support/register";

interface TAuthorizerContext extends Context {
  principalId: String;
}

/**
 * AWS Lambda Event handler to put a new or updated item into Customer DynamoDB
 * table.
 *
 * @param event APIGatewayProxyEvent containing the HTTP headers and request
 * payload (body)
 */

export const putCustomer: APIGatewayProxyWithLambdaAuthorizerHandler<TAuthorizerContext> = async function (
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
      // Add auditing data
      customer.CreatedAt = new Date().toISOString();
      customer.CreatedBy = event.requestContext.authorizer.principalId; 
      // Validate against schema
      let valid: any = await customer.validateCustomer();
      if (valid === "OK") {
        const customerData: Customer = await customer.createCustomer();
        result.body = JSON.stringify(customerData);
        result.statusCode = 200;
        return result;
      } else {
        result.body = JSON.stringify(valid);
      }
    }
    return result;
  } catch (err) {
    result.statusCode = 500;
    result.body = JSON.stringify(err);
    console.log("create Error", {
      err,
      event,
    });
    return result;
  }
};
