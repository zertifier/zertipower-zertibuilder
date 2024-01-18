import { SignCodeUtils } from "./SignCodeUtils";

const CODE_ATTEMPTS = 20;

describe("Testing SingCodeUtils", () => {
  test("Testing get random code", () => {
    const codes = new Set<string>();

    for (let i = 0; i < CODE_ATTEMPTS; i++) {
      codes.add(SignCodeUtils.getRandomCode());
    }

    expect(codes.size).toEqual(CODE_ATTEMPTS);
  });
});
