import "source-map-support/register";
import {
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
} from "aws-lambda";
import { CrmUser } from "../../classes/CrmUser";
import { passPolicyEnforce } from "../../common/auth0Helper";

/**
 * AWS Lambda Event handler to create a user in the IDP (Auth0)
 *
 * @param event
 */

export const createUser: APIGatewayProxyHandler = async function (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    body: "Missing params given_name, family_name, email or password.",
    statusCode: 400,
  };
  const { body: eventBody } = event;
  // validate params
  if (!eventBody) {
    return result;
  }
  try {
    const { email, password, given_name, family_name } = JSON.parse(eventBody);
    if (!email || !password || !given_name || !family_name) {
      return result;
    }
    const user: any = await CrmUser.createUser(
      email,
      password,
      given_name,
      family_name,
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
    console.log("Create user error:", {
      err,
      event,
    });
  }
  return result;
};
