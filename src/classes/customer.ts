/**
 * Customer Class
 * Apr 14 2020
 */
import { ScanOptions } from "@aws/dynamodb-data-mapper";

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
import {
  CUSTOMER_TABLE,
  AWS_REGION,
  S3_BUCKET_NAME,
} from "../common/constants";
import { getDataMapper } from "../common/dbConnection";
import { S3 } from "aws-sdk";
import { Base64EncodedString } from "aws-sdk/clients/elastictranscoder";

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
    console.log(
      "Customer.createOrUpdate Table:",
      CUSTOMER_TABLE,
      " Region:",
      AWS_REGION
    );
    this.GroupId = this.CustomerId.slice(-1);
    const mapper = getDataMapper();
    const result = await mapper.put<Customer>({ item: this });
    return result;
  }

  /**
   * Add photo to an existing customer
   * @param photoData
   */
  async addPhoto(
    photoData: Base64EncodedString,
    principalId: string,
    photoURL: string
  ): Promise<Customer> {
    console.log(
      "Customer.addPhoto ",
      "Table:",
      CUSTOMER_TABLE,
      " Region:",
      AWS_REGION
    );
    let s3 = new S3();
    let buffer = Buffer.from(photoData, "base64");
    const fileExtension = "jpg"; // TODO: get file extension from file if possible otherwise return with error
    const fileName: string = `${this.CustomerId}_photo.${fileExtension}`;
    const request = await s3
      .putObject({
        Body: buffer,
        Bucket: S3_BUCKET_NAME,
        Key: fileName,
        ContentDisposition: `inline; filename=${fileName}`, // attachment; to force download
        ContentEncoding: "image/jpeg",
      })
      .promise();
    if (
      !request ||
      request.$response.error ||
      request.$response.httpResponse.statusCode != 200
    ) {
      throw Error(
        "CRMAPI ERROR: there was an error writing the file. " +
          request.$response.error
      );
    }

    this.UpdatedAt = new Date().toISOString();
    this.UpdatedBy = principalId;
    this.PhotoURL = photoURL;

    const mapper = getDataMapper();
    const result: Customer = await mapper.put<Customer>({ item: this });
    return result;
  }

  /**
   * Get photo of an existing customer
   */
  async getPhoto(): Promise<string> {
    let s3 = new S3();
    const fileExtension = "jpg";
    const fileName: string = `${this.CustomerId}_photo.${fileExtension}`;
    // Alternatively provide a temporary URL to download directly from S3
    // const url = await s3.getSignedUrlPromise("getObject", { Bucket: S3_BUCKET_NAME, Key: fileName, Expires: 600 });
    // console.log(url);
    const response = await s3
      .getObject({ Bucket: S3_BUCKET_NAME, Key: fileName })
      .promise();
    if (
      !response ||
      response.$response.error ||
      response.$response.httpResponse.statusCode != 200
    ) {
      throw Error(
        "CRMAPI ERROR: there was an error getting customer photo. " +
          response.$response.error
      );
    }
    return response.$response.httpResponse.body.toString("base64");
  }

  /**
   * Get one customer from DynamoDB
   *
   * @param customerId
   */
  static async getOne(customerId: String): Promise<Customer> {
    console.log(
      "Customer.getOne",
      "Table:",
      CUSTOMER_TABLE,
      " Region:",
      AWS_REGION
    );
    if (!customerId) {
      return null;
    }
    const groupId = customerId.slice(-1);
    const customer: Customer = Object.assign<Customer, any>(new Customer(), {
      GroupId: groupId,
      CustomerId: customerId,
    });
    const mapper = getDataMapper();
    const result = await mapper.get<Customer>(customer);
    return result;
  }
  
  /**
   * List all customers from DynamoDB
   */
  static async listAll(pageSize: number, startKey: any = null/*{ [key: string]: any; }*/): Promise<any> {
    console.log(
      "Customer.listAll Table:",
      CUSTOMER_TABLE,
      " Region:",
      AWS_REGION
    );
    
    const options: ScanOptions = {
      pageSize: pageSize,
      startKey: startKey? {GroupId: startKey.slice(-1), CustomerId: startKey} : null,
  //    limit: pageSize
    }
    let customers: Customer[] = [];
    const mapper = getDataMapper();
    const pages = mapper.scan(Customer, options).pages();
    for await (const item of pages) {
      customers = [...item];
      break;
    }
      const result = {
      lastEvaluatedKey: pages.lastEvaluatedKey?.CustomerId, 
      count: pages.count, 
      scannedCount: pages.scannedCount,
      items: customers
    }
    return result;
  }

  static async listAll2(): Promise<Customer[]> {
    console.log(
      "Customer.listAll Table:",
      CUSTOMER_TABLE,
      " Region:",
      AWS_REGION
    );
    const result = new Array();
    const mapper = getDataMapper();
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
