from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from jose import jwt, JWTError
import os
import json
import random
import time
import urllib.request
import urllib.error
from .. import models, schemas
from ..database import get_db
from ..auth_utils import SECRET_KEY, ALGORITHM

router = APIRouter()
security = HTTPBearer()

# --- Scaled authentic fallback templates per JLPT level ---
LEVEL_WORDS = {
    'N5': {
        'kanji_vocab': [
            ('学校', 'がっこう', ['かっこう', 'がこう', 'かこう'], '昨日、[学校]へ行きました。'),
        ],
        'orthography': [
            ('ともだち', '友達', ['友立', '右達', '有達'], 'きのう[ともだち]に会いました。'),
        ],
        'context_meaning': [
            ('かさ', ['かさ', 'くつ', 'かばん', 'ほん'], '雨が降っていますから、（　　）をさします。'),
        ],
        'paraphrase': [
            ('やさしいです', ['やさしいです', 'むずかしいです', 'おもしろいです', 'いそがしいです'], 'このテストは[かんたんです]。'),
        ],
        'grammar_form': [
            ('へ', ['へ', 'を', 'が', 'に'], '明日デパート（　　）買い物に行きます。'),
        ],
        'sentence_order': [
            {'scrambled': ['きのう', 'デパートで', 'ひとりで', '本を'], 'correct_order': [0, 1, 2, 3], 'text': 'わたしは ＿＿＿ ＿＿＿ ＿★＿ ＿＿＿ 買いました。', 'star_pos': 2, 'explanation': '★の位置は「ひとりで」です。'},
        ]
    },
    'N4': {
        'kanji_vocab': [
            ('運転', 'うんてん', ['うんでん', 'おんてん', 'うてん'], '車の[運転]を習っています。'),
        ],
        'orthography': [
            ('うんてん', '運転', ['連転', '達転', '伝転'], '車の[うんてん]は難しいです。'),
        ],
        'context_meaning': [
            ('連絡', ['連絡', '相談', '報告', '紹介'], '用事がありますので、後で（　　）します。'),
        ],
        'paraphrase': [
            ('かたづけました', ['かたづけました', 'そうじしました', 'あらいました', 'すてました'], '部屋を[整理しました]。'),
        ],
        'grammar_form': [
            ('ように', ['ように', 'ために', 'ままに', 'そうに'], '風邪をひかない（　　）暖かい服を着ます。'),
        ],
        'sentence_order': [
            {'scrambled': ['日本語が', '話せる', '練習して', 'ようになりたい'], 'correct_order': [2, 0, 1, 3], 'text': '毎日 ＿＿＿ ＿＿＿ ＿★＿ ＿＿＿。', 'star_pos': 2, 'explanation': '★の位置は「話せる」です。'},
        ]
    },
    'N3': {
        'kanji_vocab': [
            ('複雑', 'ふくざつ', ['ふくさつ', 'ふくざっ', 'ほくざつ'], 'この街の構造は[複雑]に入り組んでいる。'),
        ],
        'orthography': [
            ('えんき', '延期', ['縁期', '廷期', '延基'], '大雨のため、試合は明日に[えんき]された。'),
        ],
        'context_meaning': [
            ('がっかり', ['がっかり', 'すっきり', 'ばったり', 'うっかり'], 'テストの点数が悪くて（　　）した。'),
        ],
        'paraphrase': [
            ('おしまいになりました', ['おしまいになりました', 'はじまりました', 'つづきました', 'ちゅうししました'], '本日の営業は[終了しました]。'),
        ],
        'grammar_form': [
            ('わけにはいかない', ['わけにはいかない', 'はずがない', 'にすぎない', 'どころではない'], '明日は大事な試験があるから、遊びに行く（　　）。'),
        ],
        'sentence_order': [
            {'scrambled': ['おきまして', '皆様の', '多大なる', 'ご協力を'], 'correct_order': [1, 3, 2, 0], 'text': '本プロジェクトの成功に＿＿＿ ＿＿＿ ＿★＿ ＿＿＿ 感謝いたします。', 'star_pos': 2, 'explanation': '★の位置は「多大なる」です。'},
        ]
    },
    'N2': {
        'kanji_vocab': [
            ('徹夜', 'てつや', ['でつや', 'てつよ', 'てっや'], 'レポートを書くために[徹夜]した。'),
        ],
        'orthography': [
            ('けいき', '契機', ['契機', '形機', '経期'], '転職を[けいき]に、新しい趣味を始めた。'),
        ],
        'context_meaning': [
            ('反映', ['反映', '反省', '反発', '対応'], '住民の意見を街づくりに（　　）させる。'),
        ],
        'paraphrase': [
            ('一応', ['一応', '完全に', '絶対に', '次第に'], '[念のため]、もう一度スケジュールを確認させてください。'),
        ],
        'grammar_form': [
            ('つつある', ['つつある', 'がちだ', '気味だ', '一方だ'], 'スマートフォンの普及により、固定電話の利用者は減少（　　）。'),
        ],
        'sentence_order': [
            {'scrambled': ['ことなしに', '日々の', '語ることは', '努力を'], 'correct_order': [1, 3, 0, 2], 'text': '彼の成功は＿＿＿ ＿＿＿ ＿★＿ ＿＿＿ できない。', 'star_pos': 2, 'explanation': '★の位置は「ことなしに」です。'},
        ]
    },
    'N1': {
        'kanji_vocab': [
            ('完璧', 'かんぺき', ['かんべき', 'がんぺき', 'かんへき'], '彼の演技は[完璧]だった。'),
        ],
        'orthography': [
            ('いんぺい', '隠蔽', ['隠閉', '隠蔽', '穏蔽'], '不祥事の[いんぺい]を謀った企業が告発された。'),
        ],
        'context_meaning': [
            ('画期的', ['画期的', '圧倒的', '驚異的', '効率的'], 'その研究所は（　　）な治療法を開発した。'),
        ],
        'paraphrase': [
            ('余儀なくされた', ['余儀なくされた', '見送られた', '免除された', '歓迎された'], '台風の接近により、イベントは[中止せざるを得なかった]。'),
        ],
        'grammar_form': [
            ('極まりない', ['極まりない', '極まる', '極みだ', 'の至りだ'], '公共の場所で大声を出すのは、迷惑（　　）。'),
        ],
        'sentence_order': [
            {'scrambled': ['相まって', '卓越した', '日々の研鑽と', '才能が'], 'correct_order': [2, 3, 0, 1], 'text': '彼の快挙は＿＿＿ ＿＿＿ ＿★＿ ＿＿＿ 生まれた成果だ。', 'star_pos': 2, 'explanation': '★の位置は「相まって」です。'},
        ]
    }
}

