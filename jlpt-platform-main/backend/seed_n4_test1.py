import os
import sys

# Ensure the backend app module is importable
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, SessionLocal, Base
from app.models import Question, UserAnswer

def seed_n4():
    # Create all tables if they don't exist yet
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        print("Clearing old user answers for Test 1 questions...")
        # Get question IDs for test 1 first
        old_q_ids = [q.id for q in session.query(Question.id).filter(Question.test_id == 1).all()]
        if old_q_ids:
            session.query(UserAnswer).filter(UserAnswer.question_id.in_(old_q_ids)).delete(synchronize_session=False)
            session.commit()

        print("Clearing old Test 1 questions...")
        session.query(Question).filter(Question.test_id == 1).delete()
        session.commit()

        print("Adding 20 N4 Kanji & Vocabulary questions...")

        raw_data = [
            # もんだい 1
            (1,  "和服は全然着る チャンスがありません。",                             ["おふく", "わふく", "Lふく", "きもの"],           2, "もんだい 1"),
            (2,  "地下鉄で 仕事に行きます。",                                        ["ちはてつ", "じはでつ", "ちかてつ", "じかてつ"],   3, "もんだい 1"),
            (3,  "夏休みの計画を します。",                                           ["けいが", "けかく", "けえが", "けいかく"],          4, "もんだい 1"),
            (4,  "用事がありますから、お先にしつれいします。",                         ["よじ", "ようじ", "ゆじ", "ゆうじ"],              2, "もんだい 1"),
            (5,  "電池がなくなったんですが、新しいのがありますか。",                   ["でんき", "でんし", "でんじ", "でんち"],           4, "もんだい 1"),
            (6,  "しんごうの青は進め、黄色は注意、赤は止まれ という意味です。",       ["つうい", "しゅうい", "ちゅうい", "じゅうい"],     3, "もんだい 1"),
            (7,  "その人の顔はわかりますが、名前が思い出せません。",                   ["かわ", "かお", "かう", "こえ"],                  2, "もんだい 1"),
            (8,  "このことばの発音の仕方を教えてください。",                           ["しかた", "しほう", "しがた", "しょう"],           1, "もんだい 1"),
            (9,  "先生の かばんは重いですね。",                                       ["おむい", "おもい", "おおい", "じゅうい"],          2, "もんだい 1"),
            (10, "意見のある人は手を上げてください。",                                ["いみ", "いけん", "いげん", "しつもん"],           2, "もんだい 1"),
            # もんだい 2
            (11, "じゅぎょうがはじまりますから、教室に入りましょう。",                ["始まります", "通ります", "降ります", "集まります"], 1, "もんだい 2"),
            (12, "おそくなるときはしらせてください。",                                ["和らせて", "知らせて", "仕らせて", "使らせて"],   2, "もんだい 2"),
            (13, "おてらのいけに赤や黄色の魚がいます。",                              ["池", "地", "他", "洋"],                          1, "もんだい 2"),
            (14, "日本語について けんきゅうします。",                                  ["勉強", "說明", "研究", "教育"],                   3, "もんだい 2"),
            (15, "わたしの大学はこうぎょう大学です。",                                ["工業", "産業", "行業", "高菜"],                   1, "もんだい 2"),
            (16, "うちの犬は毎朝家族をおこします。",                                  ["別こします", "起こします", "光こします", "発こします"], 2, "もんだい 2"),
            (17, "その本は1週間いないにかえしてください。",                            ["以上", "以外", "以内", "以下"],                   3, "もんだい 2"),
            (18, "これで わたしの話はおわります。",                                   ["終わります", "回ります", "代わります", "光ります"], 1, "もんだい 2"),
            (19, "台所から なにかおとが聞こえますね。",                               ["歌", "事", "音", "首"],                          3, "もんだい 2"),
            (20, "この荷物はかるいです。",                                            ["広い", "軽い", "太い", "寒い"],                   2, "もんだい 2"),
        ]

        for item in raw_data:
            num, text, options, answer_one_based, q_type = item

            if q_type == "もんだい 1":
                prefix = "＿＿＿のことばはひらがなでどうかきますか。１・２・３・４から いちばんいいものをひとつえらんでください。\n\n"
            else:
                prefix = "＿＿＿のことばはどうかきますか。１・２・３・４から いちばんいいものをひとつ えらんでください。\n\n"

            full_text = f"{prefix}({num}) {text}"

            q = Question(
                test_id=1,
                section=0,
                number=num,
                type=q_type,
                question_text=full_text,
                options=options,
                correct_index=answer_one_based - 1
            )
            session.add(q)

        session.commit()
        print("Successfully seeded 20 N4 Kanji & Vocabulary questions into Test 1!")
    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    seed_n4()
