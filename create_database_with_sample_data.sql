-- =====================================================
-- Kompletny skrypt SQL do utworzenia bazy danych od nowa
-- oraz wstawienia przykładowych danych
-- =====================================================
-- Baza danych: PostgreSQL
-- Wygenerowano na podstawie schema.prisma
-- =====================================================

-- Usuń istniejące tabele (jeśli istnieją) - UWAGA: usuwa wszystkie dane!
DROP TABLE IF EXISTS "FinancialTransaction" CASCADE;
DROP TABLE IF EXISTS "CompanyPackage" CASCADE;
DROP TABLE IF EXISTS "Consultation" CASCADE;
DROP TABLE IF EXISTS "ForumComment" CASCADE;
DROP TABLE IF EXISTS "ForumPost" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "CourseReview" CASCADE;
DROP TABLE IF EXISTS "CourseEnrollment" CASCADE;
DROP TABLE IF EXISTS "CoursePayment" CASCADE;
DROP TABLE IF EXISTS "Subscription" CASCADE;
DROP TABLE IF EXISTS "CoursePurchase" CASCADE;
DROP TABLE IF EXISTS "CourseVideoFile" CASCADE;
DROP TABLE IF EXISTS "UserFile" CASCADE;
DROP TABLE IF EXISTS "CourseFile" CASCADE;
DROP TABLE IF EXISTS "Course" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- =====================================================
-- TWORZENIE TABEL
-- =====================================================

