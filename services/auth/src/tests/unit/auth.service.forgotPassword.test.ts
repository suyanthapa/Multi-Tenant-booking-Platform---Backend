import otpService from "../../services/otp.service";
import emailService from "../../services/email.service";

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

const mockedOtpService = otpService as jest.Mocked<typeof otpService>;
const mockedEmailService = emailService as jest.Mocked<typeof emailService>;
const { mockUserRepository } = (
  jest.requireMock("../../repositories") as {
    __mockedRepositories: {
      mockUserRepository: {
        findByEmail: jest.Mock;
      };
    };
  }
).__mockedRepositories;

const authService = require("../../services/auth.service").default;

const fakeUser = {
  id: "user-123",
  email: "test@example.com",
};

describe("AuthService.forgotPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository.findByEmail.mockResolvedValue(fakeUser);
    mockedOtpService.generatePasswordResetOTP.mockResolvedValue("654321");
    mockedEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);
  });

  it("returns generic message when user is not found", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const result = await authService.forgotPassword({
      email: "missing@example.com",
    });

    expect(result).toEqual({
      message: "If the email exists, a password reset code has been sent.",
    });
    expect(mockedOtpService.generatePasswordResetOTP).not.toHaveBeenCalled();
    expect(mockedEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("sends password reset OTP when user exists", async () => {
    const result = await authService.forgotPassword({ email: fakeUser.email });

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(fakeUser.email);
    expect(mockedOtpService.generatePasswordResetOTP).toHaveBeenCalledWith(
      fakeUser.id,
    );
    expect(mockedEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      fakeUser.email,
      "654321",
    );
    expect(result).toEqual({
      message: "If the email exists, a password reset code has been sent.",
    });
  });
});
