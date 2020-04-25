import { Customer } from "../../classes/Customer";
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
 * AWS Lambda Event handler to update an existing customer in DynamoDB
 *
 * @param event APIGatewayProxyWithLambdaAuthorizerEvent<TAuthorizerContext>
 * containing the HTTP headers and request payload (body) and the principalId
 * or userid parsed by the authorizer and stored in the TAuthorizerContext
 */

export const updateCustomer: APIGatewayProxyWithLambdaAuthorizerHandler<TAuthorizerContext> = async function (
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
      // If found try to update the item
      try {
        let groupId = customer.GroupId;
        Object.assign(customer, JSON.parse(eventBody));
        if (customer.CustomerId !== customerId || customer.GroupId !== groupId){
          result.statusCode = 400;
          result.body = JSON.stringify({"Err":"GroupId and CustomerId can not be modified."});
          return result;
        }
        // Add auditing data
        customer.UpdatedAt = new Date().toISOString();
        customer.UpdatedBy = event.requestContext.authorizer.principalId;
        // Validate against schema
        let validateMsg: any = await customer.validateSchema();
        if (validateMsg === "OK") {
          const customerData: Customer = await customer.createOrUpdate();
          result.body = JSON.stringify(customerData);
          result.statusCode = 202;
          return result;
        } else {
          result.statusCode = 400;
          result.body = JSON.stringify(validateMsg);
        }
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
