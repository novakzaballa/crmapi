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
  S3_BUCKET_NAME,
  MAX_PHOTO_SIZE,
} from "../common/constants";
import { getDataMapper } from "../common/dbConnection";
import { S3 } from "aws-sdk";
import { Base64EncodedString } from "aws-sdk/clients/elastictranscoder";
import { detectMimeType } from "../common/imageMime";
import { v4 } from "uuid";

@table(CUSTOMER_TABLE)
export class Customer {
  // GroupId is the partition key. Here used to balance the db requests load,
  // however can be used in future upgrades to handle multitenancy.
  @hashKey()
  GroupId!: String;

  @rangeKey({ defaultProvider: () => v4() })
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
  @IsOptional()
  @attribute()
  CreatedBy!: String;

  @IsString()
  @IsISO8601()
  @IsOptional()
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

  @IsString()
  @IsOptional()
  @attribute()
  PhotoFileName?: String;

  /**
   * Adds a new customer to Customers table.
   * GroupId(S), CustomerId(S), Name(S), Surname(S) Email(S) Age(N) and Phone(S) are required.
   * @param principalId
   */
  async createOrUpdate(principalId): Promise<Customer> {
    // Add auditing data
    if (!this.CustomerId) {
      this.CustomerId = v4();
      this.GroupId = this.CustomerId.slice(-1); // Can be replace by th tenant ID in the future
      this.CreatedAt = new Date().toISOString();
      this.CreatedBy = principalId;
    }
    this.UpdatedAt = new Date().toISOString();
    this.UpdatedBy = principalId;
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
    const mimeType = detectMimeType(photoData);
    if (!mimeType) {
      throw (Error(
        "Request body must contain a valid jpeg, png or gif, base64 encoded image."
      ).name = "INVALID_MIME_TYPE");
    }
    const sizeInKB = Math.ceil(
      Math.ceil(photoData.length / 3) * 0.002249958533754
    );
    if (MAX_PHOTO_SIZE && sizeInKB > MAX_PHOTO_SIZE) {
      throw (Error(
        `Image size must be less or equal than ${MAX_PHOTO_SIZE}KB.`
      ).name = "FILE_SIZE_ERROR");
    }
    let s3 = new S3();
    // If a previous photo exists, then delete it.
    if (this.PhotoFileName) {
      await s3
        .deleteObject({ Bucket: S3_BUCKET_NAME, Key: `${this.PhotoFileName}` })
        .promise();
    }
    let buffer = Buffer.from(photoData, "base64");
    const fileName: string = `${this.CustomerId}_photo${mimeType.extension}`;
    const request = await s3
      .putObject({
        Body: buffer,
        Bucket: S3_BUCKET_NAME,
        Key: fileName,
        ContentDisposition: `inline; filename=${fileName}`, // attachment; to force download
        ContentEncoding: mimeType.mime,
      })
      .promise();
    if (
      !request ||
      request.$response.error ||
      request.$response.httpResponse.statusCode != 200
    ) {
      throw Error(
        "There was an error writing the file. " + request.$response.error
      );
    }

    // Add auditing data and se photo URL
    this.UpdatedAt = new Date().toISOString();
    this.UpdatedBy = principalId;
    this.PhotoURL = photoURL;
    this.PhotoFileName = fileName;

    const mapper = getDataMapper();
    const result: Customer = await mapper.put<Customer>({ item: this });
    return result;
  }

  /**
   * Get photo of an existing customer
   */
  async getPhoto(): Promise<string> {
    let s3 = new S3();
    if (!this.PhotoFileName) {
      throw "No picture URL for this user.";
    }
    // Alternatively provide a temporary URL to download directly from S3
    // const url = await s3.getSignedUrlPromise("getObject", { Bucket: S3_BUCKET_NAME, Key: fileName, Expires: 600 });
    const response = await s3
      .getObject({ Bucket: S3_BUCKET_NAME, Key: `${this.PhotoFileName}` })
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
   * Delete a customer from DynamoDB
   *
   * @param customerId
   */
  async delete(): Promise<Customer> {
    if (!this.CustomerId) {
      throw "Object does not have a customer.";
    }

    // If a previous photo exists, then delete it.
    let s3 = new S3();
    if (this.PhotoFileName) {
      await s3
        .deleteObject({ Bucket: S3_BUCKET_NAME, Key: `${this.PhotoFileName}` })
        .promise();
    }

    const mapper = getDataMapper();
    const result = await mapper.delete<Customer>(this);
    return result;
  }

  /**
   * Delete a customer from DynamoDB
   *
   * @param customerId
   */
  static async deleteOne(customerId: String): Promise<Customer> {
    if (!customerId) {
      return null;
    }
    const groupId = customerId.slice(-1);
    const customer: Customer = Object.assign<Customer, any>(new Customer(), {
      GroupId: groupId,
      CustomerId: customerId,
    });

    const mapper = getDataMapper();
    const result = await mapper.delete<Customer>(customer);
    return result;
  }
  /**
   * List all customers from DynamoDB
   */
  static async listAll(
    pageSize: number,
    startKey: any = null /*{ [key: string]: any; }*/
  ): Promise<any> {
    const options: ScanOptions = {
      pageSize: pageSize,
      startKey: startKey
        ? { GroupId: startKey.slice(-1), CustomerId: startKey }
        : null,
      //    limit: pageSize
    };
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
      items: customers,
    };
    return result;
  }

  /**
   * Validates the schema and request payload
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
