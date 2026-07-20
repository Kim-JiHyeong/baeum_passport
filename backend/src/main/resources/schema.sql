CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  school_name TEXT,
  grade INTEGER,
  class_num INTEGER,
  student_num INTEGER,
  gender TEXT,
  avatar TEXT,
  created_at TEXT DEFAULT (CURRENT_TIMESTAMP::TEXT)
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS school_name TEXT;

CREATE TABLE IF NOT EXISTS continents (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  population BIGINT,
  area_km2 BIGINT,
  country_count INTEGER
);

CREATE TABLE IF NOT EXISTS countries (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  continent_id BIGINT REFERENCES continents(id),
  flag_image_url TEXT,
  map_image_url TEXT,
  capital TEXT,
  population BIGINT,
  area_km2 BIGINT,
  language TEXT,
  description TEXT,
  is_featured INTEGER DEFAULT 0,
  currency TEXT,
  area_comparison TEXT,
  population_comparison TEXT,
  greeting TEXT,
  overview TEXT,
  map_note TEXT,
  clothing TEXT,
  food TEXT,
  house TEXT,
  color TEXT
);

CREATE TABLE IF NOT EXISTS user_countries (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  country_id BIGINT REFERENCES countries(id),
  added_at TEXT DEFAULT (CURRENT_TIMESTAMP::TEXT),
  immigration_passed INTEGER DEFAULT 0,
  immigration_passed_at TEXT,
  immigration_score INTEGER,
  immigration_completed_at TEXT,
  CONSTRAINT uk_user_countries_user_country UNIQUE (user_id, country_id)
);

ALTER TABLE user_countries
ADD COLUMN IF NOT EXISTS immigration_score INTEGER;

ALTER TABLE user_countries
ADD COLUMN IF NOT EXISTS immigration_completed_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uk_user_countries_user_country
ON user_countries (user_id, country_id);

CREATE TABLE IF NOT EXISTS travel_info (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  country_id BIGINT REFERENCES countries(id),
  country_name TEXT,
  display_name TEXT,
  area TEXT,
  population TEXT,
  language TEXT,
  capital TEXT,
  continent TEXT,
  flag_image_url TEXT,
  map_image_url TEXT,
  user_note TEXT,
  travel_purpose TEXT,
  places_to_visit TEXT,
  local_phrase TEXT,
  travel_tips TEXT,
  landmark TEXT,
  food_to_try TEXT,
  packing_list TEXT,
  cautions TEXT,
  weather_note TEXT,
  free_memo TEXT,
  created_at TEXT DEFAULT (CURRENT_TIMESTAMP::TEXT),
  updated_at TEXT DEFAULT (CURRENT_TIMESTAMP::TEXT)
);

