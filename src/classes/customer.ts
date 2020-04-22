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
  rangeKey,
} from "@aws/dynamodb-data-mapper-annotations";
import { CUSTOMER_TABLE, AWS_REGION } from "../common/constants";
import { DataMapper } from "@aws/dynamodb-data-mapper";
import { getDynamoCli } from "../common/dbConnection";
import { DynamoDB } from "aws-sdk";

@table(CUSTOMER_TABLE)
export class Customer {
  // GroupId is the partition key. Here used to balance the db requests load, 
  // however can be used in future upgrades to handle multitenancy.
  @hashKey()
  GroupId!: String;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  @rangeKey()
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
  CreatedBy!: String;

  @IsString()
  @IsISO8601()
  @IsNotEmpty()
  @attribute()
  CreatedAt!: String;

  @IsString()
  @IsOptional()
  @attribute()
  UpdatedBy?: String;

  @IsString()
  @IsISO8601()
  @IsOptional()
  @attribute()
  UpdatedAt?: String;

  @IsString()
  @IsOptional()
  @attribute()
  PhotoURL?: String;

  /**
   * @abstract: Adds a new customer to Customers table.
   * GroupId(S), CustomerId(S), Name(S), Surname(S) Email(S) Age(N) and Phone(S) are required.
   */
  async createOrUpdate(): Promise<Customer> {
    console.log("Table:", CUSTOMER_TABLE, " Region:", AWS_REGION);
    this.GroupId = this.CustomerId.slice(-1);
    const dynamo: DynamoDB = getDynamoCli();
    const mapper = new DataMapper({ client: dynamo });
    const result = await mapper.put<Customer>({ item: this });
    return result;
  }

  static async getOne(customerId): Promise<Customer> {
    console.log("Table:", CUSTOMER_TABLE, " Region:", AWS_REGION);
    if (!customerId) {
      return null;
    }
    const groupId = customerId.slice(-1);
    const dynamo: DynamoDB = getDynamoCli();
    const mapper = new DataMapper({ client: dynamo });
    const customer: Customer = Object.assign<Customer, any>(new Customer(), {
      GroupId: groupId,
      CustomerId: customerId,
    });
    const result = await mapper.get<Customer>(customer);
    return result;
  }

  static async listAll(): Promise<Customer[]> {
    console.log("Table:", CUSTOMER_TABLE, " Region:", AWS_REGION);
    const dynamo: DynamoDB = getDynamoCli();
    const mapper = new DataMapper({ client: dynamo });
    const result = new Array();
    for await (const item of mapper.scan<Customer>(Customer)) {
      result.push(item);
    }

    return result;
  }

  /**
   * @abstract validates the schema and request payload
   * @returns "OK" if validated otherwise returns errors object containing detailed validation info.
   */

  async validateSchema() {
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
