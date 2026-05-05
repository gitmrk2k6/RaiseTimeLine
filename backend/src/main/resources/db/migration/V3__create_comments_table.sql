CREATE TABLE comments (
    id         BIGSERIAL    PRIMARY KEY,
    post_id    BIGINT       NOT NULL REFERENCES posts(id)  ON DELETE CASCADE,
    user_id    BIGINT       NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    content    VARCHAR(140) NOT NULL CHECK (length(content) >= 1),
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_post_id    ON comments(post_id);
CREATE INDEX idx_comments_user_id    ON comments(user_id);
CREATE INDEX idx_comments_post_order ON comments(post_id, created_at ASC);
