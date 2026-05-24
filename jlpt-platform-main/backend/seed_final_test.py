from app.database import SessionLocal
from app.models import Question
import json

def seed_final():
    db = SessionLocal()

    # 1. Remove all previous questions
    print("🗑️ Removing all existing questions...")
    db.query(Question).delete()
    db.commit()

    # 2. Add New Questions
    questions = []

    # --- Mondai - 1: Kanji / Grammar (1-20) ---
    m1_data = [
        {"q": "1. がくせい → 漢字はどれですか。", "o": ["学校", "学生", "先生", "学年"], "c": 1},
        {"q": "2. にほん → 漢字はどれですか。", "o": ["日木", "日本", "本日", "日人"], "c": 1},
        {"q": "3. せんせい → 漢字はどれですか。", "o": ["生先", "先生", "学生", "先年"], "c": 1},
        {"q": "4. ともだち → 漢字はどれですか。", "o": ["友人", "人友", "友ち", "人ち"], "c": 0},
        {"q": "5. でんしゃ → 漢字はどれですか。", "o": ["電車", "車電", "電気", "車気"], "c": 0},
        {"q": "6. 学校 → ひらがなはどれですか。", "o": ["がっこう", "がくこう", "がこう", "がっこ"], "c": 0},
        {"q": "7. 水 → ひらがなはどれですか。", "o": ["みず", "みつ", "すい", "みじ"], "c": 0},
        {"q": "8. 火 → ひらがなはどれですか。", "o": ["ひ", "か", "ほ", "は"], "c": 0},
        {"q": "9. 金 → ひらがなはどれですか。", "o": ["きん", "かね", "き", "A と B"], "c": 3},
        {"q": "10. 人 → ひらがなはどれですか。", "o": ["ひと", "じん", "にん", "ぜんぶ正しい"], "c": 3},
        {"q": "11. 私＿＿学生です。", "o": ["を", "に", "は", "で"], "c": 2},
        {"q": "12. 学校＿＿行きます。", "o": ["を", "に", "で", "が"], "c": 1},
        {"q": "13. パン＿＿食べます。", "o": ["が", "を", "に", "は"], "c": 1},
        {"q": "14. 公園＿＿遊びます。", "o": ["に", "を", "で", "が"], "c": 2},
        {"q": "15. ねこ＿＿います。", "o": ["は", "を", "が", "に"], "c": 2},
        {"q": "16. きのう、私はデパート＿＿行きました。", "o": ["を", "に", "で", "が"], "c": 1},
        {"q": "17. シャツ＿＿買いました。", "o": ["を", "に", "で", "が"], "c": 0},
        {"q": "18. レストラン＿＿ごはんを食べました。", "o": ["を", "に", "で", "が"], "c": 2},
        {"q": "19. きのうは雨＿＿。", "o": ["です", "でした", "ます", "ません"], "c": 1},
        {"q": "20. 今日は天気＿＿いいです。", "o": ["が", "を", "に", "で"], "c": 0},
    ]

    for i, data in enumerate(m1_data):
        questions.append(Question(
            test_id=1, section=1, number=i+1, type="Section 1: Vocabulary & Grammar",
            question_text=data["q"], options=data["o"], correct_index=data["c"]
        ))

    # --- Mondai - 2: Reading (1-5) ---
    reading_context = "きのう、私は友だちと公園に行きました。\n公園でサッカーをしました。\nそのあと、店でジュースを買いました。\nとても楽しかったです。"
    m2_data = [
        {"q": "1. だれと行きましたか。", "o": ["先生", "家族", "友だち", "一人"], "c": 2},
        {"q": "2. どこに行きましたか。", "o": ["学校", "公園", "デパート", "レストラン"], "c": 1},
        {"q": "3. 何をしましたか。", "o": ["勉強しました", "食べました", "サッカーをしました", "買い物しました"], "c": 2},
        {"q": "4. どこでジュースを買いましたか。", "o": ["学校", "公園", "店", "家"], "c": 2},
        {"q": "5. 楽しかったですか。", "o": ["はい、楽しかったです", "いいえ、楽しくないです", "わかりません", "行きません"], "c": 0},
    ]

    for i, data in enumerate(m2_data):
        questions.append(Question(
            test_id=1, section=2, number=i+1, type="Section 2: Reading Comprehension",
            question_text=f"{reading_context}\n\n{data['q']}", 
            options=data["o"], correct_index=data["c"]
        ))

    # --- Mondai - 3: Listening (1-2) ---
    m3_data = [
        {"q": "1. 聴解問題 1", "o": ["1. こうえん", "2. えき", "3. きっさてん", "4. レストラン"], "c": 2, "audio": "/audio/one.mp4"},
        {"q": "2. 聴解問題 2", "o": ["1. 230えん", "2. 240えん", "3. 300えん", "4. 320えん"], "c": 2, "audio": "/audio/two.mp4"},
    ]

    for i, data in enumerate(m3_data):
        questions.append(Question(
            test_id=1, section=3, number=i+1, type="Section 3: Listening",
            question_text=data["q"], options=data["o"], correct_index=data["c"],
            audio_url=data["audio"]
        ))

    db.add_all(questions)
    db.commit()
    db.close()
    print("✅ Final Mock Test Paper implemented successfully!")

if __name__ == "__main__":
    seed_final()
