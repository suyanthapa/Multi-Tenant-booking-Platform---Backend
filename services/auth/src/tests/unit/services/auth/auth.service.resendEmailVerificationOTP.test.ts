import { UserRole, UserStatus } from "@prisma/client";
import emailService from "../../../../services/email.service";
import otpService from "../../../../services/otp.service";
import {
  AccountSuspendedError,
  ConflictError,
  NotFoundError,
} from "../../../../utils/errors";
jest.mock("../../../../config/database", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({})),
  },
}));

jest.mock("../../../../repositories", () => {
  const mockUserRepository = {
    findByEmail: jest.fn(),
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

jest.mock("../../../../services/otp.service");
jest.mock("../../../../services/email.service");

const mockedOtpService = otpService as jest.Mocked<typeof otpService>;
const mockedEmailService = emailService as jest.Mocked<typeof emailService>;
const { mockUserRepository } = (
  jest.requireMock("../../../../repositories") as {
    __mockedRepositories: {
      mockUserRepository: {
        findByEmail: jest.Mock;
      };
    };
  }
).__mockedRepositories;

const authService = require("../../../../services/auth.service").default;

const fakeUser = {
  id: "user-123",
  email: "test@example.com",
  username: "testuser",
  role: UserRole.CUSTOMER,
  status: UserStatus.PENDING_VERIFICATION,
  isEmailVerified: false,
};

describe("AuthService.resendEmailVerificationOTP", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository.findByEmail.mockResolvedValue(fakeUser);
    mockedOtpService.generateEmailVerificationOTP.mockResolvedValue("123456");
    mockedEmailService.sendVerificationEmail.mockResolvedValue(undefined);
  });

  it("throws NotFoundError when user is not found", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      authService.resendEmailVerificationOTP({ email: fakeUser.email }),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ConflictError when email is already verified", async () => {
    mockUserRepository.findByEmail.mockResolvedValue({
      ...fakeUser,
      isEmailVerified: true,
    });

    await expect(
      authService.resendEmailVerificationOTP({ email: fakeUser.email }),
    ).rejects.toThrow(ConflictError);
  });

  it("throws NotFoundError when user is deleted", async () => {
    mockUserRepository.findByEmail.mockResolvedValue({
      ...fakeUser,
      status: UserStatus.DELETED,
    });

    await expect(
      authService.resendEmailVerificationOTP({ email: fakeUser.email }),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws AccountSuspendedError when user is suspended", async () => {
    mockUserRepository.findByEmail.mockResolvedValue({
      ...fakeUser,
      status: UserStatus.SUSPENDED,
    });

    await expect(
      authService.resendEmailVerificationOTP({ email: fakeUser.email }),
    ).rejects.toThrow(AccountSuspendedError);
  });

  it("generates OTP and sends verification email", async () => {
    const result = await authService.resendEmailVerificationOTP({
      email: fakeUser.email,
    });

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(fakeUser.email);
    expect(mockedOtpService.generateEmailVerificationOTP).toHaveBeenCalledWith(
      fakeUser.id,
    );
    expect(mockedEmailService.sendVerificationEmail).toHaveBeenCalledWith(
      fakeUser.email,
      "123456",
    );
    expect(result).toEqual({
      message: "Verification code has been resent to your email.",
    });
  });
});
