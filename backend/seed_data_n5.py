from app.database import SessionLocal
from app.models import Question, User

def seed_n5():
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

    # N5 Questions based on Real Test Format
    n5_questions = [
        # --- VOCABULARY ---
        Question(
            test_id=1, section=0, number=1, type="もんだい １",
            question_text="＿＿＿ の ことばは どう よみますか。 １・２・３・４から いちばん いい ものを ひとつ えらんで ください。\n\n(1) 新しい くるまですね。",
            options=["あたらしい", "あだらしい", "あらたしい", "あらだしい"], correct_index=0
        ),
        Question(
            test_id=1, section=0, number=2, type="もんだい １",
            question_text="(2) 電気を つけて ください。",
            options=["てんぎ", "てんき", "でんぎ", "でんき"], correct_index=3
        ),
        Question(
            test_id=1, section=0, number=3, type="もんだい ２",
            question_text="＿＿＿ の ことばは どう かきますか。\n\n(3) そとで まちましょう。",
            options=["列", "外", "例", "処"], correct_index=1
        ),
        
        # --- GRAMMAR (Mondai 3 Context) ---
        Question(
            test_id=1, section=0, number=5, type="もんだい ３",
            question_text="ジョンさんと ヤンさんは あした じこしょうかいを します。二人は じこしょうかいの ぶんしょうを 書きました。\n\nはじめまして。ジョン・スミスです。アメリカから [ 5 ]。 \n\n(5) には何を入れますか。",
            options=["行きます", "行きました", "来ます", "来ました"], correct_index=2,
            image_url="/images/n5_mondai3_context.png"
        ),
        Question(
            test_id=1, section=0, number=6, type="もんだい ３",
            question_text="わたしは えいがが 好きです。アメリカの えいがは よく 知っています。[ 6 ]、日本の えいがは あまり 知りません。 \n\n(6) には何を入れますか。",
            options=["では", "だから", "でも", "それから"], correct_index=2,
            image_url="/images/n5_m3_text.png"
        ),

        # --- READING (Mondai 4 Letter) ---
        Question(
            test_id=1, section=1, number=10, type="もんだい ４",
            question_text="つぎの ぶんを 読んで しつもんに こたえて ください。\n\nアンナさん\n今週は しごとが たくさん あります。土曜日と 日曜日も いそがしいです。来週の 月曜日に 来て ください。\n\nしつもん：先生は いつ 時間が ありますか。",
            options=["今週", "土曜日", "日曜日", "月曜日"], correct_index=3
        ),

        # --- LISTENING (Mondai 1) ---
        Question(
            test_id=1, section=2, number=1, type="聴解 もんだい １",
            question_text="もんだい１では はじめに しつもんを きいて ください。それから はなしを きいて、もんだいようしの １から４の なかから、ただしい こたえを ひとつ えらんで ください。\n\n１ばん",
            options=["1", "2", "3", "4"], correct_index=2,
            audio_url="/audio/N5Sample.mp3",
            image_url="/images/n5_l1_q1_grid.png"
        ),

        # --- LISTENING (Mondai 2) ---
        Question(
            test_id=1, section=2, number=2, type="聴解 もんだい ２",
            question_text="２ばん",
            options=["1", "2", "3", "4"], correct_index=1,
            audio_url="/audio/N5Sample.mp3",
            image_url="/images/n5_l2_q1.png"
        )
    ]

    db.add_all(n5_questions)
    db.commit()
    db.close()
    print("🌱 Database seeded with real N5 Sample questions!")

if __name__ == "__main__":
    seed_n5()
