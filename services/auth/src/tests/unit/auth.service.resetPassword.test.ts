import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../utils/errors";
import { comparePassword, hashPassword } from "../../utils/crypto";
import jwt from "jsonwebtoken";

jest.mock("../../config/database", () => {
  const mockPrisma = {
    refreshToken: {
      updateMany: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: {
      getInstance: jest.fn(() => mockPrisma),
    },
    __mockedPrisma: mockPrisma,
  };
});

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
    updatePassword: jest.fn(),
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

jest.mock("../../utils/crypto");
jest.mock("jsonwebtoken");
jest.mock("../../services/email.service");

const mockedComparePassword = comparePassword as jest.MockedFunction<
  typeof comparePassword
>;
const mockedHashPassword = hashPassword as jest.MockedFunction<
  typeof hashPassword
>;
const mockedJwtVerify = jwt.verify as jest.Mock;
const { mockUserRepository } = (
  jest.requireMock("../../repositories") as {
    __mockedRepositories: {
      mockUserRepository: {
        findByEmail: jest.Mock;
        updatePassword: jest.Mock;
      };
    };
  }
).__mockedRepositories;
const { updateMany } = (
  jest.requireMock("../../config/database") as {
    __mockedPrisma: { refreshToken: { updateMany: jest.Mock } };
  }
).__mockedPrisma.refreshToken;

const authService = require("../../services/auth.service").default;

const fakeUser = {
  id: "user-123",
  email: "test@example.com",
  passwordHash: "old-hash",
};

const baseInput = {
  email: "test@example.com",
  resetToken: "reset-token",
  newPassword: "newPass123",
  confirmNewPassword: "newPass123",
};

describe("AuthService.resetPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedJwtVerify.mockReturnValue({
      userId: fakeUser.id,
      purpose: "PASSWORD_RESET",
    });
    mockUserRepository.findByEmail.mockResolvedValue(fakeUser);
    mockedComparePassword.mockResolvedValue(false);
    mockedHashPassword.mockResolvedValue("new-hash");
    mockUserRepository.updatePassword.mockResolvedValue(undefined);
    updateMany.mockResolvedValue(undefined);
  });

  it("throws ValidationError when passwords do not match", async () => {
    await expect(
      authService.resetPassword({
        ...baseInput,
        confirmNewPassword: "mismatch",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws AuthenticationError when token purpose is invalid", async () => {
    mockedJwtVerify.mockReturnValue({
      userId: fakeUser.id,
      purpose: "EMAIL_VERIFICATION",
    });

    await expect(authService.resetPassword(baseInput)).rejects.toThrow(
      AuthenticationError,
    );
  });

  it("throws NotFoundError when user is not found", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.resetPassword(baseInput)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws ConflictError when new password matches old password", async () => {
    mockedComparePassword.mockResolvedValue(true);

    await expect(authService.resetPassword(baseInput)).rejects.toThrow(
      ConflictError,
    );
  });

  it("updates password and revokes refresh tokens", async () => {
    const result = await authService.resetPassword(baseInput);

    expect(mockedJwtVerify).toHaveBeenCalledWith(
      baseInput.resetToken,
      "reset-secret",
    );
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      baseInput.email,
    );
    expect(mockedComparePassword).toHaveBeenCalledWith(
      baseInput.newPassword,
      fakeUser.passwordHash,
    );
    expect(mockedHashPassword).toHaveBeenCalledWith(baseInput.newPassword);
    expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
      fakeUser.id,
      "new-hash",
    );
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: fakeUser.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(result).toEqual({
      message:
        "Password reset successfully. Please log in with your new password.",
    });
  });
});
