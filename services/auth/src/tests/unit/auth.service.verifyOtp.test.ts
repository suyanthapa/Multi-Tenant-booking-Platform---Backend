import { NotFoundError, ValidationError } from "../../utils/errors";
import { OTPPurpose, UserRole, UserStatus } from "@prisma/client";
import otpService from "../../services/otp.service";
import jwt from "jsonwebtoken";
import { sanitizeUser } from "../../utils/sanitizer";

jest.mock("../../config/database", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({})),
  },
}));

jest.mock("../../config", () => ({
  __esModule: true,
  default: {
    jwt: {
      accessExpiresIn: "test-secret",
      resetSecret: "reset-secret",
    },
    resend: {
      RESEND_API_KEY: "test-key",
    },
  },
}));

jest.mock("../../repositories", () => {
  const mockUserRepository = {
    findByEmail: jest.fn(),
    markEmailAsVerified: jest.fn(),
  };

  return {
    RepositoryFactory: {
      getInstance: jest.fn(() => ({
        userRepository: mockUserRepository,
        refreshTokenRepository: {},
      })),
    },
    __mockedRepositories: {
      mockUserRepository,
    },
  };
});

jest.mock("../../services/otp.service");
jest.mock("../../services/email.service");
jest.mock("jsonwebtoken");
jest.mock("../../utils/sanitizer", () => ({
  sanitizeUser: jest.fn(),
}));

const authService = require("../../services/auth.service").default;

const mockedOtpService = otpService as jest.Mocked<typeof otpService>;
const mockedJwtSign = jwt.sign as jest.Mock;
const mockedSanitizeUser = sanitizeUser as jest.MockedFunction<
  typeof sanitizeUser
>;
const { mockUserRepository } = (
  jest.requireMock("../../repositories") as {
    __mockedRepositories: {
      mockUserRepository: {
        findByEmail: jest.Mock;
        markEmailAsVerified: jest.Mock;
      };
    };
  }
).__mockedRepositories;

const fakeUser = {
  id: "user-123",
  email: "test@example.com",
  username: "testuser",
  role: UserRole.CUSTOMER,
  status: UserStatus.PENDING_VERIFICATION,
  isEmailVerified: false,
};

const fakeInput = {
  email: "test@example.com",
  otp: "123456",
};

describe("AuthService.verifyOtp", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository.findByEmail.mockResolvedValue(fakeUser);
    mockedOtpService.findValidOTPs.mockResolvedValue(fakeUser.id);
    mockUserRepository.markEmailAsVerified.mockResolvedValue(undefined);
    mockedJwtSign.mockReturnValue("fake-reset-token");
    mockedSanitizeUser.mockReturnValue({
      id: fakeUser.id,
      email: fakeUser.email,
    } as any);
  });

  it("throws NotFoundError when user is not found", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.verifyOtp(fakeInput)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws ValidationError when OTP is invalid", async () => {
    mockedOtpService.findValidOTPs.mockResolvedValue(null as any);

    await expect(authService.verifyOtp(fakeInput)).rejects.toThrow(
      ValidationError,
    );
  });

  it("verifies OTP, marks email verified, and returns reset token", async () => {
    const result = await authService.verifyOtp(fakeInput);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      fakeInput.email,
    );
    expect(mockedOtpService.findValidOTPs).toHaveBeenCalledWith(
      fakeUser.id,
      fakeInput.otp,
      OTPPurpose.EMAIL_VERIFICATION,
    );
    expect(mockUserRepository.markEmailAsVerified).toHaveBeenCalledWith(
      fakeUser.id,
    );
    expect(mockedJwtSign).toHaveBeenCalledWith(
      {
        userId: fakeUser.id,
        purpose: "PASSWORD_RESET",
      },
      "test-secret",
      { expiresIn: "15m" },
    );
    expect(mockedSanitizeUser).toHaveBeenCalledWith(fakeUser);
    expect(result).toEqual({
      message: "OTP verified successfully. Email confirmed.",
      user: { id: fakeUser.id, email: fakeUser.email },
      resetToken: "fake-reset-token",
    });
  });
});
