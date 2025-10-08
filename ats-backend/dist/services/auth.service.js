"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AuthService {
    async register(email, password, firstName, lastName) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('User already exists');
        }
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
            },
        });
        // Generate tokens
        const accessToken = this.generateAccessToken(user.id, email);
        const refreshToken = this.generateRefreshToken(user.id);
        return { user, accessToken, refreshToken };
    }
    async login(email, password) {
        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        // Verify password
        const isValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        // Generate tokens
        const accessToken = this.generateAccessToken(user.id, user.email);
        const refreshToken = this.generateRefreshToken(user.id);
        return { user, accessToken, refreshToken };
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            if (!user) {
                throw new Error('User not found');
            }
            const accessToken = this.generateAccessToken(user.id, user.email);
            const newRefreshToken = this.generateRefreshToken(user.id);
            return { accessToken, refreshToken: newRefreshToken };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    generateAccessToken(userId, email) {
        return jsonwebtoken_1.default.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    }
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    }
    verifyAccessToken(token) {
        return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map