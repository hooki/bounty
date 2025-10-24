-- Add wallet_address column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Add comment to wallet_address column
COMMENT ON COLUMN users.wallet_address IS 'TON wallet address for receiving bug bounty rewards';
