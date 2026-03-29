import { UserRole, UserStatus } from "@prisma/client";
import { NotFoundError } from "../../../../utils/errors";

jest.mock("../../../../config/database", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({})),
  },
}));

jest.mock("../../../../config", () => ({
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

jest.mock("../../../../repositories", () => {
  const mockUserRepository = {
    findById: jest.fn(),
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

jest.mock("../../../../services/email.service");

const { mockUserRepository } = (
  jest.requireMock("../../../../repositories") as {
    __mockedRepositories: {
      mockUserRepository: {
        findById: jest.Mock;
      };
    };
  }
).__mockedRepositories;

const authService = require("../../../../services/auth.service").default;

const fakeUser = {
  id: "user-123",
  email: "test@example.com",
  username: "testuser",
  firstName: "Test",
  lastName: "User",
  phone: "1234567890",
  role: UserRole.CUSTOMER,
  status: UserStatus.ACTIVE,
  isEmailVerified: true,
  lastLoginAt: new Date("2025-01-01T00:00:00.000Z"),
  createdAt: new Date("2024-12-01T00:00:00.000Z"),
};

describe("AuthService.getProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository.findById.mockResolvedValue(fakeUser);
  });

  it("throws NotFoundError when user is not found", async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(authService.getProfile("missing-id")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("returns user profile data", async () => {
    const result = await authService.getProfile(fakeUser.id);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(fakeUser.id);
    expect(result).toEqual({
      id: fakeUser.id,
      email: fakeUser.email,
      username: fakeUser.username,
      firstName: fakeUser.firstName,
      lastName: fakeUser.lastName,
      phone: fakeUser.phone,
      role: fakeUser.role,
      status: fakeUser.status,
      isEmailVerified: fakeUser.isEmailVerified,
      lastLoginAt: fakeUser.lastLoginAt,
      createdAt: fakeUser.createdAt,
    });
  });
});
