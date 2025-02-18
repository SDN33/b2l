-- Add created_by column to shifts table
ALTER TABLE shifts
ADD COLUMN created_at CURRENT_TIMESTAMP REFERENCES auth.users(id);

-- Update existing records to use a default user if needed
-- UPDATE shifts SET created_by = (SELECT id FROM auth.users LIMIT 1) WHERE created_by IS NULL;

-- Make created_by required for future inserts
ALTER TABLE shifts ALTER COLUMN created_at SET NOT NULL;
