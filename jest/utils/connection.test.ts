import connectToDB from "../../src/utils/connectToDB";
jest.useFakeTimers();

describe("Connection", () => {
  it("should connect", () => {
    const callback = () => {
      console.log('true')
    }
    
    expect(connectToDB(process.env.DATABASE_URL!, callback)).toBe(undefined);
  });
})