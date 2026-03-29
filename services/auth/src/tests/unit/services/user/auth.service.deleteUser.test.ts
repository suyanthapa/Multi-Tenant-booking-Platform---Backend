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
    delete: jest.fn(),
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
        delete: jest.Mock;
      };
    };
  }
).__mockedRepositories;

const authService = require("../../../../services/auth.service").default;

describe("AuthService.deleteUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository.findById.mockResolvedValue({ id: "user-123" });
    mockUserRepository.delete.mockResolvedValue(undefined);
  });

  it("throws NotFoundError when user is not found", async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(authService.deleteUser("missing-id")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("deletes user when found", async () => {
    await authService.deleteUser("user-123");

    expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123");
    expect(mockUserRepository.delete).toHaveBeenCalledWith("user-123");
  });
});