-- Tabela User
CREATE TABLE "User" (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    "hasBurEntry" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    voivodeship TEXT,
    city TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOnlineCourse" BOOLEAN NOT NULL DEFAULT false,
    "onlinePrice" DOUBLE PRECISION,
    "commissionRate" DOUBLE PRECISION,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isPromoted" BOOLEAN NOT NULL DEFAULT false,
    "promotionEndDate" TIMESTAMP(3),
    "promotionPrice" DOUBLE PRECISION,
    "euFundingPercentage" DOUBLE PRECISION,
    "participantPrice" DOUBLE PRECISION,
    "liveCommissionRate" DOUBLE PRECISION DEFAULT 10,
    "onlineDiscountPercentage" DOUBLE PRECISION DEFAULT 50,
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

-- Tabela Subscription
CREATE TABLE "Subscription" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 29.99,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Tabela CoursePayment
CREATE TABLE "CoursePayment" (
    id TEXT PRIMARY KEY,
    amount DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    status TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "courseId" TEXT UNIQUE,
    CONSTRAINT "CoursePayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "CoursePayment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"(id) ON DELETE CASCADE
);

-- Tabela CourseEnrollment
CREATE TABLE "CourseEnrollment" (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    "participantPricePaid" DOUBLE PRECISION,
    "commissionAmount" DOUBLE PRECISION,
    "organizerEarnings" DOUBLE PRECISION,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"(id) ON DELETE CASCADE,
    CONSTRAINT "CourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "CourseEnrollment_courseId_userId_key" UNIQUE ("courseId", "userId")
);

-- Tabela CourseReview
CREATE TABLE "CourseReview" (
    id TEXT PRIMARY KEY,
    rating INTEGER NOT NULL,
    comment TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "CourseReview_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"(id) ON DELETE CASCADE,
    CONSTRAINT "CourseReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "CourseReview_courseId_userId_key" UNIQUE ("courseId", "userId")
);

-- Tabela Message
CREATE TABLE "Message" (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Tabela ForumPost
CREATE TABLE "ForumPost" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "ForumPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Tabela ForumComment
CREATE TABLE "ForumComment" (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "ForumComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"(id) ON DELETE CASCADE,
    CONSTRAINT "ForumComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Tabela Consultation
CREATE TABLE "Consultation" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    duration INTEGER NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "videoCallLink" TEXT,
    notes TEXT,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "commissionAmount" DOUBLE PRECISION,
    "organizerEarnings" DOUBLE PRECISION,
    "trainerId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Consultation_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "Consultation_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Tabela CompanyPackage
CREATE TABLE "CompanyPackage" (
    id TEXT PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "packageType" TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    duration INTEGER NOT NULL,
    "maxUsers" INTEGER NOT NULL,
    features TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "commissionAmount" DOUBLE PRECISION,
    "organizerEarnings" DOUBLE PRECISION,
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyPackage_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Tabela FinancialTransaction
CREATE TABLE "FinancialTransaction" (
    id TEXT PRIMARY KEY,
    "transactionType" TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    commission DOUBLE PRECISION NOT NULL,
    "organizerEarnings" DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "courseId" TEXT,
    "consultationId" TEXT,
    "companyPackageId" TEXT,
    "enrollmentId" TEXT,
    "purchaseId" TEXT,
    "organizerId" TEXT NOT NULL,
    "participantId" TEXT,
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialTransaction_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"(id) ON DELETE SET NULL,
    CONSTRAINT "FinancialTransaction_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"(id) ON DELETE SET NULL,
    CONSTRAINT "FinancialTransaction_companyPackageId_fkey" FOREIGN KEY ("companyPackageId") REFERENCES "CompanyPackage"(id) ON DELETE SET NULL
);

-- =====================================================
-- TWORZENIE INDEKSÓW
-- =====================================================

CREATE INDEX "Course_organizerId_idx" ON "Course"("organizerId");
CREATE INDEX "CourseFile_courseId_idx" ON "CourseFile"("courseId");
CREATE INDEX "UserFile_userId_idx" ON "UserFile"("userId");
CREATE INDEX "CourseVideoFile_courseId_idx" ON "CourseVideoFile"("courseId");
CREATE INDEX "CoursePurchase_courseId_idx" ON "CoursePurchase"("courseId");
CREATE INDEX "CoursePurchase_userId_idx" ON "CoursePurchase"("userId");
CREATE INDEX "ForumPost_createdAt_idx" ON "ForumPost"("createdAt");
CREATE INDEX "ForumComment_postId_idx" ON "ForumComment"("postId");
CREATE INDEX "Consultation_trainerId_idx" ON "Consultation"("trainerId");
CREATE INDEX "Consultation_participantId_idx" ON "Consultation"("participantId");
CREATE INDEX "Consultation_scheduledDate_idx" ON "Consultation"("scheduledDate");
CREATE INDEX "CompanyPackage_organizerId_idx" ON "CompanyPackage"("organizerId");
CREATE INDEX "CompanyPackage_status_idx" ON "CompanyPackage"("status");
CREATE INDEX "FinancialTransaction_organizerId_idx" ON "FinancialTransaction"("organizerId");
CREATE INDEX "FinancialTransaction_transactionType_idx" ON "FinancialTransaction"("transactionType");
CREATE INDEX "FinancialTransaction_status_idx" ON "FinancialTransaction"("status");
CREATE INDEX "FinancialTransaction_paymentDate_idx" ON "FinancialTransaction"("paymentDate");

-- =====================================================
-- PRZYKŁADOWE DANE
-- =====================================================
-- UWAGA: Wszystkie hasła to "password123"
-- Hash bcrypt dla "password123": $2a$12$mYF0pw3mbdKITJPPQ6LkXuNq1j83GpTGt7R9bjBMfyaAGhi2or3ii

-- Użytkownicy
-- Admin
INSERT INTO "User" (id, email, password, name, role, "hasBurEntry", "createdAt", "updatedAt") VALUES
('admin001', 'admin@example.com', '$2a$12$mYF0pw3mbdKITJPPQ6LkXuNq1j83GpTGt7R9bjBMfyaAGhi2or3ii', 'Administrator Systemu', 'ADMIN', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Organizatorzy
INSERT INTO "User" (id, email, password, name, role, "hasBurEntry", "createdAt", "updatedAt") VALUES
('org001', 'organizator1@example.com', '$2a$12$mYF0pw3mbdKITJPPQ6LkXuNq1j83GpTGt7R9bjBMfyaAGhi2or3ii', 'Jan Kowalski', 'ORGANIZER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('org002', 'organizator2@example.com', '$2a$12$mYF0pw3mbdKITJPPQ6LkXuNq1j83GpTGt7R9bjBMfyaAGhi2or3ii', 'Anna Nowak', 'ORGANIZER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('org003', 'trener1@example.com', '$2a$12$mYF0pw3mbdKITJPPQ6LkXuNq1j83GpTGt7R9bjBMfyaAGhi2or3ii', 'Piotr Wiśniewski', 'ORGANIZER', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Uczestnicy
INSERT INTO "User" (id, email, password, name, role, "hasBurEntry", "createdAt", "updatedAt") VALUES
('part001', 'uczestnik1@example.com', '$2a$12$mYF0pw3mbdKITJPPQ6LkXuNq1j83GpTGt7R9bjBMfyaAGhi2or3ii', 'Marek Zieliński', 'PARTICIPANT', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part002', 'uczestnik2@example.com', '$2a$12$mYF0pw3mbdKITJPPQ6LkXuNq1j83GpTGt7R9bjBMfyaAGhi2or3ii', 'Katarzyna Wójcik', 'PARTICIPANT', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('part003', 'uczestnik3@example.com', '$2a$12$mYF0pw3mbdKITJPPQ6LkXuNq1j83GpTGt7R9bjBMfyaAGhi2or3ii', 'Tomasz Krawczyk', 'PARTICIPANT', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Kursy stacjonarne
INSERT INTO "Course" (id, title, description, type, price, "fundingInfo", "startDate", "endDate", voivodeship, city, "isOnlineCourse", "isPublished", "organizerId", "euFundingPercentage", "participantPrice", "liveCommissionRate", "createdAt", "updatedAt") VALUES
('course001', 'Kurs Excel zaawansowany', 'Kompleksowy kurs Excel dla zaawansowanych użytkowników. Nauczysz się makr, formuł zaawansowanych i analizy danych.', 'STACJONARNY', 2000.00, 'Dofinansowanie z UE do 95%', '2024-06-01 09:00:00', '2024-06-05 17:00:00', 'Mazowieckie', 'Warszawa', false, true, 'org001', 95.0, 100.00, 10.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('course002', 'Kurs programowania Python', 'Od podstaw do zaawansowanych projektów. Idealny dla początkujących i średnio zaawansowanych.', 'STACJONARNY', 3000.00, 'Dofinansowanie z UE do 80%', '2024-07-15 10:00:00', '2024-07-20 16:00:00', 'Śląskie', 'Katowice', false, true, 'org002', 80.0, 600.00, 10.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('course003', 'Kurs grafiki komputerowej', 'Photoshop, Illustrator, InDesign - kompleksowy kurs dla projektantów.', 'STACJONARNY', 2500.00, 'Dofinansowanie z UE do 90%', '2024-08-01 09:00:00', '2024-08-10 17:00:00', 'Małopolskie', 'Kraków', false, true, 'org001', 90.0, 250.00, 10.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Kursy online
INSERT INTO "Course" (id, title, description, type, price, "fundingInfo", "startDate", "endDate", "isOnlineCourse", "onlinePrice", "commissionRate", "isPublished", "organizerId", "createdAt", "updatedAt") VALUES
('course004', 'Kurs JavaScript od podstaw', 'Kompleksowy kurs JavaScript online. Materiały wideo, ćwiczenia praktyczne, certyfikat ukończenia.', 'ONLINE', 500.00, 'Kurs online - dostęp przez 12 miesięcy', '2024-05-01 00:00:00', NULL, true, 299.00, 10.0, true, 'org001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('course005', 'Kurs marketingu internetowego', 'SEO, Google Ads, Facebook Ads - wszystko co musisz wiedzieć o marketingu online.', 'ONLINE', 800.00, 'Kurs online - dostęp przez 12 miesięcy', '2024-05-15 00:00:00', NULL, true, 399.00, 10.0, true, 'org002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('course006', 'Kurs fotografii cyfrowej', 'Nauka fotografii od podstaw. Kompozycja, ekspozycja, edycja zdjęć w Lightroom i Photoshop.', 'ONLINE', 600.00, 'Kurs online - dostęp przez 12 miesięcy', '2024-06-01 00:00:00', NULL, true, 299.00, 10.0, false, 'org003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Kurs z promocją
INSERT INTO "Course" (id, title, description, type, price, "fundingInfo", "startDate", "endDate", "isOnlineCourse", "onlinePrice", "commissionRate", "isPublished", "isPromoted", "promotionEndDate", "promotionPrice", "organizerId", "createdAt", "updatedAt") VALUES
('course007', 'Kurs projektowania UX/UI', 'Kompleksowy kurs projektowania interfejsów użytkownika. Figma, Adobe XD, prototypowanie.', 'ONLINE', 1000.00, 'Kurs online - dostęp przez 12 miesięcy', '2024-05-20 00:00:00', NULL, true, 499.00, 10.0, true, true, '2024-12-31 23:59:59', 349.00, 'org002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Zapisy na kursy stacjonarne
INSERT INTO "CourseEnrollment" (id, status, "enrolledAt", "courseId", "userId", "participantPricePaid", "commissionAmount", "organizerEarnings", "createdAt", "updatedAt") VALUES
('enroll001', 'CONFIRMED', '2024-04-15 10:00:00', 'course001', 'part001', 100.00, 20.00, 180.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll002', 'PENDING', '2024-04-20 14:30:00', 'course001', 'part002', NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll003', 'CONFIRMED', '2024-05-01 09:00:00', 'course002', 'part003', 600.00, 60.00, 540.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Zakupy kursów online
INSERT INTO "CoursePurchase" (id, "purchaseDate", price, commission, "courseId", "userId") VALUES
('purchase001', '2024-04-10 12:00:00', 299.00, 29.90, 'course004', 'part001'),
('purchase002', '2024-04-25 15:30:00', 399.00, 39.90, 'course005', 'part002'),
('purchase003', '2024-05-05 10:15:00', 299.00, 29.90, 'course004', 'part003');

-- Recenzje kursów
INSERT INTO "CourseReview" (id, rating, comment, "courseId", "userId", "createdAt", "updatedAt") VALUES
('review001', 5, 'Świetny kurs! Wszystko bardzo dobrze wytłumaczone. Polecam!', 'course004', 'part001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('review002', 4, 'Dobry kurs, ale mogłoby być więcej przykładów praktycznych.', 'course005', 'part002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('review003', 5, 'Najlepszy kurs JavaScript jaki miałem okazję przejść. Warto!', 'course004', 'part003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Subskrypcje
INSERT INTO "Subscription" (id, "userId", status, "startDate", "endDate", "monthlyPrice", "createdAt", "updatedAt") VALUES
('sub001', 'part001', 'ACTIVE', '2024-04-01 00:00:00', '2024-05-01 00:00:00', 29.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sub002', 'part002', 'ACTIVE', '2024-03-15 00:00:00', '2024-04-15 00:00:00', 29.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Płatności za dodanie kursów
INSERT INTO "CoursePayment" (id, amount, status, "paymentDate", "userId", "courseId", "createdAt", "updatedAt") VALUES
('payment001', 100.00, 'COMPLETED', '2024-03-20 10:00:00', 'org001', 'course001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payment002', 100.00, 'COMPLETED', '2024-04-01 11:30:00', 'org002', 'course002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payment003', 100.00, 'COMPLETED', '2024-04-15 09:15:00', 'org001', 'course003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payment004', 100.00, 'COMPLETED', '2024-03-25 14:00:00', 'org001', 'course004', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payment005', 100.00, 'COMPLETED', '2024-04-10 16:20:00', 'org002', 'course005', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Konsultacje
INSERT INTO "Consultation" (id, title, description, "pricePerHour", duration, "scheduledDate", status, "commissionRate", "commissionAmount", "organizerEarnings", "trainerId", "participantId", "createdAt", "updatedAt") VALUES
('consult001', 'Konsultacja z programowania', 'Pomoc w zrozumieniu zaawansowanych konceptów programowania', 150.00, 60, '2024-06-10 14:00:00', 'CONFIRMED', 10.0, 15.00, 135.00, 'org003', 'part001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('consult002', 'Konsultacja marketingowa', 'Analiza strategii marketingowej i plan działania', 200.00, 90, '2024-06-15 10:00:00', 'PENDING', 10.0, NULL, NULL, 'org002', 'part002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Pakiety firmowe
INSERT INTO "CompanyPackage" (id, "companyName", "contactEmail", "contactPhone", "packageType", price, duration, "maxUsers", features, status, "startDate", "endDate", "commissionRate", "commissionAmount", "organizerEarnings", "organizerId", "createdAt", "updatedAt") VALUES
('package001', 'Firma ABC Sp. z o.o.', 'kontakt@firmaabc.pl', '+48 123 456 789', 'PREMIUM', 5000.00, 12, 50, '{"features": ["Dostęp do wszystkich kursów", "Konsultacje grupowe", "Certyfikaty", "Wsparcie techniczne"]}', 'ACTIVE', '2024-01-01 00:00:00', '2024-12-31 23:59:59', 10.0, 500.00, 4500.00, 'org001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Transakcje finansowe
INSERT INTO "FinancialTransaction" (id, "transactionType", amount, commission, "organizerEarnings", status, "courseId", "enrollmentId", "organizerId", "participantId", "paymentDate", "paymentMethod", "createdAt", "updatedAt") VALUES
('trans001', 'COURSE_LIVE', 200.00, 20.00, 180.00, 'COMPLETED', 'course001', 'enroll001', 'org001', 'part001', '2024-04-15 10:00:00', 'TRANSFER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('trans002', 'COURSE_LIVE', 1200.00, 120.00, 1080.00, 'COMPLETED', 'course002', 'enroll003', 'org002', 'part003', '2024-05-01 09:00:00', 'TRANSFER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('trans003', 'COURSE_ONLINE', 299.00, 29.90, 269.10, 'COMPLETED', 'course004', NULL, 'org001', 'part001', '2024-04-10 12:00:00', 'STRIPE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('trans004', 'CONSULTATION', 150.00, 15.00, 135.00, 'COMPLETED', NULL, NULL, 'org003', 'part001', '2024-06-10 14:00:00', 'STRIPE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('trans005', 'COMPANY_PACKAGE', 5000.00, 500.00, 4500.00, 'COMPLETED', NULL, NULL, 'org001', NULL, '2024-01-01 00:00:00', 'TRANSFER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Posty na forum
INSERT INTO "ForumPost" (id, title, content, "authorId", "createdAt", "updatedAt") VALUES
('post001', 'Jak zacząć z programowaniem?', 'Witam! Jestem początkujący i chciałbym się dowiedzieć, od czego najlepiej zacząć naukę programowania. Jakie kursy polecacie?', 'part001', '2024-04-20 10:00:00', CURRENT_TIMESTAMP),
('post002', 'Najlepsze praktyki w Excelu', 'Dzielę się moimi doświadczeniami z zaawansowanego Excela. Jakie funkcje są najbardziej przydatne w pracy?', 'org001', '2024-04-25 14:30:00', CURRENT_TIMESTAMP);

-- Komentarze na forum
INSERT INTO "ForumComment" (id, content, "postId", "authorId", "createdAt", "updatedAt") VALUES
('comment001', 'Polecam zacząć od kursu JavaScript od podstaw - świetny materiał!', 'post001', 'part002', '2024-04-20 11:00:00', CURRENT_TIMESTAMP),
('comment002', 'Zgadzam się, JavaScript to dobry wybór na początek. Dodatkowo polecam kurs Pythona.', 'post001', 'org001', '2024-04-20 12:00:00', CURRENT_TIMESTAMP),
('comment003', 'Dzięki za podzielenie się doświadczeniami! VLOOKUP i INDEX/MATCH to podstawa.', 'post002', 'part003', '2024-04-25 15:00:00', CURRENT_TIMESTAMP);

-- Wiadomości
INSERT INTO "Message" (id, content, "isRead", "senderId", "receiverId", "createdAt") VALUES
('msg001', 'Cześć! Chciałbym zapytać o szczegóły kursu Excel zaawansowany.', false, 'part001', 'org001', '2024-04-18 09:00:00'),
('msg002', 'Oczywiście! Kurs trwa 5 dni, zajęcia od 9:00 do 17:00. Masz jakieś konkretne pytania?', true, 'org001', 'part001', '2024-04-18 10:30:00'),
('msg003', 'Czy kurs jest dostępny również w weekendy?', false, 'part002', 'org001', '2024-04-19 14:00:00');

-- =====================================================
-- UWAGI KOŃCOWE
-- =====================================================
-- 1. Wszystkie hasła użytkowników to: password123
--    Hash bcrypt został wygenerowany i jest już wstawiony w danych przykładowych
--
-- 2. Przykładowe dane obejmują:
--    - 1 administratora
--    - 3 organizatorów
--    - 3 uczestników
--    - 7 kursów (4 stacjonarne, 3 online)
--    - 3 zapisy na kursy
--    - 3 zakupy kursów online
--    - 3 recenzje
--    - 2 subskrypcje
--    - 5 płatności za kursy
--    - 2 konsultacje
--    - 1 pakiet firmowy
--    - 5 transakcji finansowych
--    - 2 posty na forum
--    - 3 komentarze
--    - 3 wiadomości
--
-- 3. Przed użyciem w produkcji:
--    - Hashe bcrypt dla wszystkich użytkowników są już wygenerowane (hasło: password123)
--    - Zaktualizuj daty na aktualne
--    - Sprawdź wszystkie relacje między tabelami
--    - Upewnij się, że wszystkie wymagane pola są wypełnione
--    - Rozważ zmianę haseł użytkowników na silniejsze
--
-- 4. Aby użyć tego skryptu:
--    - Połącz się z bazą danych PostgreSQL
--    - Uruchom cały skrypt lub wybierz odpowiednie sekcje
--    - Sprawdź czy wszystkie tabele zostały utworzone poprawnie

