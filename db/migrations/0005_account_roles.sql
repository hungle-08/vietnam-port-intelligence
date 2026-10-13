ALTER TABLE auth_users ADD COLUMN role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin'));
