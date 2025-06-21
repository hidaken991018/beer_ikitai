-- サンプルデータ挿入

-- サンプル醸造所データ
INSERT INTO brewery (name, address, description, latitude, longitude) VALUES
('東京クラフトブルワリー', '東京都渋谷区1-1-1', '渋谷にあるクラフトビール醸造所です。IPA と ステイアウトが自慢です。', 35.6762, 139.6503),
('横浜ベイブルワリー', '神奈川県横浜市中区2-2-2', '横浜港を望む醸造所。ピルスナーとヴァイツェンが人気です。', 35.4437, 139.6380),
('大阪クラフトハウス', '大阪府大阪市北区3-3-3', '大阪の老舗醸造所。関西風の味わい深いビールを提供しています。', 34.7024, 135.4937),
('福岡ホップファーム', '福岡県福岡市博多区4-4-4', '九州産ホップを使用したオリジナルビールが自慢の醸造所です。', 33.5904, 130.4017),
('札幌ビアワークス', '北海道札幌市中央区5-5-5', '北海道の豊かな自然を活かしたクラフトビールを醸造しています。', 43.0642, 141.3469);

-- サンプルユーザープロファイル（テスト用）
INSERT INTO user_profile (cognito_sub, display_name, icon_url) VALUES
('demo-user-001', 'ビール太郎', 'https://example.com/icons/user1.png'),
('demo-user-002', 'クラフト花子', 'https://example.com/icons/user2.png');

-- サンプル訪問データ
INSERT INTO visit (user_profile_id, brewery_id, visited_at) VALUES
(1, 1, NOW() - INTERVAL '7 days'),
(1, 2, NOW() - INTERVAL '3 days'), 
(1, 3, NOW() - INTERVAL '1 day'),
(2, 1, NOW() - INTERVAL '5 days'),
(2, 4, NOW() - INTERVAL '2 days');