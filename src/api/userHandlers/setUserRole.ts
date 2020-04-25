import "source-map-support/register";
import {
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
} from "aws-lambda";
import { CrmUser } from "../../classes/CrmUser";

/**
 * AWS Lambda Event handler to list users from IDP (Auth0)
 *
 * @param event
 */

export const setUserRole: APIGatewayProxyHandler = async function (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    body: "Missing params email and/or role. role must be either 'admin' or 'user'",
    statusCode: 400,
  };
  const { body: eventBody } = event;
  // validate params
  if (!eventBody) {
    return result;
  }
  const { email, role } = JSON.parse(eventBody);
  if (!email || !role || (role !== "admin" && role !== "user")) {
    return result;
  }
  try {
    const voidResult: any = await CrmUser.setUserRole(email,role);
    if (!voidResult) {
      result.statusCode = 200;
      result.body = JSON.stringify("Role update done.");
    } else {
      throw new Error("Unknown internal error trying to set role.");
    }
  } catch (err) {
    if (`${err}`.indexOf("Password") < 0) {
      result.statusCode = 500;
    }
    result.body = `${err}`;
    console.log("CreateUserApiError:", {
      err,
      event,
    });
  }
  return result;
};
