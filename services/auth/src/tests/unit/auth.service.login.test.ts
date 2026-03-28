import { generateTokenPair } from "../../utils/jwt";
import {
  AuthenticationError,
  EmailNotVerifiedError,
  AccountPendingError,
  AccountSuspendedError,
} from "../../utils/errors";
import { UserStatus, UserRole } from "@prisma/client";
import { comparePassword } from "../../utils/crypto";
import otpService from "../../services/otp.service";
import emailService from "../../services/email.service";
import businessClient from "../../clients/businessClient";
import authService from "../../services/auth.service";

// Mocks
jest.mock("../../config/database", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({})),
  },
}));

// module mock
jest.mock("../../repositories", () => {
  //mock object
  const mockUserRepository = {
    findByEmail: jest.fn(), // mock function
    updateLastLogin: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    create: jest.fn(),
  };

  return {
    // mock class
    RepositoryFactory: {
      getInstance: jest.fn(() => ({
        //fake implementation
        userRepository: mockUserRepository, // returns MOCK OBJECT instead of real UserRepository
        refreshTokenRepository: mockRefreshTokenRepository,
      })),
    },
    __mockedRepositories: {
      mockUserRepository, // expose mock object
      mockRefreshTokenRepository,
    },
  };
});

jest.mock("../../utils/crypto");
jest.mock("../../utils/jwt");
jest.mock("../../services/otp.service");
jest.mock("../../services/email.service");
jest.mock("../../clients/businessClient");

const mockedComparePassword = comparePassword as jest.MockedFunction<
  typeof comparePassword
>;
const mockedGenerateTokenPair = generateTokenPair as jest.MockedFunction<
  typeof generateTokenPair
>;
const mockedOtpService = otpService as jest.Mocked<typeof otpService>;
const mockedEmailService = emailService as jest.Mocked<typeof emailService>;
const mockedBusinessClient = businessClient as jest.Mocked<
  typeof businessClient
>;
const { mockUserRepository, mockRefreshTokenRepository } = (
  jest.requireMock("../../repositories") as {
    __mockedRepositories: {
      mockUserRepository: {
        findByEmail: jest.Mock;
        updateLastLogin: jest.Mock;
      };
      mockRefreshTokenRepository: {
        create: jest.Mock;
      };
    };
  }
).__mockedRepositories;

// fake user data and token data for testing
const fakeUser = {
  id: "user-123",
  email: "test@example.com",
  username: "testuser",
  passwordHash: "hashed-password",
  role: UserRole.CUSTOMER,
  status: UserStatus.ACTIVE,
  isEmailVerified: true,
};

const fakeTokens = {
  accessToken: "fake-access-token",
  refreshToken: "fake-refresh-token",
};

// Tests
describe("AuthService.login", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // default happy path mocks
    mockUserRepository.findByEmail.mockResolvedValue(fakeUser);
    mockedComparePassword.mockResolvedValue(true);
    mockedGenerateTokenPair.mockReturnValue(fakeTokens);
    mockRefreshTokenRepository.create.mockResolvedValue({});
    mockUserRepository.updateLastLogin.mockResolvedValue({});
    mockedBusinessClient.validateBusinessByOwner.mockResolvedValue(null); // no business
  });

  // happy path test
  it("returns user, accessToken, refreshToken on successful login", async () => {
    const result = await authService.login({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.accessToken).toBe("fake-access-token");
    expect(result.refreshToken).toBe("fake-refresh-token");
    expect(result.user).toMatchObject({
      id: fakeUser.id,
      email: fakeUser.email,
      role: fakeUser.role,
    });
  });

  it("stores refresh token after successful login", async () => {
    await authService.login({
      email: "test@example.com",
      password: "password123",
    });

    expect(mockRefreshTokenRepository.create).toHaveBeenCalledTimes(1);
  });

  it("updates last login after successful login", async () => {
    await authService.login({
      email: "test@example.com",
      password: "password123",
    });

    expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(
      fakeUser.id,
    );
  });

  // ── Error Cases ──────────────────────────────────────────────

  it("throws AuthenticationError when user not found", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null); // no user

    await expect(
      authService.login({
        email: "wrong@example.com",
        password: "password123",
      }),
    ).rejects.toThrow(AuthenticationError);
  });

  it("throws AuthenticationError when password is wrong", async () => {
    mockedComparePassword.mockResolvedValue(false); // wrong password

    await expect(
      authService.login({
        email: "test@example.com",
        password: "wrongpassword",
      }),
    ).rejects.toThrow(AuthenticationError);
  });

  it("throws EmailNotVerifiedError when email is not verified", async () => {
    mockUserRepository.findByEmail.mockResolvedValue({
      ...fakeUser,
      isEmailVerified: false, // ← not verified
    });
    mockedOtpService.generateEmailVerificationOTP.mockResolvedValue("123456");
    mockedEmailService.sendVerificationEmail.mockResolvedValue(undefined);

    await expect(
      authService.login({ email: "test@example.com", password: "password123" }),
    ).rejects.toThrow(EmailNotVerifiedError);
  });

  it("sends verification email when email is not verified", async () => {
    mockUserRepository.findByEmail.mockResolvedValue({
      ...fakeUser,
      isEmailVerified: false,
    });
    mockedOtpService.generateEmailVerificationOTP.mockResolvedValue("123456");
    mockedEmailService.sendVerificationEmail.mockResolvedValue(undefined);

    await expect(
      authService.login({ email: "test@example.com", password: "password123" }),
    ).rejects.toThrow();

    expect(mockedEmailService.sendVerificationEmail).toHaveBeenCalledWith(
      fakeUser.email,
      "123456",
    );
  });

  it("throws AuthenticationError when account is inactive", async () => {
    mockUserRepository.findByEmail.mockResolvedValue({
      ...fakeUser,
      status: UserStatus.SUSPENDED,
    });

    await expect(
      authService.login({ email: "test@example.com", password: "password123" }),
    ).rejects.toThrow(AuthenticationError);
  });

  it("throws AccountPendingError when business is pending", async () => {
    mockedBusinessClient.validateBusinessByOwner.mockResolvedValue({
      businessId: "biz-123",
      status: "PENDING", // ← pending
    });

    await expect(
      authService.login({ email: "test@example.com", password: "password123" }),
    ).rejects.toThrow(AccountPendingError);
  });

  it("throws AccountSuspendedError when business is suspended", async () => {
    mockedBusinessClient.validateBusinessByOwner.mockResolvedValue({
      businessId: "biz-123",
      status: "SUSPENDED", // ← suspended
    });

    await expect(
      authService.login({ email: "test@example.com", password: "password123" }),
    ).rejects.toThrow(AccountSuspendedError);
  });

  it("includes businessId in token payload when business exists", async () => {
    mockedBusinessClient.validateBusinessByOwner.mockResolvedValue({
      businessId: "biz-123",
      status: "ACTIVE",
    });

    await authService.login({
      email: "test@example.com",
      password: "password123",
    });

    expect(mockedGenerateTokenPair).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "biz-123", // ← businessId included in payload
      }),
    );
  });
});
