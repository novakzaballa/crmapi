import { Customer } from "../Customer";
import { DataMapper } from "@aws/dynamodb-data-mapper";
jest.mock("@aws/dynamodb-data-mapper");

// tests for Customer class

//const jestPlugin = require('serverless-jest-plugin');
let customerMock: Customer = new Customer();

describe("Customer Methods", () => {
  beforeAll((done) => {
    //  lambdaWrapper.init(liveFunction); // Run the deployed lambda
    Object.assign(customerMock, {
      GroupId: "4",
      CustomerId: "4532324",
      Name: "Paul Ray",
      Surname: "Ghost",
      Phone: "(122)23878 343",
      Email: "pghost@midominio.com",
      Age: 2,
    });
    process.env.IS_OFFLINE = "";
    (DataMapper as jest.Mock).mockClear();
    done();
  });
  it.only("Unit Test: Customer.CreateOrUpdate", async () => {
    // const dataMapper = new DataMapper();
    // const mockDataMapperPut = jest.spyOn(DataMapper, 'put'); 
    const result = await customerMock.createOrUpdate("jestTestUser");
    
    expect(DataMapper).toHaveBeenCalledTimes(1);
    const mockDataMapperInstance = (DataMapper as jest.Mock).mock.instances[0];
    const mockPut = mockDataMapperInstance.put;
    expect(mockPut.mock.calls[0][0].item).toEqual(customerMock);
    expect(mockPut).toHaveBeenCalledTimes(1);
    console.log(result);
    });
  });
