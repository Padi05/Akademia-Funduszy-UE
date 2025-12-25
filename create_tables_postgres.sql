-- SQL do utworzenia tabel w neon.tech (PostgreSQL)
-- Wygenerowano na podstawie schema.prisma

-- Tabela User
CREATE TABLE "User" (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    "hasBurEntry" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Tabela Course
CREATE TABLE "Course" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    "fundingInfo" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isOnlineCourse" BOOLEAN NOT NULL DEFAULT false,
    "onlinePrice" DOUBLE PRECISION,
    "commissionRate" DOUBLE PRECISION,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "organizerId" TEXT NOT NULL,
    CONSTRAINT "Course_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Tabela CourseFile
CREATE TABLE "CourseFile" (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT NOT NULL,
    CONSTRAINT "CourseFile_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"(id) ON DELETE CASCADE
);

-- Tabela UserFile
CREATE TABLE "UserFile" (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Tabela CourseVideoFile
CREATE TABLE "CourseVideoFile" (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    duration INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT NOT NULL,
    CONSTRAINT "CourseVideoFile_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"(id) ON DELETE CASCADE
);

-- Tabela CoursePurchase
CREATE TABLE "CoursePurchase" (
    id TEXT PRIMARY KEY,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    price DOUBLE PRECISION NOT NULL,
    commission DOUBLE PRECISION NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "CoursePurchase_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"(id) ON DELETE CASCADE,
    CONSTRAINT "CoursePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Indeksy dla lepszej wydajności
CREATE INDEX "Course_organizerId_idx" ON "Course"("organizerId");
CREATE INDEX "CourseFile_courseId_idx" ON "CourseFile"("courseId");
CREATE INDEX "UserFile_userId_idx" ON "UserFile"("userId");
CREATE INDEX "CourseVideoFile_courseId_idx" ON "CourseVideoFile"("courseId");
CREATE INDEX "CoursePurchase_courseId_idx" ON "CoursePurchase"("courseId");
CREATE INDEX "CoursePurchase_userId_idx" ON "CoursePurchase"("userId");

