-- Add behavioral data fields for enhanced AI risk prediction model
-- These fields enable the Random Forest Classifier (~98% accuracy) vs old Logistic Regression (~75%)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS days_indoors VARCHAR(50);
ALTER TABLE users
ADD COLUMN IF NOT EXISTS changes_habits VARCHAR(10);
ALTER TABLE users
ADD COLUMN IF NOT EXISTS work_interest VARCHAR(10);
ALTER TABLE users
ADD COLUMN IF NOT EXISTS social_weakness VARCHAR(10);
-- Add comments for documentation
COMMENT ON COLUMN users.days_indoors IS 'Duration of stay at home: "1-14 days", "15-30 days", "31-60 days", "More than 2 months", "Go out Every day"';
COMMENT ON COLUMN users.changes_habits IS 'Significant habit changes: "Yes", "No"';
COMMENT ON COLUMN users.work_interest IS 'Interest in work/study: "Yes", "No", "Maybe"';
COMMENT ON COLUMN users.social_weakness IS 'Difficulty interacting socially: "Yes", "No", "Maybe"';


