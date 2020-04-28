import "source-map-support/register";
import {
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
} from "aws-lambda";
import { CrmUser } from "../../classes/CrmUser";

/**
 * AWS Lambda Event handler to authenticate users against external IDP (Auth0)
 *
 * @param event Body must contain username(email) and password in json format
 */

export const authenticateUser: APIGatewayProxyHandler = async function (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    body: "Missing params email and/or password.",
    statusCode: 400,
  };
  let { body: eventBody } = event;
  // validate params
  if (!eventBody) {
    return result;
  }
  if (
    eventBody.charAt(0) !== "{" &&
    eventBody.includes("username") &&
    eventBody.includes("password")
  ) {
    var bodyParms = decodeURIComponent(eventBody).split("&").reduce(
      (obj, item) => {
        const pair = item.split("=");
        return {
          [pair[0]==="username" ? "email": pair[0]]: pair[1],
          ...obj,
        };
      },
      {}
    );
  }
  var { email, password } = (bodyParms)? bodyParms : JSON.parse(eventBody);
  if (!email || !password) {
    return result;
  }
  try {
    const user: any = await CrmUser.authenticateUser(email, password);
    if (user) {
      result.statusCode = 200;
      result.body = JSON.stringify({ user });
    } else {
      throw new Error("Unknown internal error. User list empty.");
    }
  } catch (err) {
    if (err.message.indexOf("assword") < 0) {
      result.statusCode = 500;
    }
    result.statusCode = 401
    result.body = `${err}`;
    console.log("Authenticate user error:", {
      err,
      event,
    });
  }
  return result;
};
