import { UserRole, UserStatus } from "@prisma/client";

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
    findWithPagination: jest.fn(),
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
        findWithPagination: jest.Mock;
      };
    };
  }
).__mockedRepositories;

const authService = require("../../../../services/auth.service").default;

const fakeUsers = [
  {
    id: "user-1",
    email: "one@example.com",
    username: "userone",
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
  },
  {
    id: "user-2",
    email: "two@example.com",
    username: "usertwo",
    role: UserRole.VENDOR,
    status: UserStatus.SUSPENDED,
  },
];

describe("AuthService.getAllUsers", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository.findWithPagination.mockResolvedValue({
      users: fakeUsers,
      total: 2,
      page: 1,
      limit: 10,
    });
  });

  it("returns paginated users with metadata", async () => {
    const result = await authService.getAllUsers({
      page: 1,
      limit: 10,
      status: UserStatus.ACTIVE,
      role: UserRole.CUSTOMER,
    });

    expect(mockUserRepository.findWithPagination).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      status: UserStatus.ACTIVE,
      role: UserRole.CUSTOMER,
    });
    expect(result).toEqual({
      data: fakeUsers,
      meta: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });
  });

  it("uses default pagination values", async () => {
    await authService.getAllUsers({});

    expect(mockUserRepository.findWithPagination).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      status: undefined,
      role: undefined,
    });
  });
});
