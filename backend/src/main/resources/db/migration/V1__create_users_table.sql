CREATE TABLE users (
    id                BIGSERIAL     PRIMARY KEY,
    username          VARCHAR(50)   NOT NULL,
    email             VARCHAR(255)  NOT NULL,
    password_digest   VARCHAR(255)  NOT NULL,
    profile_image_url VARCHAR(1000),
    created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email    UNIQUE (email),
    CONSTRAINT uk_users_username UNIQUE (username)
);

CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_username ON users (username);
