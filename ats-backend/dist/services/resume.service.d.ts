export declare class ResumeService {
    createResume(userId: string, title: string, content: any, templateId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        extractedText: string | null;
        status: string;
        isPublic: boolean;
        optimizationScore: number | null;
        originalFileUrl: string | null;
        exportedPdfUrl: string | null;
        lastAccessedAt: Date | null;
        version: number;
        templateId: string | null;
        aiOptimizedForJdId: string | null;
        parentResumeId: string | null;
    }>;
    getResumes(userId: string, page?: number, limit?: number, status?: string): Promise<{
        resumes: ({
            template: {
                id: string;
                name: string;
                category: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            title: string;
            content: import("@prisma/client/runtime/library").JsonValue;
            extractedText: string | null;
            status: string;
            isPublic: boolean;
            optimizationScore: number | null;
            originalFileUrl: string | null;
            exportedPdfUrl: string | null;
            lastAccessedAt: Date | null;
            version: number;
            templateId: string | null;
            aiOptimizedForJdId: string | null;
            parentResumeId: string | null;
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getResumeById(resumeId: string, userId: string): Promise<{
        template: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            category: string | null;
            design: import("@prisma/client/runtime/library").JsonValue;
            previewImageUrl: string | null;
            demoResumeId: string | null;
            isActive: boolean;
            isPremium: boolean;
            atsScore: number | null;
            usageCount: number;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        extractedText: string | null;
        status: string;
        isPublic: boolean;
        optimizationScore: number | null;
        originalFileUrl: string | null;
        exportedPdfUrl: string | null;
        lastAccessedAt: Date | null;
        version: number;
        templateId: string | null;
        aiOptimizedForJdId: string | null;
        parentResumeId: string | null;
    }>;
    updateResume(resumeId: string, userId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        extractedText: string | null;
        status: string;
        isPublic: boolean;
        optimizationScore: number | null;
        originalFileUrl: string | null;
        exportedPdfUrl: string | null;
        lastAccessedAt: Date | null;
        version: number;
        templateId: string | null;
        aiOptimizedForJdId: string | null;
        parentResumeId: string | null;
    }>;
    deleteResume(resumeId: string, userId: string): Promise<void>;
}
//# sourceMappingURL=resume.service.d.ts.map