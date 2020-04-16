import { Customer } from "../../classes/customer";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import "source-map-support/register";

/**
 * 
 * @summary AWS Lambda Event handler to put a new or updated item into Customer DynamoDB table. 
 * @param event APIGatewayProxyEvent containing the HTTP headers and request payload (body)
 * 
 */
export async function putCustomer(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { body: eventBody } = event;
  const result: APIGatewayProxyResult = {
    body: "Empty request body",
    statusCode: 400,
  };
  if (!eventBody) {
    return result;
  }
  try {
    const customer = new Customer();
    Object.assign(customer, JSON.parse(eventBody));
    if (customer) {
      // Add auditing data
      customer.CreateDate = new Date().toISOString();
      customer.CreateUser = "HardcodedTestUser"; // TODO: call a getCurrentUser function

      // Validate against schema
      let valid: any = await customer.validateCustomer();
      if (valid === "OK") {
        const customerData: Customer = await customer.createCustomer();
        result.body = JSON.stringify(customerData);
        result.statusCode = 200;
        return result;
      } else {
        result.body = JSON.stringify(valid);
      }
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
