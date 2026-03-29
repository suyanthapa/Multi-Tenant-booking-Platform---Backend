import { OTPPurpose, UserRole, UserStatus } from "@prisma/client";
import authService from "../../../../services/auth.service";
import businessClient from "../../../../clients/businessClient";
import emailService from "../../../../services/email.service";
import otpService from "../../../../services/otp.service";
import { NotFoundError } from "../../../../utils/errors";

jest.mock("../../../../config/database", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({})),
  },
}));

jest.mock("../../../../repositories", () => {
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

jest.mock("../../../../services/otp.service");
jest.mock("../../../../services/email.service");
jest.mock("../../../../clients/businessClient");

const mockedOtpService = otpService as jest.Mocked<typeof otpService>;
const mockedEmailService = emailService as jest.Mocked<typeof emailService>;
const mockedBusinessClient = businessClient as jest.Mocked<
  typeof businessClient
>;
const { mockUserRepository } = (
  jest.requireMock("../../../../repositories") as {
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
  purpose: OTPPurpose.EMAIL_VERIFICATION,
};

describe("AuthService.verifyEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository.findByEmail.mockResolvedValue(fakeUser);
    mockedOtpService.findValidOTPs.mockResolvedValue(fakeUser.id);
    mockUserRepository.markEmailAsVerified.mockResolvedValue(undefined);
    mockedBusinessClient.markBusinessEmailVerified.mockResolvedValue(undefined);
    mockedEmailService.sendWelcomeEmail.mockResolvedValue(undefined);
  });

  it("throws NotFoundError when user is not found", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.verifyEmail(fakeInput)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("verifies email, updates user, and sends welcome email", async () => {
    const result = await authService.verifyEmail(fakeInput);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      fakeInput.email,
    );
    expect(mockedOtpService.findValidOTPs).toHaveBeenCalledWith(
      fakeUser.id,
      fakeInput.otp,
      fakeInput.purpose,
    );
    expect(mockUserRepository.markEmailAsVerified).toHaveBeenCalledWith(
      fakeUser.id,
    );
    expect(mockedBusinessClient.markBusinessEmailVerified).toHaveBeenCalledWith(
      fakeUser.id,
      fakeInput.email,
    );
    expect(mockedEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
      fakeUser.email,
      fakeUser.username,
    );
    expect(result).toEqual({
      message: "Email verified successfully. You can now log in.",
    });
  });

  it("bubbles up OTP validation errors", async () => {
    mockedOtpService.findValidOTPs.mockRejectedValue(new Error("Invalid OTP"));

    await expect(authService.verifyEmail(fakeInput)).rejects.toThrow(
      "Invalid OTP",
    );
  });
});
