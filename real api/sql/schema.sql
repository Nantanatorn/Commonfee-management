-- ============================================================
-- BanDee / Commonfee -- สคริปต์สร้างฐานข้อมูลทั้งหมด (SQL Server 2016+)
--
-- วิธีใช้ (เลือกอย่างใดอย่างหนึ่ง)
--   sqlcmd -S localhost,1433 -U sa -P <password> -i schema.sql
--   หรือเปิดใน SSMS / Azure Data Studio แล้วกด Run
--
-- สคริปต์นี้รันซ้ำได้: ไม่ลบ/เขียนทับตารางที่มีอยู่แล้ว ส่วน view / procedure / trigger จะถูกสร้างใหม่ให้ตรงกับสคริปต์
-- ได้โครงสร้างครบแล้ว (รวมการแก้ใน fixes.sql และ phase2.sql) จึงไม่ต้องรันสองไฟล์นั้นอีกสำหรับฐานข้อมูลใหม่
--
-- หลังสร้างเสร็จ ใส่ข้อมูลตัวอย่างด้วย:   cd "real api" && node sql/seed-mock.js --yes
--   (สร้างบัญชี admin / ลูกบ้านสมมติ / บิล / ใบเสร็จ / คำร้อง / ข่าว)
-- ============================================================

IF DB_ID(N'Commonfee') IS NULL
    CREATE DATABASE [Commonfee];
GO

USE [Commonfee];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ============================== ตาราง ==============================

