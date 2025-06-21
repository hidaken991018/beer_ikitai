-- My Beer Log Database Schema

-- ユーザープロファイルテーブル
CREATE TABLE user_profile (
    id SERIAL PRIMARY KEY,
    cognito_sub VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    icon_url VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 醸造所テーブル
CREATE TABLE brewery (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(512),
    description TEXT,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 訪問テーブル
CREATE TABLE visit (
    id SERIAL PRIMARY KEY,
    user_profile_id INTEGER NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
    brewery_id INTEGER NOT NULL REFERENCES brewery(id) ON DELETE CASCADE,
    visited_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_user_profile_cognito_sub ON user_profile(cognito_sub);
CREATE INDEX idx_brewery_location ON brewery(latitude, longitude);
CREATE INDEX idx_visit_user_profile_id ON visit(user_profile_id);
CREATE INDEX idx_visit_brewery_id ON visit(brewery_id);
CREATE INDEX idx_visit_visited_at ON visit(visited_at DESC);