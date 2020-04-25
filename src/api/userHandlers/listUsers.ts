import "source-map-support/register";
import {
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
} from "aws-lambda";
import { CrmUser } from "../../classes/CrmUser";
import { isNumber } from "util";

/**
 * AWS Lambda Event handler to list users from IDP (Auth0)
 *
 * @param event
 */

export const listUsers: APIGatewayProxyHandler = async function (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    body:
      "Missing params per_page and/or page, or not numbers, or per_page > 50.",
    statusCode: 400,
  };
  // validate querystring params
  if (
    !event.queryStringParameters ||
    !event.queryStringParameters.per_page ||
    !event.queryStringParameters.page ||
    !isNumber(parseInt(event.queryStringParameters.per_page)) ||
    !isNumber(parseInt(event.queryStringParameters.page)) ||
    parseInt(event.queryStringParameters.per_page) > 50
  ) {
    return result;
  }
  try {
    const per_page = parseInt(event.queryStringParameters.per_page);
    const page = parseInt(event.queryStringParameters.page);
    const userList: any = await CrmUser.listAll(per_page, page);
    if (userList) {
      result.statusCode = 200;
      result.body = JSON.stringify(userList);
    } else {
      throw new Error("Unknown internal error. User list empty.");
    }
  } catch (err) {
    result.statusCode = 500;
    result.body = JSON.stringify(err);
    console.log("ListUsersApiError:", {
      err,
      event,
    });
  }
  return result;
};
