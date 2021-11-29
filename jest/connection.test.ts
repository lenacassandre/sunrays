import connectToDB from "../src/utils/connectToDB";

describe("Connection", () => {
  it("should connect", () => {
    const callback = () => {
      console.log('true')
    }
    expect(connectToDB("mongodb://root:root@127.0.0.1:27017/test?authSource=test", callback)).toBe(undefined);
  });
})