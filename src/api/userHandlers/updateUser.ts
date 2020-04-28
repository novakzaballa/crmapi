import "source-map-support/register";
import {
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
} from "aws-lambda";
import { CrmUser } from "../../classes/CrmUser";
import { passPolicyEnforce } from "../../common/auth0Helper";

/**
 * AWS Lambda Event handler to update a user in the IDP (Auth0)
 *
 * @param event
 */

export const updateUser: APIGatewayProxyHandler = async function (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    body:
      "Required at least on of these params given_name, family_name, password or password.",
    statusCode: 400,
  };
  const { body: eventBody } = event;
  // validate params
  if (!eventBody) {
    return result;
  }
  let userId: string = "";
  if (
    !event.pathParameters ||
    event.queryStringParameters ||
    !event.pathParameters.id
  ) {
    result.body = "Wrong parameters or missing {id} in request path";
    return result;
  } else {
    userId = `${event.pathParameters.id}`;
  }
  try {
    const { email, password, given_name, family_name, blocked } = JSON.parse(
      eventBody
    );
    if (email) {
      result.body = "User email can not be changed.";
      return result;
    }
    if (!password && !given_name && !family_name && !blocked) {
      return result;
    }
    const user: any = await CrmUser.UpdateIdpUser(
      userId,
      password,
      given_name,
      family_name,
      blocked,
      passPolicyEnforce.strong
    );
    if (user) {
      result.statusCode = 200;
      result.body = JSON.stringify({
        email: user.email,
        given_name: user.given_name,
        family_name: user.family_name,
        created_at: user.created_at,
        user_id: user.user_id.slice("auth0|".length),
        nickname: user.nickname,
        blocked: user.blocked
      });
    } else {
      throw new Error("Unknown internal error. User list empty.");
    }
  } catch (err) {
    const errmsg = `${err}`.toLowerCase();
    if (errmsg.includes("json")) {
      result.statusCode = 400;
      result.body = JSON.stringify("Malformed JSON in POST body");
    } else if (errmsg.includes("password")) {
      result.statusCode = 500;
    }
    result.body = `${err}`;
    console.log("Update user error:", {
      err,
      event,
    });
  }
  return result;
};