IF OBJECT_ID(N'dbo.PriceandSize', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[PriceandSize] (
        [House_Size] varchar(10) NOT NULL,
        [Land_size] int NULL,
        [FeeRate] money NULL,
        [Fine] money NULL,
        CONSTRAINT [PK_PriceandSize] PRIMARY KEY CLUSTERED ([House_Size])
    );
END
GO

IF OBJECT_ID(N'dbo.UserAccount', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[UserAccount] (
        [User_ID] int IDENTITY(67001,1) NOT NULL,
        [User_Firstname] nvarchar(50) NOT NULL,
        [User_Lastname] nvarchar(50) NOT NULL,
        [IDcard] nvarchar(50) NOT NULL,
        [username] nvarchar(50) NULL,
        [email] nvarchar(100) NOT NULL,
        [password] nvarchar(100) NOT NULL,
        [phone] nvarchar(50) NULL,
        [role] nvarchar(50) NULL,
        [User_image] nvarchar(50) NULL,
        CONSTRAINT [PK_UserAccount] PRIMARY KEY CLUSTERED ([User_ID])
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_UserAccount_username' AND object_id = OBJECT_ID(N'dbo.UserAccount'))
    CREATE UNIQUE NONCLUSTERED INDEX [UX_UserAccount_username] ON [dbo].[UserAccount] ([username]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_UserAccount_IDcard' AND object_id = OBJECT_ID(N'dbo.UserAccount'))
    CREATE UNIQUE NONCLUSTERED INDEX [UX_UserAccount_IDcard] ON [dbo].[UserAccount] ([IDcard]) WHERE ([IDcard] IS NOT NULL);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_UserAccount_email' AND object_id = OBJECT_ID(N'dbo.UserAccount'))
    CREATE UNIQUE NONCLUSTERED INDEX [UX_UserAccount_email] ON [dbo].[UserAccount] ([email]) WHERE ([email] IS NOT NULL);
GO

IF OBJECT_ID(N'dbo.House', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[House] (
        [House_No] int IDENTITY(1,1) NOT NULL,
        [House_number] nchar(10) NOT NULL,
        [House_Size] varchar(10) NULL,
        [House_status] varchar(50) NULL,
        CONSTRAINT [PK_House_1] PRIMARY KEY CLUSTERED ([House_number])
    );
END
GO

IF OBJECT_ID(N'dbo.villagemanager', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[villagemanager] (
        [manager_ID] int IDENTITY(65001,1) NOT NULL,
        [manager_name] varchar(50) NULL,
        [User_ID] int NOT NULL,
        CONSTRAINT [PK_villagemanager] PRIMARY KEY CLUSTERED ([manager_ID])
    );
END
GO

IF OBJECT_ID(N'dbo.Announcement', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Announcement] (
        [manager_ID] int NULL,
        [Announce_ID] int IDENTITY(1,1) NOT NULL,
        [Announce_Date] datetime NOT NULL,
        [Announce_image] nvarchar(50) NULL,
        [Announce_Title] nvarchar(50) NULL,
        [Announce_Detail] nvarchar(MAX) NULL,
        [Announce_Status] nchar(10) NULL,
        CONSTRAINT [PK_Announcement] PRIMARY KEY CLUSTERED ([Announce_ID])
    );
END
GO

IF OBJECT_ID(N'dbo.Resident', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Resident] (
        [User_ID] int NOT NULL,
        [R_ID] int IDENTITY(1,1001) NOT NULL,
        [R_Firstname] nvarchar(50) NULL,
        [R_Lastname] nvarchar(50) NULL,
        [House_number] nchar(10) NULL,
        [EntryDate] datetime NULL,
        [status] char(10) NULL,
        CONSTRAINT [PK_Resident] PRIMARY KEY CLUSTERED ([R_ID])
    );
END
GO

IF OBJECT_ID(N'dbo.PayCommonfee', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[PayCommonfee] (
        [R_ID] int NULL,
        [manager_ID] int NULL,
        [Pay_ID] int IDENTITY(1,1) NOT NULL,
        [Pay_Date] date NULL,
        [Pay_Amount] money NULL,
        [Pay_Status] nchar(7) NULL,
        [Pay_Deadline] date NULL,
        [House_number] nchar(10) NULL,
        [Pay_Fine] money NULL,
        [Slip_Image] nvarchar(100) NULL,
        [Slip_Hash] char(64) NULL,
        CONSTRAINT [PK_PayCommonfee] PRIMARY KEY CLUSTERED ([Pay_ID])
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_PayCommonfee_SlipHash' AND object_id = OBJECT_ID(N'dbo.PayCommonfee'))
    CREATE UNIQUE NONCLUSTERED INDEX [UX_PayCommonfee_SlipHash] ON [dbo].[PayCommonfee] ([Slip_Hash]) WHERE ([Slip_Hash] IS NOT NULL);
GO

IF OBJECT_ID(N'dbo.Petition', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Petition] (
        [User_ID] int NOT NULL,
        [R_ID] int NULL,
        [petition_ID] int IDENTITY(1,1) NOT NULL,
        [petition_Title] nvarchar(50) NOT NULL,
        [petition_status] char(10) NULL,
        [petition_detail] nvarchar(MAX) NULL,
        [petition_Date] date NULL,
        [petition_Type] nchar(10) NOT NULL,
        [House_number] nchar(10) NULL,
        CONSTRAINT [PK_Petition] PRIMARY KEY CLUSTERED ([petition_ID])
    );
END
GO

IF OBJECT_ID(N'dbo.Payment', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Payment] (
        [R_ID] int NOT NULL,
        [R_Firstname] nvarchar(50) NOT NULL,
        [R_Lastname] nvarchar(50) NOT NULL,
        [Pay_ID] int NOT NULL,
        [Paid_ID] int IDENTITY(1,1) NOT NULL,
        [Paid_Date] datetime NOT NULL,
        [Paid_Amount] money NOT NULL,
        [Paid_Fine] money NOT NULL,
        CONSTRAINT [PK_Payment] PRIMARY KEY CLUSTERED ([Paid_ID])
    );
END
GO

IF OBJECT_ID(N'dbo.Receipt', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Receipt] (
        [Paid_ID] int NOT NULL,
        [R_ID] int NOT NULL,
        [R_Firstname] nvarchar(50) NOT NULL,
        [R_Lastname] nvarchar(50) NOT NULL,
        [House_number] nchar(10) NOT NULL,
        [Receipt_ID] int IDENTITY(1,12034) NOT NULL,
        [Receipt_Date] datetime NOT NULL,
        [Receipt_Total] money NOT NULL,
        CONSTRAINT [PK_Receipt] PRIMARY KEY CLUSTERED ([Receipt_ID])
    );
END
GO

-- ============================== Foreign keys ==============================

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_House_PriceandSize')
    ALTER TABLE [dbo].[House] ADD CONSTRAINT [FK_House_PriceandSize] FOREIGN KEY ([House_Size]) REFERENCES [dbo].[PriceandSize] ([House_Size]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_villagemanager_UserAccount')
    ALTER TABLE [dbo].[villagemanager] ADD CONSTRAINT [FK_villagemanager_UserAccount] FOREIGN KEY ([User_ID]) REFERENCES [dbo].[UserAccount] ([User_ID]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Announcement_villagemanager')
    ALTER TABLE [dbo].[Announcement] ADD CONSTRAINT [FK_Announcement_villagemanager] FOREIGN KEY ([manager_ID]) REFERENCES [dbo].[villagemanager] ([manager_ID]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Resident_House')
    ALTER TABLE [dbo].[Resident] ADD CONSTRAINT [FK_Resident_House] FOREIGN KEY ([House_number]) REFERENCES [dbo].[House] ([House_number]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Resident_UserAccount')
    ALTER TABLE [dbo].[Resident] ADD CONSTRAINT [FK_Resident_UserAccount] FOREIGN KEY ([User_ID]) REFERENCES [dbo].[UserAccount] ([User_ID]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PayCommonfee_Resident')
    ALTER TABLE [dbo].[PayCommonfee] ADD CONSTRAINT [FK_PayCommonfee_Resident] FOREIGN KEY ([R_ID]) REFERENCES [dbo].[Resident] ([R_ID]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PayCommonfee_villagemanager')
    ALTER TABLE [dbo].[PayCommonfee] ADD CONSTRAINT [FK_PayCommonfee_villagemanager] FOREIGN KEY ([manager_ID]) REFERENCES [dbo].[villagemanager] ([manager_ID]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Petition_Resident1')
    ALTER TABLE [dbo].[Petition] ADD CONSTRAINT [FK_Petition_Resident1] FOREIGN KEY ([R_ID]) REFERENCES [dbo].[Resident] ([R_ID]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Payment_PayCommonfee')
    ALTER TABLE [dbo].[Payment] ADD CONSTRAINT [FK_Payment_PayCommonfee] FOREIGN KEY ([Pay_ID]) REFERENCES [dbo].[PayCommonfee] ([Pay_ID]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Payment_Resident')
    ALTER TABLE [dbo].[Payment] ADD CONSTRAINT [FK_Payment_Resident] FOREIGN KEY ([R_ID]) REFERENCES [dbo].[Resident] ([R_ID]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Receipt_Payment')
    ALTER TABLE [dbo].[Receipt] ADD CONSTRAINT [FK_Receipt_Payment] FOREIGN KEY ([Paid_ID]) REFERENCES [dbo].[Payment] ([Paid_ID]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Receipt_Resident')
    ALTER TABLE [dbo].[Receipt] ADD CONSTRAINT [FK_Receipt_Resident] FOREIGN KEY ([R_ID]) REFERENCES [dbo].[Resident] ([R_ID]);
GO

-- ============================== View ==============================

CREATE OR ALTER VIEW [dbo].[HouseStatusView]
AS
SELECT        dbo.Resident.R_ID, dbo.Resident.R_Lastname, dbo.Resident.R_Firstname, dbo.Resident.status, dbo.UserAccount.phone, dbo.House.House_number, dbo.House.House_No, dbo.PayCommonfee.Pay_Status
FROM            dbo.Resident INNER JOIN
                         dbo.UserAccount ON dbo.Resident.User_ID = dbo.UserAccount.User_ID INNER JOIN
                         dbo.House ON dbo.Resident.House_number = dbo.House.House_number INNER JOIN
                         dbo.PayCommonfee ON dbo.Resident.R_ID = dbo.PayCommonfee.R_ID
GO

CREATE OR ALTER VIEW [dbo].[Notificationview]
AS
SELECT        dbo.Resident.R_ID, dbo.Resident.R_Firstname, dbo.Resident.R_Lastname, dbo.UserAccount.email, dbo.UserAccount.phone, dbo.PayCommonfee.Pay_Date, dbo.PayCommonfee.Pay_Amount, dbo.PayCommonfee.Pay_Deadline, 
                         dbo.PayCommonfee.Pay_Status, dbo.PayCommonfee.House_number
FROM            dbo.UserAccount INNER JOIN
                         dbo.Resident ON dbo.UserAccount.User_ID = dbo.Resident.User_ID INNER JOIN
                         dbo.PayCommonfee ON dbo.Resident.R_ID = dbo.PayCommonfee.R_ID
GO

CREATE OR ALTER VIEW [dbo].[PaymentHistoryView]
AS
SELECT        dbo.PayCommonfee.Pay_Date, dbo.PayCommonfee.Pay_ID, dbo.Resident.User_ID, dbo.Resident.R_Firstname, dbo.Resident.R_Lastname, dbo.House.House_number, dbo.PayCommonfee.Pay_Amount, 
                         dbo.PayCommonfee.Pay_Deadline, dbo.PayCommonfee.Pay_Status, dbo.PriceandSize.Land_size, dbo.PriceandSize.House_Size, dbo.UserAccount.phone, dbo.PayCommonfee.Pay_Fine
FROM            dbo.PayCommonfee INNER JOIN
                         dbo.Resident ON dbo.PayCommonfee.R_ID = dbo.Resident.R_ID INNER JOIN
                         dbo.House ON dbo.Resident.House_number = dbo.House.House_number INNER JOIN
                         dbo.PriceandSize ON dbo.House.House_Size = dbo.PriceandSize.House_Size INNER JOIN
                         dbo.UserAccount ON dbo.Resident.User_ID = dbo.UserAccount.User_ID
GO

CREATE OR ALTER VIEW [dbo].[PetitionViewForAdmin]
AS
SELECT        dbo.Petition.petition_Date, dbo.Resident.R_Firstname, dbo.Resident.R_Lastname, dbo.UserAccount.phone, dbo.Petition.House_number, dbo.Petition.petition_Title, dbo.Petition.petition_detail, dbo.Petition.petition_Type, 
                         dbo.Petition.petition_status, dbo.Petition.petition_ID
FROM            dbo.Petition INNER JOIN
                         dbo.Resident ON dbo.Petition.R_ID = dbo.Resident.R_ID INNER JOIN
                         dbo.UserAccount ON dbo.Resident.User_ID = dbo.UserAccount.User_ID
GO

CREATE OR ALTER VIEW [dbo].[ReceiptView]
AS
SELECT        dbo.UserAccount.User_ID, dbo.PayCommonfee.Pay_ID, dbo.Receipt.Receipt_ID, dbo.Resident.R_Firstname, dbo.Resident.R_Lastname, dbo.Receipt.Receipt_Date, dbo.Receipt.House_number, dbo.Payment.Paid_Amount, 
                         dbo.Payment.Paid_Fine, dbo.Receipt.Receipt_Total
FROM            dbo.Payment INNER JOIN
                         dbo.Receipt ON dbo.Payment.Paid_ID = dbo.Receipt.Paid_ID INNER JOIN
                         dbo.PayCommonfee ON dbo.Payment.Pay_ID = dbo.PayCommonfee.Pay_ID INNER JOIN
                         dbo.Resident ON dbo.Payment.R_ID = dbo.Resident.R_ID AND dbo.Receipt.R_ID = dbo.Resident.R_ID AND dbo.PayCommonfee.R_ID = dbo.Resident.R_ID INNER JOIN
                         dbo.UserAccount ON dbo.Resident.User_ID = dbo.UserAccount.User_ID
GO

CREATE OR ALTER VIEW [dbo].[Resident_info]
AS
SELECT        dbo.Resident.R_ID, dbo.UserAccount.IDcard, dbo.Resident.R_Firstname, dbo.Resident.R_Lastname, dbo.UserAccount.phone, dbo.Resident.House_number, dbo.Resident.EntryDate, dbo.Resident.status, dbo.UserAccount.email, 
                         dbo.House.House_No, dbo.UserAccount.User_image, dbo.UserAccount.username
FROM            dbo.UserAccount INNER JOIN
                         dbo.Resident ON dbo.UserAccount.User_ID = dbo.Resident.User_ID INNER JOIN
                         dbo.House ON dbo.Resident.House_number = dbo.House.House_number
GO

-- ============================== Stored procedure ==============================

-- 2) SendBill: ไม่ออกบิลซ้ำในเดือนเดียวกัน และออกเฉพาะลูกบ้านที่ยังอาศัยอยู่ (status = 'Living')
CREATE OR ALTER PROCEDURE [dbo].[SendBill]
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @InsertedRecords TABLE (Pay_ID INT, R_ID INT, Pay_Date DATETIME, Pay_Status VARCHAR(50), manager_ID INT, Pay_Fine DECIMAL(18, 2));

    INSERT INTO PayCommonfee (R_ID, Pay_Date, Pay_Status, manager_ID, Pay_Fine)
    OUTPUT INSERTED.Pay_ID, INSERTED.R_ID, INSERTED.Pay_Date, INSERTED.Pay_Status, INSERTED.manager_ID, INSERTED.Pay_Fine
    INTO @InsertedRecords
    SELECT R.R_ID, CAST(GETDATE() AS DATE), 'Overdue', vm.manager_ID, 0
    FROM Resident R
    JOIN villagemanager vm ON vm.User_ID = @userId
    WHERE RTRIM(R.status) = 'Living'
      AND NOT EXISTS (
            SELECT 1 FROM PayCommonfee P
            WHERE P.R_ID = R.R_ID
              AND YEAR(P.Pay_Date) = YEAR(GETDATE())
              AND MONTH(P.Pay_Date) = MONTH(GETDATE())
      );

    SELECT * FROM @InsertedRecords;
END
GO

-- 3) UpdateFine: idempotent -- ค่าปรับของบิลที่เลยกำหนด = ค่าปรับตามขนาดบ้าน (ไม่บวกซ้ำทุกครั้งที่รัน)
--    API เรียก procedure นี้อัตโนมัติตอนเริ่มเซิร์ฟเวอร์และวันละครั้ง (ดู app.js)
CREATE OR ALTER PROCEDURE [dbo].[UpdateFine]
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE PC
    SET Pay_Fine = PS.Fine
    FROM PayCommonfee PC
    JOIN House H ON PC.House_number = H.House_number
    JOIN PriceandSize PS ON H.House_Size = PS.House_Size
    WHERE RTRIM(PC.Pay_Status) = 'Overdue'
      AND PC.Pay_Deadline < CAST(GETDATE() AS DATE)
      AND ISNULL(PC.Pay_Fine, 0) <> PS.Fine;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[UpdatePayment] 
    @Paid_Date DATETIME,
    @R_ID INT,
    @Paid_Amount MONEY,
    @Pay_ID INT,
	@Paid_Fine money
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- เริ่มต้น Transaction
        BEGIN TRANSACTION;

        DECLARE @R_Firstname NVARCHAR(255);
        DECLARE @R_Lastname NVARCHAR(255);
        DECLARE @House_number NCHAR(10);
        DECLARE @Paid_ID INT;


        -- ดึงข้อมูลจากตาราง Resident
        SELECT 
            @R_Firstname = R_Firstname,
            @R_Lastname = R_Lastname,
            @House_number = House_number
        FROM Resident
        WHERE R_ID = @R_ID;

        -- แทรกข้อมูลลงในตาราง Payment และเก็บค่าที่สร้างใหม่ไว้ใน @Paid_ID
        INSERT INTO Payment (Paid_Date, Paid_Amount, Pay_ID, R_ID, R_Firstname, R_Lastname, Paid_Fine)
        VALUES (GETDATE(), @Paid_Amount, @Pay_ID, @R_ID, @R_Firstname, @R_Lastname,@Paid_Fine);

        SET @Paid_ID = SCOPE_IDENTITY(); -- ดึงค่าของ Paid_ID ที่เพิ่งแทรกเข้าไปใน Payment

        -- แทรกข้อมูลลงในตาราง Receipt โดยใช้ @Paid_ID ที่ได้จากการ INSERT ก่อนหน้านี้
        INSERT INTO Receipt (Paid_ID, R_ID, R_Firstname, R_Lastname, House_number, Receipt_Date,Receipt_Total)
        VALUES (@Paid_ID, @R_ID, @R_Firstname, @R_Lastname, @House_number, GETDATE(),@Paid_Amount + @Paid_Fine);

        -- ยืนยันการทำงาน (commit)
        COMMIT TRANSACTION;

        PRINT 'Add success';
    END TRY
    BEGIN CATCH
        -- ถ้ามีข้อผิดพลาด ให้ Rollback การทำงานกลับไปยังจุดก่อนหน้า Transaction
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END

        -- แสดงข้อความข้อผิดพลาด
        DECLARE @ErrorMessage NVARCHAR(4000);
        SET @ErrorMessage = ERROR_MESSAGE();
        PRINT @ErrorMessage;
    END CATCH
END
GO

-- ============================== Trigger ==============================

-- 1) Trigger FeePayment: คำนวณยอด/กำหนดชำระ "เฉพาะตอน INSERT"
--    เดิมทำงานทุก UPDATE จึงคำนวณ Pay_Amount ใหม่ตอนจ่ายเงิน/แก้ rate ทำให้บิลเก่าเปลี่ยนยอด
CREATE OR ALTER TRIGGER [dbo].[FeePayment]
ON [dbo].[PayCommonfee]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE P
    SET P.House_number = R.House_number
    FROM PayCommonfee P
    JOIN inserted i ON i.Pay_ID = P.Pay_ID
    JOIN Resident R ON P.R_ID = R.R_ID;

    UPDATE P
    SET P.Pay_Amount = PS.Land_size * PS.FeeRate
    FROM PayCommonfee P
    JOIN inserted i ON i.Pay_ID = P.Pay_ID
    JOIN House H ON P.House_number = H.House_number
    JOIN PriceandSize PS ON H.House_Size = PS.House_Size;

    UPDATE P
    SET P.Pay_Deadline = DATEADD(DAY, 10, P.Pay_Date)
    FROM PayCommonfee P
    JOIN inserted i ON i.Pay_ID = P.Pay_ID
    WHERE P.Pay_Date IS NOT NULL;
END;
GO

CREATE OR ALTER TRIGGER [dbo].[Pettition]
on [dbo].[Petition]
AFTER INSERT
AS
BEGIN

	UPDATE P
    SET P.R_ID = R.R_ID
    FROM Petition P
    JOIN Resident R ON P.User_ID = R.User_ID
    WHERE P.petition_ID IN (SELECT petition_ID FROM inserted);

    -- อัปเดต House_number ในตาราง Petition โดยเชื่อมโยงกับ Resident ผ่าน R_ID
    UPDATE P
    SET P.House_number = R.House_number
    FROM Petition P
    JOIN Resident R ON P.R_ID = R.R_ID
    WHERE P.petition_ID IN (SELECT petition_ID FROM inserted);

END;
GO

CREATE OR ALTER TRIGGER [dbo].[updatename]
ON [dbo].[UserAccount]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Update R_Firstname and R_Lastname in Resident table
    UPDATE Resident
    SET Resident.R_Firstname = inserted.User_Firstname,
        Resident.R_Lastname = inserted.User_Lastname
    FROM Resident
    INNER JOIN inserted ON Resident.User_ID = inserted.User_ID;
END
GO

-- ============================== ข้อมูลอ้างอิง ==============================
-- อัตราค่าส่วนกลางตามขนาดบ้าน (ค่าส่วนกลาง = Land_size x FeeRate, Fine = ค่าปรับเมื่อเลยกำหนด)
-- แก้ได้ภายหลังจากหน้า "แก้ไขอัตราชำระ" ในระบบ (มีผลกับบิลที่ออกต่อจากนั้น)

IF NOT EXISTS (SELECT 1 FROM dbo.PriceandSize WHERE House_Size = N'L')
    INSERT INTO dbo.PriceandSize (House_Size, Land_size, FeeRate, Fine) VALUES (N'L', 80, 40, 50);
IF NOT EXISTS (SELECT 1 FROM dbo.PriceandSize WHERE House_Size = N'M')
    INSERT INTO dbo.PriceandSize (House_Size, Land_size, FeeRate, Fine) VALUES (N'M', 60, 33, 50);
IF NOT EXISTS (SELECT 1 FROM dbo.PriceandSize WHERE House_Size = N'S')
    INSERT INTO dbo.PriceandSize (House_Size, Land_size, FeeRate, Fine) VALUES (N'S', 40, 33, 50);
GO

PRINT N'สร้างฐานข้อมูล Commonfee เรียบร้อย';
GO
