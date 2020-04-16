/**
 * Customer Class
 * Apr 14 2020
 */

import {
  validateOrReject,
  IsString,
  IsInt,
  IsEmail,
  Min,
  Max,
  IsNotEmpty,
  IsDefined,
  IsOptional,
  IsISO8601,
} from "class-validator";
import {
  attribute,
  hashKey,
  table,
} from "@aws/dynamodb-data-mapper-annotations";
import { CUSTOMER_TABLE, AWS_REGION } from "../common/constants";
import { DataMapper } from "@aws/dynamodb-data-mapper";
import { getDynamoCli } from "../common/dbConnection";
import { DynamoDB } from "aws-sdk";

@table(CUSTOMER_TABLE)
export class Customer {
  @hashKey()
  GroupId!: String;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  @attribute()
  CustomerId!: String;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  @attribute()
  Name!: String;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  @attribute()
  Surname!: String;

  @IsInt()
  @Min(16)
  @Max(110)
  @IsDefined()
  @IsNotEmpty()
  @attribute()
  Age!: Number;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @attribute()
  Email!: String;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  @attribute()
  Phone?: String;

  @IsString()
  @IsNotEmpty()
  @attribute()
  CreateUser!: String;

  @IsString()
  @IsISO8601()
  @IsNotEmpty()
  @attribute()
  CreateDate?: String;

  @IsString()
  @attribute()
  @IsOptional()
  PhotoURL?: String;

  /**
   * @abstract: Adds a new customer to Customers table.
   * GroupId(S), CustomerId(S), Name(S), Surname(S) Email(S) Age(N) and Phone(S) are required.
   */
  async createCustomer(): Promise<Customer> {
    console.log("Table:", CUSTOMER_TABLE, " Region:", AWS_REGION);
    this.GroupId = this.CustomerId.slice(-1);
    const dynamo: DynamoDB = getDynamoCli();
    const mapper = new DataMapper({ client: dynamo });
    const result = await mapper.put<Customer>({ item: this });
    return result;
  }

  /**
   * @abstract validates the schema and request payload
   * @returns "OK" if validated otherwise returns errors object containing detailed validation info.
   */

  async validateCustomer() {
    try {
      await validateOrReject(this);
    } catch (errors) {
      console.log(
        "Caught promise rejection (validation failed). Errors: ",
        errors
      );
      return errors;
    }
    return "OK";
  }
}
