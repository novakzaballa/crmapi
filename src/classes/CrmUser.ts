import {
  validateOrReject,
  IsString,
  IsInt,
  IsEmail,
  IsDefined,
  IsOptional,
} from "class-validator";

import { passPolicyEnforce, addIdpUser, listIdpUsers, authenticateIdpUser, setIdpRole, roleType, deleteIdpUser, deleteIdpUserByEmail, UpdateIdpUser } from "../common/auth0Helper";

interface identity {
  user_id: string; // "5e9bf5ebde431a0c8d65b8c2",
  provider: string; // "auth0",
  connection: string; // "Username-Password-Authentication",
  isSocial: string; // false
}

export class CrmUser {
  @IsString()
  @IsDefined()
  given_name

  @IsString()
  @IsDefined()
  family_name

  @IsString()
  @IsEmail()
  @IsDefined()
  email: string; // "quarklap@gmail.com",

  @IsString()
  @IsOptional()
  email_verified: string; // true,

  @IsOptional()
  identities: identity[];

  @IsString()
  @IsOptional()
  created_at: string; // "2020-04-19T0: string;5// : string;3// 9.334Z",

  @IsString()
  @IsOptional()
  name: string; // "quarklap@gmail.com",
  @IsString()
  @IsOptional()
  nickname: string; // "quarklap",

  @IsString()
  @IsOptional()
  picture: string; // "http: string;/// /s.gravatar.com/avatar/fc68e24407c0094d2b508f28ca26e2fe?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fqu.png",

  @IsString()
  @IsOptional()
  updated_at: string; // "2020-04-23T2: string;1// : string;4// 5.683Z",

  @IsString()
  @IsOptional()
  user_id: string; // "auth0|5e9bf5ebde431a0c8d65b8c2",

  @IsString()
  @IsOptional()
  last_login: string; // "2020-04-23T2: string;1// : string;4// 5.683Z",

  @IsString()
  @IsOptional()
  last_ip: string; // "181.188.179.27",
  
  @IsInt()
  @IsOptional()
  logins_count: number; // 17

  /**
   * Creates a new user in the Auth0 IDP
   * @param email 
   * @param password 
   * @param policy 
   */
  static async createUser(
    email: string,
    password: string,
    given_name: string,
    family_name: string,
    policy: passPolicyEnforce = passPolicyEnforce.strong //Password policy implemented in addIdpUser helper
    ): Promise<any> {
    try {
      return await addIdpUser(email, password, given_name, family_name, policy);
    } catch (err) {
      console.log("Create user error:", err);
      throw new Error(err);
    }
  }

  /**
   * 
   * @param email 
   * @param password 
   * @param given_name 
   * @param family_name 
   * @param policy 
   */
  static async UpdateIdpUser(
    uid: string,
    password: string,
    given_name: string,
    family_name: string,
    blocked: boolean,
    policy: passPolicyEnforce = passPolicyEnforce.strong //Password policy implemented in addIdpUser helper
    ): Promise<any> {
    try {
      return await UpdateIdpUser(uid, password, given_name, family_name, blocked, policy);
    } catch (err) {
      console.log("Update user error:", err);
      throw new Error(err);
    }
  }

  /**
   * List users ordered by nick name (left part of the @ symbol in user email)
   * @param per_page Users per page to be returned
   * @param page  Page to be returned
   */
  static async listAll(
    per_page: number,
    page: number
  ): Promise<any> {
    try {
      return await listIdpUsers(per_page, page);
    } catch (err) {
      console.log("List users error:", err);
      throw new Error(err);
    }
  }

  
   /**
   * Authenticates user credentials and return an access token. It is supposed
   * clients are totally trusted. Otherwise other OAuth flow must be implemented.
   * @param per_page Users per page to be returned
   * @param page  Page to be returned
   */

  static async authenticateUser(
    email: string,
    password: string
    ): Promise<any> {
    try {
      return await authenticateIdpUser(email, password);
    } catch (err) {
      console.log("Authenticate IDP user error:", err);
      throw new Error(err);
    }
  }

  /**
   * Set or unset admin role of an Auth0 IDP user
   * @param email 
   * @param role 
   */  
  static async setUserRoleByEmail(
    email: string,
    role: string
    ): Promise<any> {
    try {
      return await setIdpRole(email, role as roleType);
    } catch (err) {
      console.log("Set user role error:", err);
      throw new Error(err);
    }
  }

  /**
   * Deletes a user from Auth0 IDP found by email
   * @param id User ID
   */
  static async deleteByEmail(
    email: string
    ): Promise<any> {
    try {
      return await deleteIdpUserByEmail(email as roleType);
    } catch (err) {
      console.log("User delete by email error:", err);
      throw new Error(err);
    }
  }

  /**
   * Deletes a user from Auth0 IDP
   * @param id User ID
   */
  static async delete(
    id: string
    ): Promise<any> {
    try {
      return await deleteIdpUser(id as roleType);
    } catch (err) {
      console.log("User delete error:", err);
      throw new Error(err);
    }
  }
  /**
   * Validates schema. When creating a new user only validates email. 
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
