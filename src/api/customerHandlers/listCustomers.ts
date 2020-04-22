import { Customer } from "../../classes/customer";
import {
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
} from "aws-lambda";
import "source-map-support/register";

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
    body: JSON.stringify([]),
    statusCode: 200,
  };
  try {
    const customerList: Customer[] = await Customer.listAll();
    result.body = JSON.stringify(customerList);
    return result;
  } catch (err) {
    result.statusCode = 500;
    result.body = JSON.stringify(err);
    console.log("List Customerws Error", {
      err,
      event,
    });
    return result;
  }
};
