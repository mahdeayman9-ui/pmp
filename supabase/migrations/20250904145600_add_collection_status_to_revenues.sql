-- Add collection_status column to revenues table
ALTER TABLE revenues ADD COLUMN collection_status BOOLEAN DEFAULT FALSE;

-- Update existing records to have collection_status = false
UPDATE revenues SET collection_status = FALSE WHERE collection_status IS NULL;

-- Make collection_status NOT NULL after setting default values
ALTER TABLE revenues ALTER COLUMN collection_status SET NOT NULL;