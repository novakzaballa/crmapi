import {
  ManagementClient,
  GetUsersDataPaged,
  UserPage,
  AppMetadata,
  UserMetadata,
  User,
  CreateUserData,
  AuthenticationClient,
  PasswordGrantOptions,
  TokenResponse,
  GetRolesData,
  Role,
} from "auth0";
import {
  OAUTH_DOMAIN,
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
} from "../common/constants";
import { isNumber } from "util";

/**
 * Get Auth0 Authentication Client
 */
const getAuth0Client = () =>
  new AuthenticationClient({
    domain: OAUTH_DOMAIN,
    clientId: OAUTH_CLIENT_ID,
    clientSecret: OAUTH_CLIENT_SECRET,
  });

/**
 * Get Auth0 Management Client
 *
 * @param scope
 */
const getAuth0ManagementClient = (scope?: string) =>
  new ManagementClient({
    domain: OAUTH_DOMAIN,
    clientId: OAUTH_CLIENT_ID,
    clientSecret: OAUTH_CLIENT_SECRET,
    scope: scope,
  });

/**
 * Authenticates user credentials and returns an acces token.
 * Only use if client and communication channel are totally trusted.
 *
 * @param email
 * @param password
 */
export const authenticateIdpUser = async (
  email: string,
  password: string
): Promise<TokenResponse> => {
  if (!email || !password) {
    console.log("users.listAll Error: per_page or page params not valid.");
    throw new Error("users.listAll Error: per_page or page params not valid.");
  }

  const auth0Mgmt = getAuth0Client();

  const params: PasswordGrantOptions = {
    username: email,
    password: password,
    scope: "admin",
  };

  return await auth0Mgmt.passwordGrant(params);
};

/**
 * List users in the external Auth0 IDP
 * @param per_page
 * @param page
 */
export const listIdpUsers = async (
  per_page: number,
  page: number
): Promise<UserPage<AppMetadata, UserMetadata>> => {
  if (
    !isNumber(per_page) ||
    !isNumber(page) ||
    per_page <= 0 ||
    per_page > 50 ||
    page < 0
  ) {
    let msg = "";
    console.log(
      (msg = "users.listAll Error: per_page or page params not valid.")
    );
    throw new Error(msg);
  }

  const auth0Mgmt = getAuth0ManagementClient("read:users");

  const params: GetUsersDataPaged = {
    include_totals: true,
    per_page: per_page,
    page: page,
    sort: "nickname:1", //enable to sort
    // Enable the lines below to include only certain fields
    fields:
      "nickname,user_id,created_at,email,email_verified,updated_at,last_login,last_ip,logins_count",
    include_fields: true,
  };

  return await auth0Mgmt.getUsers(params);
};

export enum passPolicyEnforce {
  none = "none",
  medium = "medium",
  strong = "strong",
}

/**
 * Add a user to the Auth0 IDP with basic privileges to manage CRM customers
 *
 * @param email
 * @param password
 * @param policy
 */
export const addIdpUser = async (
  email: string,
  password: string,
  policy: passPolicyEnforce = passPolicyEnforce.none
): Promise<User<AppMetadata, UserMetadata>> => {
  let errMsg: string = "";
  if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    console.log((errMsg = "Auth0 create user error: email not valid."));
    throw new Error(errMsg);
  }
  if (
    policy !== passPolicyEnforce.none &&
    policy !== passPolicyEnforce.medium &&
    policy !== passPolicyEnforce.strong
  ) {
    console.log((errMsg = "Password policy error: policy not valid."));
    throw new Error(errMsg);
  }
  const strongRegex = new RegExp(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
  );
  const mediumRegex = new RegExp(
    "^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})"
  );
  if (policy === passPolicyEnforce.strong && !strongRegex.test(password)) {
    console.log(
      (errMsg = `Password must be at least 8 characters long and contain at least one lowercase, uppercase, numeric, and special character`)
    );
    throw new Error(errMsg);
  }
  if (policy === passPolicyEnforce.medium && !mediumRegex.test(password)) {
    console.log(
      (errMsg = `Password must be at least 6 characters long and contain at least one lowercase and one uppercase or numeric character`)
    );
    throw new Error(errMsg);
  }

  const auth0Mgmt = getAuth0ManagementClient("create:users");
  const params: CreateUserData = {
    connection: "Username-Password-Authentication",
    email: email,
    password: password,
  };
  return await auth0Mgmt.createUser(params);
};

export enum roleType {
  user = "user",
  admin = "admin",
}

/**
 * Add a user to the Auth0 IDP with basic privileges to manage CRM customers
 *
 * @param email
 * @param role
 */
export const setIdpRole = async (
  email: string,
  role: roleType = roleType.user
): Promise<void> => {
  let errMsg: string = "";
  if (role !== roleType.user && role !== roleType.admin) {
    console.log(
      (errMsg = "Role not valid. Request either 'user' or 'admin' role.")
    );
    throw new Error(errMsg);
  }
  const auth0Mgmt = getAuth0ManagementClient("create:users");
  const user = await auth0Mgmt.getUsersByEmail(email);
  if (!user) {
    throw new Error("User email do not exist.");
  }
  const id = { id: user[0].user_id };
  const userRoles = await auth0Mgmt.getUserRoles(id);
  const param: GetRolesData = {
    name_filter: "crm_admin",
  };
  const admin_rol: Role = (await auth0Mgmt.getRoles(param))[0];
  if (!admin_rol) {
    throw new Error("Auth0 account missing crm_admin role.");
  }
  if (role === roleType.admin) {
    if (userRoles.map((r) => r.name).indexOf("crm_admin") >= 0) {
      throw new Error("User has admin role already set.");
    }
    const result = await auth0Mgmt.assignRolestoUser(id, { roles: [admin_rol.id] });
    return result;
} else {
    if (userRoles.map((r) => r.name).indexOf("crm_admin") < 0) {
      throw new Error("User has not admin role set. Can not remove it.");
    }
    const result = await auth0Mgmt.removeRolesFromUser(id, { roles: [admin_rol.id] });
    return result;
  }
};
