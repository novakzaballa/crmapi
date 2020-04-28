import { Customer } from "../../classes/Customer";
import {
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
} from "aws-lambda";
import "source-map-support/register";

/**
 * AWS Lambda Event handler to get one Customer from DynamoDB table.
 *
 * @param event APIGatewayProxyWithLambdaAuthorizerEvent<TAuthorizerContext>
 * containing the HTTP headers and request payload (body) and the principalId
 * or userid parsed by the authorizer and stored in the TAuthorizerContext
 */

export const deleteCustomer: APIGatewayProxyHandler = async function (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    body: "Bad Request.",
    statusCode: 400,
  };
  let customerId: String = "";
  if (
    !event.pathParameters ||
    event.queryStringParameters ||
    !event.pathParameters.id
  ) {
    return result;
  } else {
    customerId = `${event.pathParameters.id}`;
  }
  try {
    const customer: Customer = await Customer.getOne(customerId);
    if (customer) {
      const deleted = await customer.delete();
      result.statusCode = 200;
      result.body = JSON.stringify(deleted);
    }
    else {
        result.statusCode = 404;
        result.body = JSON.stringify("");
    }
  } catch (err) {
    if (err.name === "ItemNotFoundException") {
      result.statusCode = 404;
      result.body = "";
    } else {
      result.statusCode = 500;
      result.body = JSON.stringify(err);
    }
    console.log("Delete customer error", {
      err,
      event,
    });
  }
  return result;
};
