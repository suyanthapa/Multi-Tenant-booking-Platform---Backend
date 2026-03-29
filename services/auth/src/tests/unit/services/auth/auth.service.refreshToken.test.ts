import { UserRole, UserStatus } from "@prisma/client";
import businessClient from "../../../../clients/businessClient";
import { InvalidTokenError, NotFoundError } from "../../../../utils/errors";
import { generateTokenPair, verifyRefreshToken } from "../../../../utils/jwt";
("../../../../../../clients/businessClient");

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
    rotateToken: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    findValidToken: jest.fn(),
  };

  return {
    RepositoryFactory: {
      getInstance: jest.fn(() => ({
        userRepository: mockUserRepository,
        refreshTokenRepository: mockRefreshTokenRepository,
      })),
    },
    __mockedRepositories: {
      mockUserRepository,
      mockRefreshTokenRepository,
    },
  };
});

jest.mock("../../../../utils/jwt");
jest.mock("../../../../clients/businessClient");
jest.mock("../../../../services/email.service");

const mockedVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<
  typeof verifyRefreshToken
>;
const mockedGenerateTokenPair = generateTokenPair as jest.MockedFunction<
  typeof generateTokenPair
>;
const mockedBusinessClient = businessClient as jest.Mocked<
  typeof businessClient
>;
const { mockUserRepository, mockRefreshTokenRepository } = (
  jest.requireMock("../../../../repositories") as {
    __mockedRepositories: {
      mockUserRepository: {
        findById: jest.Mock;
        rotateToken: jest.Mock;
      };
      mockRefreshTokenRepository: {
        findValidToken: jest.Mock;
      };
    };
  }
).__mockedRepositories;

const authService = require("../../../../services/auth.service").default;

const fakePayload = {
  id: "user-123",
  email: "test@example.com",
  role: UserRole.CUSTOMER,
};

const fakeUser = {
  id: "user-123",
  email: "test@example.com",
  username: "testuser",
  role: UserRole.CUSTOMER,
  status: UserStatus.ACTIVE,
};

const fakeTokenRecord = {
  id: "rt-123",
};

const fakeTokens = {
  accessToken: "new-access-token",
  refreshToken: "new-refresh-token",
};

describe("AuthService.refreshToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedVerifyRefreshToken.mockReturnValue(fakePayload);
    mockRefreshTokenRepository.findValidToken.mockResolvedValue(
      fakeTokenRecord,
    );
    mockUserRepository.findById.mockResolvedValue(fakeUser);
    mockedBusinessClient.validateBusinessByOwner.mockResolvedValue(null);
    mockedGenerateTokenPair.mockReturnValue(fakeTokens);
    mockUserRepository.rotateToken.mockResolvedValue(undefined);
  });

  it("returns new token pair and rotates refresh token", async () => {
    const result = await authService.refreshToken("old-refresh-token");

    expect(mockedVerifyRefreshToken).toHaveBeenCalledWith("old-refresh-token");
    expect(mockRefreshTokenRepository.findValidToken).toHaveBeenCalledWith(
      "old-refresh-token",
      fakePayload.id,
    );
    expect(mockUserRepository.findById).toHaveBeenCalledWith(fakePayload.id);
    expect(mockedGenerateTokenPair).toHaveBeenCalledWith(
      expect.objectContaining({
        id: fakeUser.id,
        email: fakeUser.email,
        role: fakeUser.role,
      }),
    );
    expect(mockUserRepository.rotateToken).toHaveBeenCalledWith(
      fakeTokenRecord.id,
      fakeUser.id,
      fakeTokens.refreshToken,
      expect.any(Date),
    );
    expect(result).toEqual(fakeTokens);
  });

  it("throws InvalidTokenError when refresh token is invalid", async () => {
    mockRefreshTokenRepository.findValidToken.mockResolvedValue(null);

    await expect(authService.refreshToken("bad-refresh-token")).rejects.toThrow(
      InvalidTokenError,
    );
  });

  it("throws NotFoundError when user is not found", async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(authService.refreshToken("old-refresh-token")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws NotFoundError when user is inactive", async () => {
    mockUserRepository.findById.mockResolvedValue({
      ...fakeUser,
      status: UserStatus.SUSPENDED,
    });

    await expect(authService.refreshToken("old-refresh-token")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("includes businessId in token payload when business exists", async () => {
    mockedBusinessClient.validateBusinessByOwner.mockResolvedValue({
      businessId: "biz-123",
      status: "ACTIVE",
    });

    await authService.refreshToken("old-refresh-token");

    expect(mockedGenerateTokenPair).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "biz-123",
      }),
    );
  });
});
