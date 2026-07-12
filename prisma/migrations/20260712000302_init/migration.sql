-- CreateTable
CREATE TABLE "school_years" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "beginDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "school_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "districtId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "coordinator" TEXT,
    "vrQuadrant" TEXT,
    "serviceArea" TEXT,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "districtId" TEXT NOT NULL,
    "schoolCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT,
    "schoolType" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "mailingAddress" TEXT,
    "mailingCity" TEXT,
    "mailingState" TEXT NOT NULL,
    "mailingZip" TEXT,
    "vrFirstName" TEXT,
    "vrLastName" TEXT,
    "vrOffice" TEXT,
    "vrEmail" TEXT,
    "lnFirstName" TEXT,
    "lnLastName" TEXT,
    "lnOfficePhone" TEXT,
    "lnOfficePhoneExt" TEXT,
    "lnMobilePhone" TEXT,
    "lnEmail" TEXT,
    "sslFirstName" TEXT,
    "sslLastName" TEXT,
    "sslOfficePhone" TEXT,
    "sslOfficePhoneExt" TEXT,
    "sslMobilePhone" TEXT,
    "sslEmail" TEXT,
    "ss1" INTEGER NOT NULL DEFAULT 0,
    "ss2" INTEGER NOT NULL DEFAULT 0,
    "ss3" INTEGER NOT NULL DEFAULT 0,
    "ss4" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinators" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "coordinators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_users" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "userName" TEXT,
    "passwordHash" TEXT,
    "accessLevel" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "name" TEXT,
    "vendorCode" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "email" TEXT,
    "contact" TEXT,
    "phone" TEXT,
    "notes" TEXT,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_codes" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "billingCode" TEXT,
    "fee" DECIMAL(10,2),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "billing_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "activityDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "schoolId" INTEGER NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "billed" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preets" TEXT,
    "coordinatorId" INTEGER,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_items" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "activityItemId" INTEGER NOT NULL,
    "group" TEXT,
    "description" TEXT NOT NULL,
    "billingCode" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "activity_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_details" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "activityItemId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "hsht" BOOLEAN NOT NULL DEFAULT false,
    "hshtCoordinator" TEXT,
    "other" BOOLEAN NOT NULL DEFAULT false,
    "otherDetail" TEXT,

    CONSTRAINT "activity_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "activityId" INTEGER,
    "totalAmount" DECIMAL(10,2),
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "activityDetailsId" INTEGER NOT NULL,
    "billingCodeId" INTEGER,
    "fee" DECIMAL(10,2),
    "quantity" DECIMAL(10,2),
    "billed" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "emailAddress" TEXT,
    "streetAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "county" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "gender" TEXT,
    "race" TEXT,
    "raceOther" TEXT,
    "ethnicHeritage" TEXT,
    "autism" BOOLEAN NOT NULL DEFAULT false,
    "aspergers" BOOLEAN NOT NULL DEFAULT false,
    "deaf" BOOLEAN NOT NULL DEFAULT false,
    "ebd" BOOLEAN NOT NULL DEFAULT false,
    "mobility" BOOLEAN NOT NULL DEFAULT false,
    "ohi" BOOLEAN NOT NULL DEFAULT false,
    "orthopedic" BOOLEAN NOT NULL DEFAULT false,
    "speech" BOOLEAN NOT NULL DEFAULT false,
    "sld" BOOLEAN NOT NULL DEFAULT false,
    "spinal" BOOLEAN NOT NULL DEFAULT false,
    "tbi" BOOLEAN NOT NULL DEFAULT false,
    "visual" BOOLEAN NOT NULL DEFAULT false,
    "otherDisability" BOOLEAN NOT NULL DEFAULT false,
    "otherInfo" TEXT,
    "section504" BOOLEAN NOT NULL DEFAULT false,
    "grade" TEXT,
    "enterDate" TEXT,
    "graduated" BOOLEAN NOT NULL DEFAULT false,
    "graduateDate" TIMESTAMP(3),
    "employmentDate" TIMESTAMP(3),
    "employment" TEXT,
    "eip" BOOLEAN NOT NULL DEFAULT false,
    "vrc" TEXT,
    "hshtCoordinator" TEXT,
    "reportableStudent" BOOLEAN NOT NULL DEFAULT false,
    "receivedForm" BOOLEAN NOT NULL DEFAULT false,
    "vocationalRehab" BOOLEAN NOT NULL DEFAULT false,
    "reportableCheck" BOOLEAN NOT NULL DEFAULT false,
    "vrCaseloadCheck" BOOLEAN NOT NULL DEFAULT false,
    "enrollDate" TIMESTAMP(3),
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_archive" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "schoolYear" TEXT,
    "schoolId" INTEGER NOT NULL,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "emailAddress" TEXT,
    "streetAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "county" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "gender" TEXT,
    "race" TEXT,
    "raceOther" TEXT,
    "ethnicHeritage" TEXT,
    "grade" TEXT,
    "enrollDate" TIMESTAMP(3),
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_archive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_activities" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "billed" BOOLEAN NOT NULL DEFAULT false,
    "billDate" TIMESTAMP(3),
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "invoiceId" INTEGER,

    CONSTRAINT "student_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_invoice_items" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "activityDetailsId" INTEGER NOT NULL,
    "billingCodeId" INTEGER,
    "fee" DECIMAL(10,2),
    "quantity" DECIMAL(10,2),
    "billed" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "student_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_notes" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "noteDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,

    CONSTRAINT "student_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_history" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "historyDate" TIMESTAMP(3) NOT NULL,
    "historyEvent" TEXT NOT NULL,

    CONSTRAINT "student_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_outcomes" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "graduated" BOOLEAN,
    "graduateDate" TIMESTAMP(3),
    "employment" TEXT,
    "employmentDate" TIMESTAMP(3),
    "postSecondary" TEXT,
    "postSecondaryDate" TIMESTAMP(3),

    CONSTRAINT "student_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_equipment" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "equipmentType" TEXT,
    "modelNumber" TEXT,
    "serialNumber" TEXT,
    "dateIssued" TIMESTAMP(3),
    "assistiveTechnology" TEXT,

    CONSTRAINT "student_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_program_codes" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "programCode" TEXT NOT NULL,

    CONSTRAINT "student_program_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_participation_ids" (
    "id" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "participationId" INTEGER NOT NULL,

    CONSTRAINT "student_participation_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_forms" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'EnrollmentForm',
    "schoolId" INTEGER NOT NULL,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "emailAddress" TEXT,
    "streetAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "county" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "gender" TEXT,
    "race" TEXT,
    "raceOther" TEXT,
    "ethnicHeritage" TEXT,
    "autism" BOOLEAN NOT NULL DEFAULT false,
    "aspergers" BOOLEAN NOT NULL DEFAULT false,
    "deaf" BOOLEAN NOT NULL DEFAULT false,
    "ebd" BOOLEAN NOT NULL DEFAULT false,
    "mobility" BOOLEAN NOT NULL DEFAULT false,
    "ohi" BOOLEAN NOT NULL DEFAULT false,
    "orthopedic" BOOLEAN NOT NULL DEFAULT false,
    "speech" BOOLEAN NOT NULL DEFAULT false,
    "sld" BOOLEAN NOT NULL DEFAULT false,
    "spinal" BOOLEAN NOT NULL DEFAULT false,
    "tbi" BOOLEAN NOT NULL DEFAULT false,
    "visual" BOOLEAN NOT NULL DEFAULT false,
    "otherDisability" BOOLEAN NOT NULL DEFAULT false,
    "otherInfo" TEXT,
    "grade" TEXT,
    "enterDate" TEXT,
    "graduated" BOOLEAN NOT NULL DEFAULT false,
    "graduateDate" TIMESTAMP(3),
    "employmentDate" TIMESTAMP(3),
    "employment" TEXT,
    "eip" BOOLEAN NOT NULL DEFAULT false,
    "vrc" TEXT,
    "hshtCoordinator" TEXT,
    "reportableStudent" BOOLEAN NOT NULL DEFAULT false,
    "section504" BOOLEAN NOT NULL DEFAULT false,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureStudent" TEXT,
    "signatureParent" TEXT,

    CONSTRAINT "enrollment_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_form_history" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "historyDate" TIMESTAMP(3) NOT NULL,
    "historyEvent" TEXT NOT NULL,

    CONSTRAINT "enrollment_form_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "logDate" TIMESTAMP(3) NOT NULL,
    "userName" TEXT,
    "logEvent" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_years_legacyId_key" ON "school_years"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "districts_legacyId_key" ON "districts"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "districts_districtId_key" ON "districts"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "schools_legacyId_key" ON "schools"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "schools_schoolCode_key" ON "schools"("schoolCode");

-- CreateIndex
CREATE INDEX "schools_districtId_idx" ON "schools"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "coordinators_legacyId_key" ON "coordinators"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_legacyId_key" ON "staff_users"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_legacyId_key" ON "vendors"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_codes_legacyId_key" ON "billing_codes"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "activities_legacyId_key" ON "activities"("legacyId");

-- CreateIndex
CREATE INDEX "activities_schoolId_idx" ON "activities"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_items_legacyId_key" ON "activity_items"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_items_activityItemId_key" ON "activity_items"("activityItemId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_details_legacyId_key" ON "activity_details"("legacyId");

-- CreateIndex
CREATE INDEX "activity_details_activityId_idx" ON "activity_details"("activityId");

-- CreateIndex
CREATE INDEX "activity_details_activityItemId_idx" ON "activity_details"("activityItemId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_legacyId_key" ON "invoices"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_items_legacyId_key" ON "invoice_items"("legacyId");

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "students_legacyId_key" ON "students"("legacyId");

-- CreateIndex
CREATE INDEX "students_schoolId_idx" ON "students"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "student_archive_legacyId_key" ON "student_archive"("legacyId");

-- CreateIndex
CREATE INDEX "student_archive_studentId_idx" ON "student_archive"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_activities_legacyId_key" ON "student_activities"("legacyId");

-- CreateIndex
CREATE INDEX "student_activities_activityId_idx" ON "student_activities"("activityId");

-- CreateIndex
CREATE INDEX "student_activities_studentId_idx" ON "student_activities"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_invoice_items_legacyId_key" ON "student_invoice_items"("legacyId");

-- CreateIndex
CREATE INDEX "student_invoice_items_studentId_idx" ON "student_invoice_items"("studentId");

-- CreateIndex
CREATE INDEX "student_invoice_items_invoiceId_idx" ON "student_invoice_items"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "student_notes_legacyId_key" ON "student_notes"("legacyId");

-- CreateIndex
CREATE INDEX "student_notes_studentId_idx" ON "student_notes"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_history_legacyId_key" ON "student_history"("legacyId");

-- CreateIndex
CREATE INDEX "student_history_studentId_idx" ON "student_history"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_outcomes_legacyId_key" ON "student_outcomes"("legacyId");

-- CreateIndex
CREATE INDEX "student_outcomes_studentId_idx" ON "student_outcomes"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_equipment_legacyId_key" ON "student_equipment"("legacyId");

-- CreateIndex
CREATE INDEX "student_equipment_studentId_idx" ON "student_equipment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_program_codes_legacyId_key" ON "student_program_codes"("legacyId");

-- CreateIndex
CREATE INDEX "student_program_codes_studentId_idx" ON "student_program_codes"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_participation_ids_studentId_participationId_key" ON "student_participation_ids"("studentId", "participationId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_forms_legacyId_key" ON "enrollment_forms"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_form_history_legacyId_key" ON "enrollment_form_history"("legacyId");

-- CreateIndex
CREATE INDEX "enrollment_form_history_studentId_idx" ON "enrollment_form_history"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "audit_log_legacyId_key" ON "audit_log"("legacyId");

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("districtId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_details" ADD CONSTRAINT "activity_details_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_details" ADD CONSTRAINT "activity_details_activityItemId_fkey" FOREIGN KEY ("activityItemId") REFERENCES "activity_items"("activityItemId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("legacyId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_activityDetailsId_fkey" FOREIGN KEY ("activityDetailsId") REFERENCES "activity_details"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_billingCodeId_fkey" FOREIGN KEY ("billingCodeId") REFERENCES "billing_codes"("legacyId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_activities" ADD CONSTRAINT "student_activities_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_activities" ADD CONSTRAINT "student_activities_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_activities" ADD CONSTRAINT "student_activities_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_activities" ADD CONSTRAINT "student_activities_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("legacyId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invoice_items" ADD CONSTRAINT "student_invoice_items_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invoice_items" ADD CONSTRAINT "student_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invoice_items" ADD CONSTRAINT "student_invoice_items_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invoice_items" ADD CONSTRAINT "student_invoice_items_activityDetailsId_fkey" FOREIGN KEY ("activityDetailsId") REFERENCES "activity_details"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invoice_items" ADD CONSTRAINT "student_invoice_items_billingCodeId_fkey" FOREIGN KEY ("billingCodeId") REFERENCES "billing_codes"("legacyId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_history" ADD CONSTRAINT "student_history_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_outcomes" ADD CONSTRAINT "student_outcomes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_equipment" ADD CONSTRAINT "student_equipment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_program_codes" ADD CONSTRAINT "student_program_codes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_form_history" ADD CONSTRAINT "enrollment_form_history_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;
