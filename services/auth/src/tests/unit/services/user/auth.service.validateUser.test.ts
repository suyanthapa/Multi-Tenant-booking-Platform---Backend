import { UserRole, UserStatus } from "@prisma/client";
import { NotFoundError } from "../../../../utils/errors";
import { sanitizeUser } from "../../../../utils/sanitizer";
NotFoundError;
jest.mock("../../../../config/database", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({})),
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

describe("AuthService.validateUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository.findById.mockResolvedValue(fakeUser);
    mockedSanitizeUser.mockReturnValue({
      id: fakeUser.id,
      email: fakeUser.email,
      username: fakeUser.username,
    } as any);
  });

  it("throws NotFoundError when user is not found", async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(authService.validateUser("missing-id")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("returns sanitized user when found", async () => {
    const result = await authService.validateUser(fakeUser.id);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(fakeUser.id);
    expect(mockedSanitizeUser).toHaveBeenCalledWith(fakeUser);
    expect(result).toEqual({
      id: fakeUser.id,
      email: fakeUser.email,
      username: fakeUser.username,
    });
  });
});
