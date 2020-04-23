import { Customer } from "../../classes/customer";
import {
  APIGatewayProxyResult,
  APIGatewayProxyWithLambdaAuthorizerHandler,
  APIGatewayProxyWithLambdaAuthorizerEvent,
} from "aws-lambda";
import "source-map-support/register";

interface TAuthorizerContext {
  principalId: String;
}

/**
 * AWS Lambda Event handler to add a photo in S3 to an existing Customer
 *
 * @param event APIGatewayProxyWithLambdaAuthorizerEvent<TAuthorizerContext>
 * containing the HTTP headers and photo data (Base64 encoded) in the request 
 * body and userid parsed by the authorizer in the TAuthorizerContext.
 */

export const addCustomerPhoto: APIGatewayProxyWithLambdaAuthorizerHandler<TAuthorizerContext> = async function (
  event: APIGatewayProxyWithLambdaAuthorizerEvent<TAuthorizerContext>
): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    body: "Empty request body",
    statusCode: 400,
  };
  const { body: eventBody } = event;
  if (!eventBody) {
    return result;
  }
  let customerId: String = "";
  if (
    !event.pathParameters ||
    event.queryStringParameters ||
    !event.pathParameters.id
  ) {
    return result;
  } else {
    customerId = `${event.pathParameters.id}`;
  }
  // try get the item to be updated
  try {
    const customer: Customer = await Customer.getOne(customerId);
    if (customer) {
      // If found try to update the customer photo with the data uploaded
      try {
        customer.UpdatedAt = new Date().toISOString();
        customer.UpdatedBy = event.requestContext.authorizer.principalId;
        customer.PhotoURL = (event.headers.Host.indexOf('localhost') > -1 ? "http://" : "https://") + event.headers.Host + event.path;
        const customerData = (await customer.addPhoto(eventBody)).PhotoURL;
        console.log(customerData);
        // Add auditing data
        // Validate against schema
        result.body = JSON.stringify(customerData);
        result.statusCode = 201;
        return result;
      } catch (err) {
        result.statusCode = 500;
        result.body = JSON.stringify(err);
        console.log("create Error", {
          err,
          event,
        });
        return result;
      }
    }
  } catch (err) {
    if (err.name === "ItemNotFoundException") {
      result.statusCode = 404;
      result.body = JSON.stringify({});
    } else {
      result.statusCode = 500;
      result.body = JSON.stringify(err);
    }
    console.log("Get Item Error", {
      err,
      event,
    });
    return result;
  }
};
