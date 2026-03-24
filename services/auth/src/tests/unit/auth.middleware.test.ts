import { Request, Response, NextFunction } from "express";
import { authenticate } from "../../middlewares/auth";
import { verifyAccessToken } from "../../utils/jwt";
import { AuthenticationError } from "../../utils/errors";

//mocking the jwt utility to control its behavior in tests
jest.mock("../../utils/jwt", () => ({
  verifyAccessToken: jest.fn(),
}));

// Type assertion to treat the mocked function as a jest mocked function with the same signature as the original
const mockedVerifyAccessToken = verifyAccessToken as jest.MockedFunction<
  typeof verifyAccessToken
>;

// Create request
//Creates a fake  Express rejuest object with default empty cookies and headers, which can be overridden by passing an object with the desired properties. This allows tests to easily simulate different request scenarios by providing specific cookies or headers as needed.
const createRequest = (overrides: Partial<Request> = {}): Request => {
  return {
    cookies: {},
    headers: {},
    ...overrides,
  } as Request;
};

// Group related tests for the authenticate middleware. Each test case checks a different aspect of the middleware's behavior, such as accepting tokens from cookies or headers, handling missing tokens, and forwarding errors from the token verification process.
describe("authenticate middleware", () => {
  let res: Response; //fake res
  let next: NextFunction; //fake next function

  beforeEach(() => {
    jest.clearAllMocks(); // reset previus test data
    res = {} as Response; //dummy response object since the middleware doesn't use it
    next = jest.fn(); //mock function  -- IMPORTANT IN MIDDLEWARE
  });

  //Now the actual test cases begin
  // Test 1: Cookie Token
  it("accepts cookie accessToken", () => {
    // Fake decoded JWT
    const payload = { id: "u1", email: "test@example.com", role: "CUSTOMER" };

    mockedVerifyAccessToken.mockReturnValue(payload as any);

    //Simulate request with cookie
    const req = createRequest({
      cookies: { accessToken: "cookie-token" },
    });

    //  Run middleware
    authenticate(req, res, next);

    expect(mockedVerifyAccessToken).toHaveBeenCalledWith("cookie-token");
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledWith();
  });

  it("accepts Bearer token header", () => {
    const payload = { id: "u2", email: "header@example.com", role: "ADMIN" };
    mockedVerifyAccessToken.mockReturnValue(payload as any);

    const req = createRequest({
      headers: { authorization: "Bearer header-token" },
    });

    authenticate(req, res, next);

    expect(mockedVerifyAccessToken).toHaveBeenCalledWith("header-token");
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects missing token", () => {
    const req = createRequest({
      cookies: {},
      headers: {},
    });

    authenticate(req, res, next);

    expect(mockedVerifyAccessToken).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);

    const forwardedError = (next as jest.Mock).mock.calls[0][0];
    expect(forwardedError).toBeInstanceOf(AuthenticationError);
    expect(forwardedError.message).toBe("No token provided");
  });

  it("passes decoded payload into req.user", () => {
    const payload = { id: "u3", email: "payload@example.com", role: "VENDOR" };
    mockedVerifyAccessToken.mockReturnValue(payload as any);

    const req = createRequest({
      cookies: { accessToken: "payload-token" },
    });

    authenticate(req, res, next);

    expect(req.user).toBe(payload);
    expect(next).toHaveBeenCalledWith();
  });

  it("forwards verify errors to next(error)", () => {
    const verifyError = new Error("Invalid token");
    mockedVerifyAccessToken.mockImplementation(() => {
      throw verifyError;
    });

    const req = createRequest({
      cookies: { accessToken: "bad-token" },
    });

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(verifyError);
  });
});