LEVEL_CATEGORIES = ['kanji_vocab', 'orthography', 'context_meaning', 'paraphrase', 'grammar_form', 'sentence_order']

QUESTION_TYPE_LABELS = {
    'vocab': 'Vocabulary',
    'grammar': 'Grammar',
    'reading': 'Reading',
    'listening': 'Listening',
}

# Authentication and role checking
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> int:
    """Extract and validate JWT token, return authenticated user ID"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_teacher_role(current_user: int = Depends(get_current_user), db: Session = Depends(get_db)) -> models.User:
    """Verify user is a teacher"""
    user = db.query(models.User).filter(models.User.id == current_user).first()
    if not user or user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Teacher role required for this action")
    return user

# --- Mock Test Management ---

@router.get("", response_model=List[schemas.MockTestResponse])
def list_tests(teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """List all tests (teacher only)"""
    return db.query(models.MockTest).all()

@router.post("", response_model=schemas.MockTestResponse)
def create_test(test: schemas.MockTestCreate, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Create a new test (teacher only)"""
    # 1. Create the MockTest
    db_test = models.MockTest(
        title=test.title,
        level=test.level,
        duration=test.duration
    )
    db.add(db_test)
    db.commit()
    db.refresh(db_test)
    
    # 2. Add questions if provided
    for q in test.questions:
        db_q = models.Question(
            test_id=db_test.id,
            section=q.section,
            number=q.number,
            type=q.type,
            question_text=q.question_text,
            options=q.options,
            correct_index=q.correct_index,
            audio_url=q.audio_url,
            image_url=q.image_url
        )
        db.add(db_q)
    
    db.commit()
    db.refresh(db_test)
    return db_test

