-- ============================================================
-- Migration เฟส 2: แนบสลิปการชำระเงิน
-- รันกับฐานข้อมูล Commonfee (รันซ้ำได้) -- สำรองข้อมูลก่อนรันกับฐานข้อมูลจริง
-- ต้องรัน sql/fixes.sql มาก่อนแล้ว
-- ============================================================
USE [Commonfee];
GO
SET QUOTED_IDENTIFIER ON;  -- จำเป็นสำหรับ filtered index
SET ANSI_NULLS ON;
GO

-- ชื่อไฟล์สลิป (เก็บไฟล์ไว้ใน "real api/private/slips" ไม่ใช่โฟลเดอร์ public)
IF COL_LENGTH('dbo.PayCommonfee', 'Slip_Image') IS NULL
    ALTER TABLE dbo.PayCommonfee ADD Slip_Image NVARCHAR(100) NULL;
GO

-- SHA-256 ของไฟล์สลิป (hex 64 ตัว) ใช้กันนำสลิปใบเดียวกันไปแจ้งชำระหลายบิล
IF COL_LENGTH('dbo.PayCommonfee', 'Slip_Hash') IS NULL
    ALTER TABLE dbo.PayCommonfee ADD Slip_Hash CHAR(64) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_PayCommonfee_SlipHash' AND object_id = OBJECT_ID('dbo.PayCommonfee'))
    CREATE UNIQUE INDEX UX_PayCommonfee_SlipHash ON dbo.PayCommonfee(Slip_Hash) WHERE Slip_Hash IS NOT NULL;
GO
