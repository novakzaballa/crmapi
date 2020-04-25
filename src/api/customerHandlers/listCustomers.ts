import { Customer } from "../../classes/Customer";
import {
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
} from "aws-lambda";
import "source-map-support/register";
import { isNumber } from "util";

/**
 * AWS Lambda Event handler to list Customers from Database.
 *
 * @param event APIGatewayProxyEvent containing the HTTP headers and request
 * payload (body)
 */

export const listCustomers: APIGatewayProxyHandler = async function (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    body: `Missing parameter pageSize, not a number, or > 50. Param startKey param 
      is optional, but if present must be a valid key provided by a previous 
      call to this endpoint.`,
    statusCode: 400,
  };
  // validate querystring params
  if (
    event.queryStringParameters &&
    (!event.queryStringParameters.pageSize ||
      !isNumber(parseInt(event.queryStringParameters.pageSize)) ||
      parseInt(event.queryStringParameters.pageSize) > 50)
  ) {
    return result;
  }
  try {
    const pageSize: number =
      event.queryStringParameters && event.queryStringParameters.pageSize
        ? parseInt(event.queryStringParameters.pageSize)
        : 50;
    const startKey: string = event.queryStringParameters && event.queryStringParameters.startKey
      ? event.queryStringParameters.startKey
      : null;
    const customerList: Customer[] = await Customer.listAll(pageSize, startKey);
    result.body = JSON.stringify(customerList);
    return result;
  } catch (err) {
    result.statusCode = 500;
    result.body = `Error interno: ${err}`;
    console.log("List Customerws Error", {
      err,
      event,
    });
    return result;
  }
};