@router.put("/{test_id}", response_model=schemas.MockTestResponse)
def update_test(test_id: int, test_update: schemas.MockTestCreate, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Update a test (teacher only)"""
    db_test = db.query(models.MockTest).filter(models.MockTest.id == test_id).first()
    if not db_test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Update test metadata
    db_test.title = test_update.title
    db_test.level = test_update.level
    db_test.duration = test_update.duration
    
    # Update questions: Clear and recreate for simplicity
    # Manual cleanup of dependent answers to avoid foreign key violations
    db.query(models.UserAnswer).filter(models.UserAnswer.question_id.in_(
        db.query(models.Question.id).filter(models.Question.test_id == test_id)
    )).delete(synchronize_session=False)
    
    db.query(models.Question).filter(models.Question.test_id == test_id).delete()
    
    for q in test_update.questions:
        db_q = models.Question(
            test_id=test_id,
            section=q.section,
            number=q.number,
            type=q.type,
            question_text=q.question_text,
            options=q.options,
            correct_index=q.correct_index,
            audio_url=q.audio_url,
            image_url=q.image_url
        )
        db.add(db_q)
    
    db.commit()
    db.refresh(db_test)
    return db_test

@router.delete("/{test_id}")
def delete_test(test_id: int, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Delete a test (teacher only)"""
    db_test = db.query(models.MockTest).filter(models.MockTest.id == test_id).first()
    if not db_test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    db.delete(db_test)
    db.commit()
    return {"message": "Test deleted successfully"}


def build_ai_prompt(payload: schemas.AIGenerateRequest) -> str:
    easy, medium, hard = 0, 0, 0
    if payload.difficulty_mode == 'easy-only':
        easy = payload.count
    elif payload.difficulty_mode == 'medium-only':
        medium = payload.count
    elif payload.difficulty_mode == 'hard-only':
        hard = payload.count
    elif payload.difficulty_mode == 'fully-random':
        easy = payload.count // 3
        medium = payload.count // 3
        hard = payload.count - easy - medium
    else:
        easy = max(1, int(payload.count * 0.3))
        medium = max(1, int(payload.count * 0.5))
        hard = payload.count - easy - medium

    content_parts = []
    if payload.content.vocabulary:
        content_parts.append(f"Vocabulary:\n{payload.content.vocabulary}")
    if payload.content.grammar:
        content_parts.append(f"Grammar:\n{payload.content.grammar}")
    if payload.content.reading:
        content_parts.append(f"Reading:\n{payload.content.reading}")
    content_text = "\n\n".join(content_parts).strip()
    if not content_text:
        content_text = "No specific vocabulary, grammar, or reading content was provided. Generate a representative question set for this JLPT level."

    prompt = (
        f"Generate {payload.count} JLPT {payload.level} questions for the {payload.section} section.\n"
        f"Content to base questions on:\n{content_text}\n\n"
        "Requirements:\n"
        f"- Difficulty distribution: {easy} easy, {medium} medium, {hard} hard\n"
        f"- Question types: {', '.join(payload.question_types)}\n"
        "- All Japanese text must be grammatically correct\n"
        "- Distractors must be plausible but clearly wrong\n"
        "- No duplicate questions\n"
        "- Include a brief English explanation for each correct answer\n"
        "Return only a valid JSON array with objects following the exact schema:"
        " {id, type, level, section, difficulty, question_text, options, correct_answer_index, explanation, tags}."
    )
    return prompt


def build_stub_questions(payload: schemas.AIGenerateRequest):
    level_data = LEVEL_WORDS.get(payload.level, LEVEL_WORDS['N5'])
    question_types = payload.question_types if payload.question_types else ['vocab', 'grammar', 'reading']
    stubbed = []
    selected_sections = [k for k, v in payload.content.__dict__.items() if isinstance(v, str) and v.strip()]
    for idx in range(payload.count):
        qtype = question_types[idx % len(question_types)]
        category = LEVEL_CATEGORIES[idx % len(LEVEL_CATEGORIES)]
        item = random.choice(level_data.get(category, []))
        difficulty = 'easy' if idx < payload.count * 0.25 else 'medium' if idx < payload.count * 0.7 else 'hard'
        question_text = ''
        options = []
        correct_idx = 0

        if category in ('kanji_vocab', 'orthography'):
            question_text = f"What is the correct reading or orthography for '{item[0]}' in context?"
            options = item[2] if len(item) >= 3 else ['A', 'B', 'C', 'D']
            correct_idx = 0
        elif category == 'context_meaning':
            question_text = f"Choose the best meaning for the underlined item in this sentence: {item[2]}"
            options = item[1]
            correct_idx = 0
        elif category == 'paraphrase':
            question_text = f"Which phrase best matches the highlighted phrase? {item[2]}"
            options = item[1]
            correct_idx = 0
        elif category == 'grammar_form':
            question_text = f"Select the correct particle or form to complete the sentence: {item[2]}"
            options = item[1]
            correct_idx = 0
        elif category == 'sentence_order':
            scrambled = ' / '.join(item['scrambled'])
            question_text = f"Arrange the sentence pieces in the correct order: {scrambled}"
            correct_sequence = ' '.join([item['scrambled'][i] for i in item['correct_order']])
            options = [correct_sequence, ' '.join(item['scrambled'][::-1]), ' '.join(item['scrambled'][1:] + item['scrambled'][:1]), ' '.join(item['scrambled'][2:] + item['scrambled'][:2])]
            correct_idx = 0
        else:
            question_text = f"Sample JLPT {payload.level} question based on the fallback template."
            options = [f'Option {i + 1}' for i in range(4)]
            correct_idx = idx % 4

        stubbed.append({
            'id': idx + 1,
            'type': QUESTION_TYPE_LABELS.get(qtype, qtype),
            'level': payload.level,
            'section': payload.section,
            'difficulty': difficulty,
            'question_text': question_text,
            'options': options,
            'correct_answer_index': correct_idx,
            'explanation': f'Correct answer is {options[correct_idx]}.',
            'tags': [payload.level.lower(), category],
            'engine': 'Local Engine Fallback'
        })
    return stubbed


def call_claude_api(prompt: str):
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        return None
    url = 'https://api.anthropic.com/v1/complete'
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': api_key
    }
    body = {
        'model': 'claude-sonnet-4-20250514',
        'prompt': prompt,
        'max_tokens_to_sample': 1500,
        'temperature': 0.2,
        'stop_sequences': ['\n\nHuman:']
    }
    try:
        request_data = json.dumps(body).encode('utf-8')
        req = urllib.request.Request(url, data=request_data, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except (urllib.error.HTTPError, urllib.error.URLError, ValueError, OSError):
        return None


def build_listening_questions(script: str, level: str, count: int):
    questions = []
    for idx in range(count):
        options = [f'Option {i + 1}' for i in range(4)]
        correct_idx = idx % 4
        questions.append({
            'id': idx + 1,
            'type': 'listening',
            'level': level,
            'section': 'listening',
            'difficulty': 'medium' if count > 1 else 'easy',
            'question_text': f'Listening comprehension question {idx + 1} based on the generated audio.',
            'options': options,
            'correct_answer_index': correct_idx,
            'explanation': f'The correct answer is {options[correct_idx]} based on the audio details.',
            'tags': ['listening', level.lower()]
        })
    return questions


@router.post('/ai/generate-questions')
def generate_ai_questions(request_data: schemas.AIGenerateRequest, teacher: models.User = Depends(require_teacher_role)):
    """Generate AI-backed JLPT question arrays."""
    try:
        prompt = build_ai_prompt(request_data)
        ai_response = call_claude_api(prompt)

        if ai_response:
            text = ''
            if isinstance(ai_response, dict):
                text = ai_response.get('completion', '') or ai_response.get('response', '') or ai_response.get('output', '')
            if not text and isinstance(ai_response, str):
                text = ai_response
            try:
                parsed = json.loads(text.strip())
                if isinstance(parsed, list):
                    for q in parsed:
                        if isinstance(q, dict):
                            q.setdefault('engine', 'AI Core')
                    return parsed
            except Exception as parse_exc:
                print(f"AI response parse failed: {parse_exc}")
    except Exception as gen_exc:
        print(f"AI generation failed: {gen_exc}")

    try:
        return build_stub_questions(request_data)
    except Exception as fallback_exc:
        print(f"Fallback generation failed: {fallback_exc}")

    # Last-resort fallback to avoid returning a 500
    return [
        {
            'id': i + 1,
            'type': 'Multiple Choice',
            'level': request_data.level,
            'section': request_data.section,
            'difficulty': 'medium',
            'question_text': 'Fallback generated question text could not be created.',
            'options': ['A', 'B', 'C', 'D'],
            'correct_answer_index': 0,
            'explanation': 'No question generator was available; this is a placeholder.',
            'tags': [request_data.level.lower(), 'fallback'],
            'engine': 'Fallback Safe Mode'
        }
        for i in range(max(1, request_data.count))
    ]


@router.post('/listening/generate-audio')
def generate_listening_audio(request_data: schemas.ListeningAudioRequest, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Generate listening audio and optional comprehension questions."""
    if not request_data.script.strip():
        raise HTTPException(status_code=400, detail='Script text is required')
    if request_data.speaker_count not in (1, 2, 3):
        raise HTTPException(status_code=400, detail='Speaker count must be 1, 2, or 3')

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    audio_dir = os.path.join(base_dir, 'static', 'audio')
    os.makedirs(audio_dir, exist_ok=True)

    timestamp = int(time.time() * 1000)
    filename = f'listening_script_{timestamp}.mp3'
    static_path = os.path.join(audio_dir, filename)

    try:
        from gtts import gTTS
        slow_mode = request_data.speech_speed == 'slow'
        tts = gTTS(text=request_data.script.strip(), lang='ja', slow=slow_mode)
        tts.save(static_path)

        if not os.path.exists(static_path) or os.path.getsize(static_path) == 0:
            raise Exception('Audio generation failed or produced an empty file')

        audio_url = f'/static/audio/{filename}'
        metadata = {
            'duration_seconds': None,
            'language': 'ja',
            'voice_style': request_data.voice_style,
            'speech_speed': request_data.speech_speed,
            'speaker_count': request_data.speaker_count,
            'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }

        questions = []
        if request_data.generate_questions:
            questions = build_listening_questions(request_data.script, request_data.level, request_data.question_count)

        return {
            'audio_url': audio_url,
            'filename': filename,
            'metadata': metadata,
            'questions': questions
        }
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(static_path):
            try:
                os.remove(static_path)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f'Audio generation failed: {str(e)}')


@router.post('/ai/save-generated-set', response_model=schemas.MockTestResponse)
def save_generated_set(payload: schemas.MockTestCreate, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    """Save a generated question set as a mock test in the question bank."""
    db_test = models.MockTest(title=payload.title, level=payload.level, duration=payload.duration)
    db.add(db_test)
    db.commit()
    db.refresh(db_test)

    for q in payload.questions:
        db_q = models.Question(
            test_id=db_test.id,
            section=q.section,
            number=q.number,
            type=q.type,
            question_text=q.question_text,
            options=q.options,
            correct_index=q.correct_index,
            difficulty=q.difficulty,
            explanation=q.explanation,
            tags=q.tags,
            audio_url=q.audio_url,
            image_url=q.image_url
        )
        db.add(db_q)

    db.commit()
    db.refresh(db_test)
    return db_test


@router.post('/ai/save-template', response_model=schemas.QuestionTemplateResponse)
def save_template(payload: schemas.QuestionTemplateCreate, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    template = models.QuestionTemplate(
        user_id=teacher.id,
        name=payload.name,
        level=payload.level,
        section=payload.section,
        questions=[q.dict() for q in payload.questions],
        template_metadata=payload.template_metadata or {}
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get('/templates', response_model=List[schemas.QuestionTemplateResponse])
def list_templates(teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    return db.query(models.QuestionTemplate).filter(models.QuestionTemplate.user_id == teacher.id).all()


@router.delete('/templates/{template_id}')
def delete_template(template_id: int, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    template = db.query(models.QuestionTemplate).filter(models.QuestionTemplate.id == template_id, models.QuestionTemplate.user_id == teacher.id).first()
    if not template:
        raise HTTPException(status_code=404, detail='Template not found')
    db.delete(template)
    db.commit()
    return {'message': 'Template deleted successfully'}


@router.get('/settings', response_model=schemas.TeacherSettingsResponse)
def get_settings(teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    settings = db.query(models.TeacherSettings).filter(models.TeacherSettings.user_id == teacher.id).first()
    if not settings:
        settings = models.TeacherSettings(user_id=teacher.id, module_toggles={
            'vocabulary': True,
            'grammar': True,
            'reading': True,
            'listening': True,
            'ai_bulk_generator': True,
            'listening_engine': True,
            'answer_key': True,
            'difficulty_balancer': True,
            'duplicate_checker': True,
            'timer': True,
            'score_report': True,
            'answer_review': True,
            'progress_tracker': True
        })
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put('/settings', response_model=schemas.TeacherSettingsResponse)
def update_settings(payload: schemas.TeacherSettingsUpdate, teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    settings = db.query(models.TeacherSettings).filter(models.TeacherSettings.user_id == teacher.id).first()
    if not settings:
        settings = models.TeacherSettings(user_id=teacher.id, module_toggles=payload.module_toggles)
        db.add(settings)
    else:
        settings.module_toggles = payload.module_toggles
    db.commit()
    db.refresh(settings)
    return settings


@router.get('/levels', response_model=schemas.LevelConfigResponse)
def get_levels(teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    levels = db.query(models.LevelConfig).all()
    if not levels:
        default_levels = [
            {'level': 'N5', 'duration': 110, 'questions': 72, 'pass_score': 38.0},
            {'level': 'N4', 'duration': 110, 'questions': 72, 'pass_score': 38.0},
            {'level': 'N3', 'duration': 140, 'questions': 95, 'pass_score': 38.0},
            {'level': 'N2', 'duration': 155, 'questions': 90, 'pass_score': 50.0},
            {'level': 'N1', 'duration': 170, 'questions': 90, 'pass_score': 50.0}
        ]
        for item in default_levels:
            db_level = models.LevelConfig(**item)
            db.add(db_level)
        db.commit()
        levels = db.query(models.LevelConfig).all()
    return {'levels': levels}


@router.put('/levels', response_model=schemas.LevelConfigResponse)
def update_levels(payload: List[schemas.LevelConfigItem], teacher: models.User = Depends(require_teacher_role), db: Session = Depends(get_db)):
    for item in payload:
        level = db.query(models.LevelConfig).filter(models.LevelConfig.level == item.level).first()
        if level:
            level.duration = item.duration
            level.questions = item.questions
            level.pass_score = item.pass_score
        else:
            db.add(models.LevelConfig(level=item.level, duration=item.duration, questions=item.questions, pass_score=item.pass_score))
    db.commit()
    return {'levels': db.query(models.LevelConfig).all()}