CREATE TABLE IF NOT EXISTS workbooks (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  country_id BIGINT REFERENCES countries(id),
  capital TEXT,
  language TEXT,
  population TEXT,
  area TEXT,
  population_comparison TEXT,
  area_comparison TEXT,
  flag_image TEXT,
  map_image TEXT,
  flag_observation TEXT,
  continent TEXT,
  map_location TEXT,
  greeting TEXT,
  research_topic TEXT,
  similarity_with_korea TEXT,
  difference_from_korea TEXT,
  question TEXT,
  sources TEXT,
  overview TEXT,
  map_note TEXT,
  flag_note TEXT,
  traditional_clothing TEXT,
  traditional_food TEXT,
  traditional_house TEXT,
  completed INTEGER DEFAULT 0,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS stamps (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  country_id BIGINT REFERENCES countries(id),
  created_at TEXT DEFAULT (CURRENT_TIMESTAMP::TEXT)
);

INSERT INTO continents (id, name, color, population, area_km2, country_count)
SELECT * FROM (VALUES
  (1, '아시아', '#4f75d6', 4700000000, 44580000, 49),
  (2, '유럽', '#4f75d6', 740000000, 10180000, 44),
  (3, '아프리카', '#4f75d6', 1400000000, 30370000, 54),
  (4, '북아메리카', '#4f75d6', 600000000, 24710000, 23),
  (5, '남아메리카', '#4f75d6', 440000000, 17840000, 12),
  (6, '오세아니아', '#4f75d6', 45000000, 8520000, 14)
) AS seed(id, name, color, population, area_km2, country_count)
WHERE NOT EXISTS (SELECT 1 FROM continents WHERE continents.id = seed.id);

INSERT INTO countries (
  id, name, continent_id, flag_image_url, capital, population, area_km2, language,
  description, is_featured, currency, area_comparison, population_comparison,
  greeting, overview, map_note, clothing, food, house, color
)
SELECT * FROM (VALUES
  (1, '대한민국', 1, 'https://flagcdn.com/w320/kr.png', '서울', 51000000, 100000, '한국어', '한반도 남쪽에 위치한 나라로, 전통과 첨단 기술이 함께 발전했습니다.', 1, '원', '대한민국 기준 1배', '대한민국 기준 1배', '안녕하세요', '한반도 남쪽에 위치한 나라로, 전통과 첨단 기술이 함께 발전했습니다.', '동아시아, 한반도 남부', '한복', '김치와 비빔밥', '한옥', '#3156a3'),
  (2, '일본', 1, 'https://flagcdn.com/w320/jp.png', '도쿄', 120000000, 370000, '일본어', '태평양의 섬나라로 전통 문화와 현대 도시가 조화를 이룹니다.', 1, '엔', '대한민국의 약 3.7배', '대한민국의 약 2.4배', 'こんにちは', '태평양의 섬나라로 전통 문화와 현대 도시가 조화를 이룹니다.', '동아시아의 열도', '기모노', '스시와 라멘', '다다미집', '#b43b4a'),
  (3, '중국', 1, 'https://flagcdn.com/w320/cn.png', '베이징', 1400000000, 9600000, '중국어', '넓은 영토와 긴 역사를 가진 동아시아의 큰 나라입니다.', 1, '위안', '대한민국의 약 96배', '대한민국의 약 27배', '你好', '넓은 영토와 긴 역사를 가진 동아시아의 큰 나라입니다.', '동아시아 대륙', '치파오', '딤섬과 만두', '사합원', '#c7473d'),
  (4, '영국', 2, 'https://flagcdn.com/w320/gb.png', '런던', 68000000, 240000, '영어', '유럽 서쪽의 섬나라로 의회 민주주의와 왕실 문화가 알려져 있습니다.', 1, '파운드', '대한민국의 약 2.4배', '대한민국의 약 1.3배', 'Hello', '유럽 서쪽의 섬나라로 의회 민주주의와 왕실 문화가 알려져 있습니다.', '서유럽의 섬', '타탄과 정장 문화', '피시 앤 칩스', '벽돌집', '#3953a4'),
  (5, '프랑스', 2, 'https://flagcdn.com/w320/fr.png', '파리', 68000000, 640000, '프랑스어', '예술, 패션, 음식 문화로 유명한 서유럽의 나라입니다.', 1, '유로', '대한민국의 약 6.4배', '대한민국의 약 1.3배', 'Bonjour', '예술, 패션, 음식 문화로 유명한 서유럽의 나라입니다.', '서유럽', '베레모와 코트', '바게트와 크루아상', '석조 주택', '#4267b2'),
  (6, '독일', 2, 'https://flagcdn.com/w320/de.png', '베를린', 84000000, 350000, '독일어', '중앙유럽에 위치하며 산업과 음악, 축구 문화가 발달했습니다.', 1, '유로', '대한민국의 약 3.5배', '대한민국의 약 1.6배', 'Guten Tag', '중앙유럽에 위치하며 산업과 음악, 축구 문화가 발달했습니다.', '중앙유럽', '레더호젠', '소시지와 프레첼', '목골조 주택', '#7a6536'),
  (7, '이집트', 3, 'https://flagcdn.com/w320/eg.png', '카이로', 110000000, 1000000, '아랍어', '나일강과 피라미드로 유명한 북아프리카의 나라입니다.', 1, '이집트 파운드', '대한민국의 약 10배', '대한민국의 약 2.2배', 'مرحبا', '나일강과 피라미드로 유명한 북아프리카의 나라입니다.', '북아프리카', '갈라비야', '코샤리', '흙벽돌 집', '#c5912d'),
  (8, '미국', 4, 'https://flagcdn.com/w320/us.png', '워싱턴 D.C.', 330000000, 9830000, '영어', '북아메리카의 큰 나라로 다양한 문화와 자연환경을 가지고 있습니다.', 1, '달러', '대한민국의 약 98배', '대한민국의 약 6.5배', 'Hello', '북아메리카의 큰 나라로 다양한 문화와 자연환경을 가지고 있습니다.', '북아메리카 중부', '데님과 캐주얼', '햄버거', '단독 주택', '#b43b4a'),
  (9, '멕시코', 4, 'https://flagcdn.com/w320/mx.png', '멕시코시티', 130000000, 1960000, '스페인어', '고대 문명과 화려한 축제 문화가 살아 있는 나라입니다.', 1, '멕시코 페소', '대한민국의 약 20배', '대한민국의 약 2.5배', 'Hola', '고대 문명과 화려한 축제 문화가 살아 있는 나라입니다.', '북아메리카 남부', '솜브레로와 전통 의상', '타코', '아도베 주택', '#288657'),
  (10, '브라질', 5, 'https://flagcdn.com/w320/br.png', '브라질리아', 210000000, 8510000, '포르투갈어', '아마존 열대우림과 축구, 카니발로 유명한 남미의 큰 나라입니다.', 1, '브라질 헤알', '대한민국의 약 85배', '대한민국의 약 4.1배', 'Olá', '아마존 열대우림과 축구, 카니발로 유명한 남미의 큰 나라입니다.', '남아메리카 동부', '카니발 의상', '페이조아다', '열대 지역 주택', '#1e9b57'),
  (11, '호주', 6, 'https://flagcdn.com/w320/au.png', '캔버라', 26000000, 7690000, '영어', '오세아니아의 큰 섬 대륙 국가로 독특한 자연과 동물이 많습니다.', 1, '호주 달러', '대한민국의 약 77배', '대한민국의 약 0.5배', 'G''day', '오세아니아의 큰 섬 대륙 국가로 독특한 자연과 동물이 많습니다.', '오세아니아 대륙', '부시웨어', '미트파이', '베란다가 있는 주택', '#1c8d8a')
) AS seed(
  id, name, continent_id, flag_image_url, capital, population, area_km2, language,
  description, is_featured, currency, area_comparison, population_comparison,
  greeting, overview, map_note, clothing, food, house, color
)
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE countries.id = seed.id);
