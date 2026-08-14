-- Add isPinned column to Announcements table
ALTER TABLE Announcements ADD COLUMN isPinned TINYINT(1) DEFAULT 0 AFTER imagePath;

-- Add category column to Announcements table  
ALTER TABLE Announcements ADD COLUMN category ENUM('General', 'Event', 'Advisory', 'Emergency', 'Community') DEFAULT 'General' AFTER isPinned;
