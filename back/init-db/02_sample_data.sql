-- サンプルデータ挿入

-- サンプル醸造所データ
INSERT INTO brewery (name, address, description, latitude, longitude,created_at,updated_at) VALUES
('伊勢角屋麦酒 神久工場', '伊勢市神久六丁目428番地', '三重県伊勢市にあるクラフトビール醸造所です。IPA が自慢です。', 34.49558856790372, 136.726220607552,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('横浜ビール醸造所', '神奈川県横浜市中区住吉町6-68-1', '横浜港を望む醸造所。ピルスナーとヴァイツェンが人気です。', 35.44876257397394, 139.63406983775437,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('BLACK TIDE BREWING', '宮城県気仙沼市南町3丁目2-5', '気仙沼の復旧・復興の一助になればという想い、そして「クラフトビールによるコミュニティーづくり」というキーワードのもと、どこからともなく僕たちは集まってきました。', 38.90514390741131, 141.57451548026768,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('箕面ビール', '大阪府箕面市牧落3-19-11', '箕面の地で生まれた、人の手によって大切に作られるローカルビールです。', 34.82344235235449, 135.47264223006584,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('DD4D BREWING', '愛媛県松山市千舟町4-2-6', 'これまで300種類以上のビールを全国、海外に販売。スポーツ、アパレル、製菓、映画など業界を越えたコラボも多数', 33.83679664169755, 132.766265910689,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('蒲田温泉 BREWING', '東京都大田区蒲田本町2丁目23-2', '蒲田温泉だよ', 35.55622138589161, 139.71810504812046,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('Hida BREWING', '東京都大田区蒲田本町1丁目8-5', '拠点', 35.556832371148566, 139.71602365396922,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);