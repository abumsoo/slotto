CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referenced_post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, referenced_post_id)
);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
