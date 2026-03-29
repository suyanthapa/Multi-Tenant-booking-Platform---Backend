import { UserRole, UserStatus } from "@prisma/client";
import { sanitizeUser } from "../../../../utils/sanitizer";
import { NotFoundError } from "../../../../utils/errors";
sanitizeUser;
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
    update: jest.fn(),
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
jest.mock("../../../../utils/sanitizer", () => ({
  sanitizeUser: jest.fn(),
}));

const mockedSanitizeUser = sanitizeUser as jest.MockedFunction<
  typeof sanitizeUser
>;
const { mockUserRepository } = (
  jest.requireMock("../../../../repositories") as {
    __mockedRepositories: {
      mockUserRepository: {
        findById: jest.Mock;
        update: jest.Mock;
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
  status: UserStatus.ACTIVE,
};

const updatedUser = {
  ...fakeUser,
  firstName: "Updated",
};

describe("AuthService.editUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository.findById.mockResolvedValue(fakeUser);
    mockUserRepository.update.mockResolvedValue(updatedUser);
    mockedSanitizeUser.mockReturnValue({
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
    } as any);
  });

  it("throws NotFoundError when user is not found", async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(
      authService.editUser("missing-id", { firstName: "New" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("updates user and returns sanitized user", async () => {
    const result = await authService.editUser(fakeUser.id, {
      firstName: "Updated",
    });

    expect(mockUserRepository.findById).toHaveBeenCalledWith(fakeUser.id);
    expect(mockUserRepository.update).toHaveBeenCalledWith(fakeUser.id, {
      firstName: "Updated",
    });
    expect(mockedSanitizeUser).toHaveBeenCalledWith(updatedUser);
    expect(result).toEqual({
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
    });
  });
});
