import { Request, Response } from "express";
import { authenticate, authorize, hasRole } from "../../middlewares/auth";
import { verifyAccessToken } from "../../utils/jwt";
import { AuthenticationError, AuthorizationError } from "../../utils/errors";
import { UserRole } from "../../generated/prisma";

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
  let next: jest.Mock;

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

    // Ensure verifyAccessToken (JWT verification) was NOT called
    // Because there is no token, middleware should skip JWT verification
    expect(mockedVerifyAccessToken).not.toHaveBeenCalled();

    // Ensure next() was called exactly once
    // Middleware should forward the error to Express error handler
    expect(next).toHaveBeenCalledTimes(1);

    //  Capture the error object passed to next()
    // Jest stores mock calls in next.mock.calls array
    // next.mock.calls[0][0] = first call, first argument = the error
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

//Authorize Middleware
describe("authorize middleware", () => {
  let res: Response;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {} as Response;
    next = jest.fn();
  });

  //Test 1: Access Granted
  it("accepts user with allowed role", () => {
    //Fake request with user role
    const req = createRequest({
      user: { role: UserRole.ADMIN, id: "test-id", email: "test@example.com" },
    });

    //Run middleware
    const middleware = authorize(UserRole.ADMIN);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(); //Assert
  });

  //Test 2: Multiple Allowed Roles
  it("allows user when multiple roles are permitted", () => {
    const req = createRequest({
      user: {
        role: UserRole.VENDOR, // VENDOR trying to access
        id: "test-id",
        email: "test@example.com",
      },
    });

    const middleware = authorize(UserRole.ADMIN, UserRole.VENDOR); // both allowed
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  //Test 3: Access Denied
  it("rejects user with disallowed urole", () => {
    const req = createRequest({
      user: {
        role: UserRole.CUSTOMER,
        id: "test-id",
        email: "test@example.com",
      },
    });
    const middleware = authorize(UserRole.ADMIN);
    middleware(req, res, next);
    const forwadedError = (next as jest.Mock).mock.calls[0][0];

    expect(forwadedError).toBeInstanceOf(AuthorizationError);
    expect(forwadedError.message).toBe("Insufficient permissions");
  });

  //Test 4: No user
  it("rejects when  no user is authenticated", () => {
    const req = createRequest(); // no user property
    const middleware = authorize(UserRole.ADMIN);
    middleware(req, res, next);
    const forwadedError = (next as jest.Mock).mock.calls[0][0];
    expect(forwadedError).toBeInstanceOf(AuthorizationError);
    expect(forwadedError.message).toBe("Authentication required");
  });
});

//has Role Middleware
describe("hasRole middleware", () => {
  let res: Response;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {} as Response;
    next = jest.fn();
  });

  // Test 1: User has role
  it("allows user with specified role", () => {
    const req = createRequest({
      user: { role: "VENDOR", id: "test-id", email: "test@example.com" },
    });
    const middleware = hasRole("VENDOR");
    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  // Test 2: User does not have role
  it("rejects user without specified role", () => {
    const req = createRequest({
      user: { role: "CUSTOMER", id: "test-id", email: "test@example.com" },
    });
    const middleware = hasRole("ADMIN");
    middleware(req, res, next);
    const forwadedError = (next as jest.Mock).mock.calls[0][0];
    expect(forwadedError).toBeInstanceOf(AuthorizationError);
    expect(forwadedError.message).toBe("Access denied. Required role: ADMIN");
  });

  // Test 3: No user
  it("rejects when no user is authenticated", () => {
    const req = createRequest(); // no user property
    const middleware = hasRole("ADMIN");
    middleware(req, res, next);
    const forwadedError = (next as jest.Mock).mock.calls[0][0];
    expect(forwadedError).toBeInstanceOf(AuthenticationError);
    expect(forwadedError.message).toBe("Authentication required");
  });
});
