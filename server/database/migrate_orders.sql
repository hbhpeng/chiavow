-- Migration script to update orders table
-- Replace tailorMade with medicalCompanion and businessService

-- Check if tailor_made column exists and drop it
SET @dbname = DATABASE();
SET @tablename = 'orders';
SET @columnname = 'tailor_made';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'ALTER TABLE orders DROP COLUMN tailor_made;',
  'SELECT 1;'
));
PREPARE alterIfExists FROM @preparedStatement;
EXECUTE alterIfExists;
DEALLOCATE PREPARE alterIfExists;

-- Add medical_companion column if it doesn't exist
SET @columnname = 'medical_companion';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) = 0,
  'ALTER TABLE orders ADD COLUMN medical_companion BOOLEAN DEFAULT FALSE AFTER free_itinerary;',
  'SELECT 1;'
));
PREPARE alterIfExists FROM @preparedStatement;
EXECUTE alterIfExists;
DEALLOCATE PREPARE alterIfExists;

-- Add business_service column if it doesn't exist
SET @columnname = 'business_service';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) = 0,
  'ALTER TABLE orders ADD COLUMN business_service BOOLEAN DEFAULT FALSE AFTER medical_companion;',
  'SELECT 1;'
));
PREPARE alterIfExists FROM @preparedStatement;
EXECUTE alterIfExists;
DEALLOCATE PREPARE alterIfExists;

-- Verify the changes
SELECT 'Migration completed. Current orders table structure:' AS message;
DESCRIBE orders;
