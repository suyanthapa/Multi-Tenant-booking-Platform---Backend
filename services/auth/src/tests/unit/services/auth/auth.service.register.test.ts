import { UserRole, UserStatus } from "@prisma/client";

import emailService from "../../../../services/email.service";
import otpService from "../../../../services/otp.service";
import { hashPassword } from "../../../../utils/crypto";
import { ConflictError } from "../../../../utils/errors";

jest.mock("../../../../config/database", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({})),
  },
}));

jest.mock("../../../../repositories", () => {
  const mockUserRepository = {
    findByEmailOrUsername: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn(),
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

jest.mock("../../../../utils/crypto");
jest.mock("../../../../services/otp.service");
jest.mock("../../../../services/email.service");

const mockedHashPassword = hashPassword as jest.MockedFunction<
  typeof hashPassword
>;
const mockedOtpService = otpService as jest.Mocked<typeof otpService>;
const mockedEmailService = emailService as jest.Mocked<typeof emailService>;
const { mockUserRepository } = (
  jest.requireMock("../../../../repositories") as {
    __mockedRepositories: {
      mockUserRepository: {
        findByEmailOrUsername: jest.Mock;
        findByUsername: jest.Mock;
        create: jest.Mock;
      };
    };
  }
).__mockedRepositories;

const authService = require("../../../../services/auth.service").default;
const fakeInput = {
  email: "test@example.com",
  username: "testuser",
  password: "password123",
};

const fakeCreatedUser = {
  id: "user-123",
  email: "test@example.com",
  username: "testuser",
  role: UserRole.CUSTOMER,
  status: UserStatus.PENDING_VERIFICATION,
};

describe("AuthService.register", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository.findByEmailOrUsername.mockResolvedValue(null);
    mockUserRepository.findByUsername.mockResolvedValue(null);
    mockedHashPassword.mockResolvedValue("hashed-password");
    mockUserRepository.create.mockResolvedValue(fakeCreatedUser);
    mockedOtpService.generateEmailVerificationOTP.mockResolvedValue("123456");
    mockedEmailService.sendVerificationEmail.mockResolvedValue(undefined);
  });

  it("throws ConflictError when email already exists", async () => {
    mockUserRepository.findByEmailOrUsername.mockResolvedValue({ id: "u1" });

    await expect(authService.register(fakeInput)).rejects.toThrow(
      ConflictError,
    );
  });

  it("throws ConflictError when username already exists", async () => {
    mockUserRepository.findByUsername.mockResolvedValue({ id: "u2" });

    await expect(authService.register(fakeInput)).rejects.toThrow(
      ConflictError,
    );
  });

  it("creates user and sends verification email", async () => {
    const result = await authService.register(fakeInput);

    expect(mockedHashPassword).toHaveBeenCalledWith(fakeInput.password);
    expect(mockUserRepository.create).toHaveBeenCalledWith({
      email: fakeInput.email,
      username: fakeInput.username,
      passwordHash: "hashed-password",
      role: UserRole.CUSTOMER,
      status: UserStatus.PENDING_VERIFICATION,
      isEmailVerified: false,
    });
    expect(mockedOtpService.generateEmailVerificationOTP).toHaveBeenCalledWith(
      fakeCreatedUser.id,
    );
    expect(mockedEmailService.sendVerificationEmail).toHaveBeenCalledWith(
      fakeInput.email,
      "123456",
    );
    expect(result.user).toMatchObject({
      id: fakeCreatedUser.id,
      email: fakeCreatedUser.email,
      username: fakeCreatedUser.username,
      role: fakeCreatedUser.role,
      status: fakeCreatedUser.status,
    });
  });
});
