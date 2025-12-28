import { PrismaClient } from "@prisma/client";
import { UserRepository } from "./user.repository";
import { OTPRepository } from "./otp.repository";
import { RefreshTokenRepository } from "./refreshToken.repository";

/**
 * Repository Factory
 * Provides centralized access to all repositories
 * Ensures single Prisma instance is shared across repositories
 */
export class RepositoryFactory {
  private static instance: RepositoryFactory;
  private prisma: PrismaClient;

  private _userRepository?: UserRepository;
  private _otpRepository?: OTPRepository;
  private _refreshTokenRepository?: RefreshTokenRepository;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(prisma: PrismaClient): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory(prisma);
    }
    return RepositoryFactory.instance;
  }

  /**
   * Get User Repository
   */
  public get userRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository(this.prisma);
    }
    return this._userRepository;
  }

  /**
   * Get OTP Repository
   */
  public get otpRepository(): OTPRepository {
    if (!this._otpRepository) {
      this._otpRepository = new OTPRepository(this.prisma);
    }
    return this._otpRepository;
  }

  /**
   * Get Refresh Token Repository
   */
  public get refreshTokenRepository(): RefreshTokenRepository {
    if (!this._refreshTokenRepository) {
      this._refreshTokenRepository = new RefreshTokenRepository(this.prisma);
    }
    return this._refreshTokenRepository;
  }

  /**
   * Execute transaction across multiple repositories
   */
  public async transaction<T>(
    callback: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return callback(tx as PrismaClient);
    });
  }

  /**
   * Cleanup expired data across all repositories
   */
  public async cleanupExpiredData(): Promise<void> {
    await Promise.all([
      this.otpRepository.deleteExpired(),
      this.refreshTokenRepository.deleteExpired(),
    ]);
  }
}

/**
 * Export individual repositories for direct import
 */
export { UserRepository } from "./user.repository";
export { OTPRepository } from "./otp.repository";
export { RefreshTokenRepository } from "./refreshToken.repository";
