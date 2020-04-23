import { OAUTH_AUDIENCE } from "../common/constants";
import { OAUTH_CLIENT_PUBLIC_KEY } from "../common/constants";
import jwt from "jsonwebtoken";
import { AuthPolicy } from "./authPolicy";
import {
  CustomAuthorizerHandler,
  Context,
  CustomAuthorizerEvent,
  Callback,
  APIGatewayAuthorizerResult,
} from "aws-lambda";

/**
 * Authorizer function based on official AWS blueprint:
 * https://github.com/awslabs/aws-apigateway-lambda-authorizer-blueprints/blob/master/blueprints/nodejs/index.js
 * 
 * Reference to this authorizer set on `authorizer` field in serverless.yml.
 * This authorizer is called prior to any endpoint and allows or denies
 * access to it, based on external OAuth 2.0 IDP provider Bearer JWT
 * token, included in the request authorization header. The required environment
 * variables OAUTH_AUDIENCE and OAUTH_CLIENT_PUBLIC_KEY must be set.
 *
 * @param event
 * @param context
 */

export const authorizerFunc: CustomAuthorizerHandler = (
  event: CustomAuthorizerEvent,
  context: Context,
  callback: Callback<APIGatewayAuthorizerResult>
) => {
  //console.log("event", event); Enable for debugging only if really needed
  if (!event.authorizationToken) {
    return callback(new Error('No authorization token found in request header.'));
  }

  const tokenParts = event.authorizationToken.split(" ");
  const tokenValue = tokenParts[1];

  if (!(tokenParts[0].toLowerCase() === "bearer" && tokenValue)) {
    // 401 Unauthorized : No auth token!
    return callback("Unauthorized");
  }
  const options = {
    audience: OAUTH_AUDIENCE,
  };

  try {
    jwt.verify(
      tokenValue,
      OAUTH_CLIENT_PUBLIC_KEY,
      options,
      (verifyError, verifiedJwt) => {
        if (verifyError) {
          // 401 Unauthorized : Token not valid
          console.log(`Token invalid. ${verifyError}`);
          return callback("Unauthorized");
        }
        console.log("valid from customAuthorizer", verifiedJwt);
        let apiOptions: any = {};
        const tmp = event.methodArn.split(":");
        const apiGatewayArnTmp = tmp[5].split("/");
        const awsAccountId = tmp[4];
        const principalId = verifiedJwt.sub.split("|")[1];
        apiOptions.region = tmp[3];
        apiOptions.restApiId = apiGatewayArnTmp[0];
        apiOptions.stage = apiGatewayArnTmp[1];

        const policy: any = new AuthPolicy(
          principalId,
          awsAccountId,
          apiOptions
        );

        if (verifiedJwt.scope.indexOf("admins") > -1 || verifiedJwt.scope.indexOf("users:write") > -1) {
          // Alternatively use: policy.allowMethod(AuthPolicy.HttpVerb.PUT, "api/users*);
          //                    policy.allowMethod(AuthPolicy.HttpVerb.POST, "api/users*);
          //                    policy.allowMethod(AuthPolicy.HttpVerb.GET, "api/users*);
          //                    policy.allowMethod(AuthPolicy.HttpVerb.POST, "api/customers*); ...
          policy.allowAllMethods(); 
        } else {
          policy.allowMethod(AuthPolicy.HttpVerb.GET, "api/customers*");
          if (verifiedJwt.scope.indexOf("write:customers") > -1) {
            policy.allowMethod(AuthPolicy.HttpVerb.PUT, "api/customers/*");
            policy.allowMethod(AuthPolicy.HttpVerb.POST, "api/customers*");
          }
        }
        var authResponse: APIGatewayAuthorizerResult = policy.build();
        authResponse.context = {
          principalId: principalId, // $context.authorizer.key -> value
        };

        return callback(null, authResponse); // 403 Access denied : If policy do not allows method and resource.
      }
    );
  } catch (err) {
    console.log("catch error. Invalid token:", err, err.stack);
    context.fail("Unauthorized");
  }
};
