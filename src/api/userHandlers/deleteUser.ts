import "source-map-support/register";
import {
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
} from "aws-lambda";
import { CrmUser } from "../../classes/CrmUser";

/**
 * AWS Lambda Event handler to set the role of a user in IDP (Auth0)
 *
 * @param event
 */

export const deleteUser: APIGatewayProxyHandler = async function (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    body: "Body must be empty",
    statusCode: 400,
  };
  const { body: eventBody } = event;
  // validate params
  if (eventBody) {
    return result;
  }
  let userId: string = "";
  if (
    !event.pathParameters ||
    event.queryStringParameters ||
    !event.pathParameters.id
  ) {
    return result;
  } else {
    userId = `${event.pathParameters.id}`;
  }
  try {
    const voidResult: any = await CrmUser.delete(userId);
    if (!voidResult) {
      result.statusCode = 200;
      result.body = JSON.stringify("User deleted.");
    } else {
      throw new Error("Unknown internal error trying to delete user.");
    }
  } catch (err) {
    if (`${err}`.indexOf("Password") < 0) {
      result.statusCode = 500;
    }
    result.body = `${err}`;
    console.log("Delete user error:", {
      err,
      event,
    });
  }
  return result;
};
