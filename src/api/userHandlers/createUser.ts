import "source-map-support/register";
import {
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
} from "aws-lambda";
import { CrmUser } from "../../classes/CrmUser";
import { passPolicyEnforce } from "../../common/auth0Helper";

/**
 * AWS Lambda Event handler to list users from IDP (Auth0)
 *
 * @param event
 */

export const createUser: APIGatewayProxyHandler = async function (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    body: "Missing params email and/or password.",
    statusCode: 400,
  };
  const { body: eventBody } = event;
  // validate params
  if (!eventBody) {
    return result;
  }
  const { email, password } = JSON.parse(eventBody);
  if (!email || !password) {
    return result;
  }
  try {
    const user: any = await CrmUser.createUser(
      email,
      password,
      passPolicyEnforce.strong
    );
    if (user) {
      result.statusCode = 200;
      result.body = JSON.stringify({
        email: user.email,
        created_at: user.created_at,
        user_id: user.user_id,
        nickname: user.nickname,
      });
    } else {
      throw new Error("Unknown internal error. User list empty.");
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
