-- Add auth_user_id column to influencers table
ALTER TABLE influencers 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

-- Update existing influencers with matching auth users
UPDATE influencers 
SET auth_user_id = auth.users.id
FROM auth.users 
WHERE influencers.email = auth.users.email;

-- Add index for better performance
CREATE INDEX idx_influencers_auth_user_id ON influencers(auth_user_id);