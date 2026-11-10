-- ============================================================
-- Migration: แก้บัคฝั่งฐานข้อมูล (รันกับฐานข้อมูล Commonfee)
-- รันซ้ำได้ (idempotent)  -- สำรองข้อมูลก่อนรันกับฐานข้อมูลจริง
-- ============================================================
USE [Commonfee];
GO
SET QUOTED_IDENTIFIER ON;  -- จำเป็นสำหรับ filtered index
SET ANSI_NULLS ON;
GO

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

-- 4) Unique index กันข้อมูลซ้ำ/race condition ตอนสมัครสมาชิก (สร้างเฉพาะเมื่อข้อมูลเดิมไม่ซ้ำ)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_UserAccount_username' AND object_id = OBJECT_ID('dbo.UserAccount'))
   AND NOT EXISTS (SELECT 1 FROM UserAccount GROUP BY username HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX UX_UserAccount_username ON dbo.UserAccount(username);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_UserAccount_email' AND object_id = OBJECT_ID('dbo.UserAccount'))
   AND NOT EXISTS (SELECT 1 FROM UserAccount WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX UX_UserAccount_email ON dbo.UserAccount(email) WHERE email IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_UserAccount_IDcard' AND object_id = OBJECT_ID('dbo.UserAccount'))
   AND NOT EXISTS (SELECT 1 FROM UserAccount WHERE IDcard IS NOT NULL GROUP BY IDcard HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX UX_UserAccount_IDcard ON dbo.UserAccount(IDcard) WHERE IDcard IS NOT NULL;
GO
