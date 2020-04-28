import { Customer } from "../../classes/Customer";
import {
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
} from "aws-lambda";
import "source-map-support/register";

/**
 * AWS Lambda Event handler to add a photo in S3 to an existing Customer
 *
 * @param event APIGatewayProxyEvent
 */

export const getCustomerPhoto: APIGatewayProxyHandler = async function (
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
  // try get the customer with the corresponding id
  try {
    const customer: Customer = await Customer.getOne(customerId);
    if (customer) {
      // If found try to get the customer photo if exists
      const response = await customer.getPhoto();
      result.statusCode = 200;
      result.headers = {['content-type'] : 'image/jpeg'};
      result.body = response;
      result.isBase64Encoded = true;
      return result;
    }
  } catch (err) {
    if (err.name === "ItemNotFoundException") {
      result.statusCode = 404;
      result.body = JSON.stringify({});
    } else {
      result.statusCode = 500;
      result.body = JSON.stringify(err);
    }
    console.log("Get customer photo error", {
      err,
      event,
    });
    return result;
  }
};
