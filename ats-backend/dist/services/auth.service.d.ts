import jwt from 'jsonwebtoken';
export declare class AuthService {
    register(email: string, password: string, firstName?: string, lastName?: string): Promise<{
        user: {
            id: string;
            email: string;
            emailVerified: boolean;
            passwordHash: string;
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            profilePictureUrl: string | null;
            subscriptionTier: string;
            subscriptionStartDate: Date | null;
            subscriptionEndDate: Date | null;
            resumesCreated: number;
            analysesRunToday: number;
            lastAnalysisDate: Date | null;
            aiGenerationsToday: number;
            aiOptimizationsToday: number;
            createdAt: Date;
            updatedAt: Date;
            lastLoginAt: Date | null;
            deletedAt: Date | null;
            settings: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(email: string, password: string): Promise<{
        user: {
            id: string;
            email: string;
            emailVerified: boolean;
            passwordHash: string;
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            profilePictureUrl: string | null;
            subscriptionTier: string;
            subscriptionStartDate: Date | null;
            subscriptionEndDate: Date | null;
            resumesCreated: number;
            analysesRunToday: number;
            lastAnalysisDate: Date | null;
            aiGenerationsToday: number;
            aiOptimizationsToday: number;
            createdAt: Date;
            updatedAt: Date;
            lastLoginAt: Date | null;
            deletedAt: Date | null;
            settings: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    private generateAccessToken;
    private generateRefreshToken;
    verifyAccessToken(token: string): string | jwt.JwtPayload;
}
//# sourceMappingURL=auth.service.d.ts.map