-- Admin functions that bypass RLS for user management

-- Function to create user bypassing RLS
CREATE OR REPLACE FUNCTION admin_create_user(
  p_clerk_id TEXT,
  p_email TEXT,
  p_name TEXT,
  p_avatar_url TEXT,
  p_plan TEXT DEFAULT 'free',
  p_trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_subscription_status TEXT DEFAULT 'active'
)
RETURNS TABLE (
  id UUID,
  clerk_id TEXT,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  plan TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert user bypassing RLS
  RETURN QUERY
  INSERT INTO users (
    clerk_id,
    email,
    name,
    avatar_url,
    plan,
    trial_ends_at,
    subscription_status
  ) VALUES (
    p_clerk_id,
    p_email,
    p_name,
    p_avatar_url,
    p_plan,
    p_trial_ends_at,
    p_subscription_status
  )
  RETURNING 
    id, clerk_id, email, name, avatar_url, plan, 
    trial_ends_at, subscription_status, created_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_create_user TO authenticated;
