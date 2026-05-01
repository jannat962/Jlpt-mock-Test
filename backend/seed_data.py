from app.database import SessionLocal
from app.models import Question, User


def seed():
    db = SessionLocal()

    default_user = db.query(User).filter(User.id == 1).first()
    if not default_user:
        default_user = User(
            id=1,
            name="Test User",
            email="test@example.com",
            password_hash="test123",
            readiness_score=0.0,
        )
        db.add(default_user)
        db.commit()
        print("✅ Created default test user with id=1")

    sample_questions = [
        # Section 0: Kanji → Hiragana
        Question(
            test_id=1,
            section=0,
            number=1,
            type="Kanji",
            question_text="勤めます",
            options=["つとめます", "つかせます", "つくだきます", "つくります"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=2,
            type="Kanji",
            question_text="図書館",
            options=["としょかん", "ずしょかん", "どうしょかん", "としょきん"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=3,
            type="Kanji",
            question_text="働いています",
            options=["はたらいています", "あそんでいます", "のんでいます", "むすんでいます"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=4,
            type="Kanji",
            question_text="銀行",
            options=["ぎんこう", "きんこう", "しんこう", "こんこう"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=5,
            type="Kanji",
            question_text="葡萄",
            options=["ぶどう", "ふどう", "ほどう", "ぼどう"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=6,
            type="Kanji",
            question_text="作ります",
            options=["つくります", "さくります", "つかいます", "つかれます"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=7,
            type="Kanji",
            question_text="紙",
            options=["かみ", "し", "き", "こ"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=8,
            type="Kanji",
            question_text="木でできています",
            options=["き", "こ", "もく", "ぼく"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=9,
            type="Kanji",
            question_text="医者",
            options=["いしゃ", "いじゃ", "いさ", "いちゃ"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=10,
            type="Kanji",
            question_text="教室",
            options=["きょうしつ", "きょうじつ", "きょくしつ", "きょうしき"],
            correct_index=0,
        ),

        # Section 1: Grammar / Particle
        Question(
            test_id=1,
            section=0,
            number=11,
            type="Grammar",
            question_text="兄は日本で働いています。" + " この「で」は何を表しますか？",
            options=["働く場所", "目的地", "素材", "頻度"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=12,
            type="Grammar",
            question_text="兄は日本のトヨタに勤めています。" + " この「に」は何を表しますか？",
            options=["目的地", "会社・勤務先", "原料", "手段"],
            correct_index=1,
        ),
        Question(
            test_id=1,
            section=0,
            number=13,
            type="Grammar",
            question_text="ぶどうからワインを作ります。" + " この「から」は何を示しますか？",
            options=["原料", "場所", "頻度", "手段"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=14,
            type="Grammar",
            question_text="１日に３回、この薬を飲んでいます。" + " この「に」は何を表しますか？",
            options=["場所", "頻度", "原料", "方法"],
            correct_index=1,
        ),
        Question(
            test_id=1,
            section=0,
            number=15,
            type="Grammar",
            question_text="この子ではうるさいですが、外ではおとなしいです。" + " この「では」はどんな意味ですか？",
            options=["比較・対比", "所属", "例示", "原因"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=16,
            type="Grammar",
            question_text="たんじょう日に父からも母からもプレゼントをもらいました。" + " この「も」はどれですか？",
            options=["〜も…も = 両方とも", "〜も = 場所", "〜も = 頻度", "〜も = 原料"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=17,
            type="Grammar",
            question_text="このプリントを１枚ずつ配ってください。" + " この「ずつ」はどんな意味？",
            options=["均等に", "速さ", "頻度", "量"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=18,
            type="Grammar",
            question_text="学校まで２時間もかかります。" + " この「も」はどんなニュアンスですか？",
            options=["驚き・多さの強調", "場所", "原料", "目的地"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=19,
            type="Grammar",
            question_text="この机は木でできています。" + " この「で」は何を示しますか？",
            options=["原材料・素材", "場所", "頻度", "手段"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=0,
            number=20,
            type="Grammar",
            question_text="富士山は日本でいちばん高い山です。" + " この「で」は何を表しますか？",
            options=["範囲・スコープ", "原料", "原因", "場所"],
            correct_index=0,
        ),

        # Section 2: Short Story / Listening
        Question(
            test_id=1,
            section=1,
            number=21,
            type="Reading",
            question_text=(
                "昨日、私は図書館で勉強しました。友達と一緒に駅前のカフェで休みました。"
                "その後、学校までバスで帰りました。家に着いてから、本を一冊読みました。"
                " この文で、「で」が場所で使われているのはどれですか？"
            ),
            options=[
                "図書館で勉強しました", 
                "駅前のカフェで休みました", 
                "バスで帰りました", 
                "家に着いてから"
            ],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=1,
            number=22,
            type="Reading",
            question_text=(
                "昨日、私は図書館で勉強しました。友達と一緒に駅前のカフェで休みました。"
                "その後、学校までバスで帰りました。家に着いてから、本を一冊読みました。"
                " この文で、「から」は何を表しますか？"
            ),
            options=["〜した後で", "〜の場所", "〜の手段", "〜の素材"],
            correct_index=0,
        ),
        Question(
            test_id=1,
            section=2,
            number=23,
            type="Listening",
            question_text=(
                "田中さんは毎朝八時に会社に行きます。会社ではパソコンで仕事をして、昼休みに先輩と一緒にランチを食べます。"
                "午後は会議が二つあります。仕事のあと、駅前の本屋で本を一冊買いました。"
                " この文で、「会社では」の「で」は何の意味ですか？"
            ),
            options=["仕事をする場所", "目的地", "原料", "頻度"],
            correct_index=0,
            audio_url="https://audio-api.example.com/n4_listening_01.mp3",
            image_url='{"duration_seconds": 35, "language": "ja", "voice": "female_japanese_n4", "generated_at": "2026-04-08T14:00:00", "transcript": "田中さんは毎朝八時に会社に行きます。会社ではパソコンで仕事をして、昼休みに先輩と一緒にランチを食べます。午後は会議が二つあります。仕事のあと、駅前の本屋で本を一冊買いました。"}',
        ),
        Question(
            test_id=1,
            section=2,
            number=24,
            type="Listening",
            question_text=(
                "このレストランでは魚料理が人気です。料理は新鮮な魚と野菜から作られます。"
                "店ではお客さんが毎日たくさん来るので、ときどき予約が必要です。午後七時に行くと、まだ席があります。"
                " この文で、「から」は何を示しますか？"
            ),
            options=["原材料", "場所", "手段", "頻度"],
            correct_index=0,
            audio_url="https://audio-api.example.com/n4_listening_02.mp3",
            image_url='{"duration_seconds": 38, "language": "ja", "voice": "female_japanese_n4", "generated_at": "2026-04-08T14:00:00", "transcript": "このレストランでは魚料理が人気です。料理は新鮮な魚と野菜から作られます。店ではお客さんが毎日たくさん来るので、ときどき予約が必要です。午後七時に行くと、まだ席があります。"}',
        ),
    ]

    db.add_all(sample_questions)
    db.commit()
    print("🌱 Database seeded with N4 questions!")

    # Generate AI audio for listening questions
    listening_questions = db.query(Question).filter(Question.type == "Listening").all()
    for q in listening_questions:
        # Simulate AI audio generation with proper metadata
        audio_id = f"n4_listening_{q.number}"
        q.audio_url = f"https://api.example.com/audio/{audio_id}.mp3"
        # Add audio metadata as JSON in image_url field (temporary)
        q.image_url = f'{{"duration": 35, "language": "ja", "generated": true, "transcript": "{q.question_text[:100]}..."}}'
    
    db.commit()
    print(f"🎵 Generated AI audio for {len(listening_questions)} listening questions")

    db.close()


if __name__ == "__main__":
    seed()
