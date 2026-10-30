"""
AI Career Coach - Database Module
SQLite database with schema management.
"""
import sqlite3
import json
from datetime import datetime
from pathlib import Path
from config import Config


def get_db():
    """Get a database connection."""
    Config.ensure_dirs()
    conn = sqlite3.connect(str(Config.DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Initialize the database schema."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.executescript("""
    -- CVs table
    CREATE TABLE IF NOT EXISTS cvs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT 'Untitled CV',
        language TEXT NOT NULL DEFAULT 'en',
        contact_info TEXT DEFAULT '{}',
        professional_summary TEXT DEFAULT '',
        sections TEXT DEFAULT '[]',
        template TEXT DEFAULT 'professional',
        status TEXT DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- CV versions (for optimization tracking)
    CREATE TABLE IF NOT EXISTS cv_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cv_id INTEGER,
        version_type TEXT DEFAULT 'original',
        content TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE
    );
    
    -- Evaluations
    CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cv_id INTEGER,
        evaluation_type TEXT DEFAULT 'general',
        input_text TEXT DEFAULT '',
        job_description TEXT DEFAULT '',
        results TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE SET NULL
    );
    
    -- Optimization suggestions
    CREATE TABLE IF NOT EXISTS optimization_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cv_id INTEGER,
        session_id TEXT NOT NULL,
        original_text TEXT NOT NULL,
        suggested_text TEXT NOT NULL,
        section TEXT DEFAULT '',
        reason TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        user_edited_text TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE
    );
    
    -- Interview sessions
    CREATE TABLE IF NOT EXISTS interview_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_role TEXT DEFAULT '',
        industry TEXT DEFAULT '',
        interview_type TEXT DEFAULT 'behavioral',
        difficulty TEXT DEFAULT 'medium',
        language TEXT DEFAULT 'en',
        cv_id INTEGER,
        job_description TEXT DEFAULT '',
        status TEXT DEFAULT 'active',
        settings TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE SET NULL
    );
    
    -- Interview Q&A
    CREATE TABLE IF NOT EXISTS interview_qa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        question_number INTEGER DEFAULT 1,
        question TEXT NOT NULL,
        user_answer TEXT DEFAULT '',
        evaluation TEXT DEFAULT '{}',
        example_answer TEXT DEFAULT '',
        retry_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
    );
    
    -- Rejection analyses
    CREATE TABLE IF NOT EXISTS rejection_analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_title TEXT DEFAULT '',
        company TEXT DEFAULT '',
        application_details TEXT DEFAULT '',
        feedback_received TEXT DEFAULT '',
        analysis TEXT DEFAULT '{}',
        improvement_plan TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Offer reviews
    CREATE TABLE IF NOT EXISTS offer_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_title TEXT DEFAULT '',
        company TEXT DEFAULT '',
        offer_details TEXT DEFAULT '',
        user_priorities TEXT DEFAULT '',
        analysis TEXT DEFAULT '{}',
        negotiation_messages TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Uploaded documents
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        extracted_text TEXT DEFAULT '',
        purpose TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Chat conversations
    CREATE TABLE IF NOT EXISTS chat_conversations (
        id TEXT PRIMARY KEY,
        title TEXT DEFAULT 'New Conversation',
        language TEXT DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Chat messages
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        tool_calls TEXT DEFAULT '[]',
        tool_results TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
    );
    """)
    
    conn.commit()
    conn.close()


# ---- CRUD Helpers ----

def dict_from_row(row):
    """Convert a sqlite3.Row to a dict, parsing JSON fields."""
    if row is None:
        return None
    d = dict(row)
    json_fields = ['contact_info', 'sections', 'results', 'evaluation',
                   'analysis', 'improvement_plan', 'settings', 'negotiation_messages']
    for field in json_fields:
        if field in d and isinstance(d[field], str):
            try:
                d[field] = json.loads(d[field])
            except (json.JSONDecodeError, TypeError):
                pass
    return d


def _normalize_cv_data(data):
    """Ensure contact_info and sections are structured even if flat fields are passed."""
    contact_raw = data.get('contact_info', {})
    if isinstance(contact_raw, str):
        try:
            contact_raw = json.loads(contact_raw)
        except Exception:
            contact_raw = {}
    contact = dict(contact_raw) if isinstance(contact_raw, dict) else {}
    for field in ('name', 'email', 'phone', 'location', 'linkedin'):
        if not contact.get(field) and data.get(field):
            contact[field] = data.get(field)

    sections_raw = data.get('sections', [])
    if isinstance(sections_raw, str):
        try:
            sections_raw = json.loads(sections_raw)
        except Exception:
            sections_raw = []
    sections = list(sections_raw) if isinstance(sections_raw, list) else []

    if not sections:
        if data.get('experience'):
            exp = data['experience']
            items = exp if isinstance(exp, list) else [str(exp)]
            sections.append({'title': 'Experience', 'type': 'experience', 'items': items})
        if data.get('education'):
            edu = data['education']
            items = edu if isinstance(edu, list) else [str(edu)]
            sections.append({'title': 'Education', 'type': 'education', 'items': items})
        if data.get('projects'):
            proj = data['projects']
            items = proj if isinstance(proj, list) else [str(proj)]
            sections.append({'title': 'Projects', 'type': 'projects', 'items': items})
        if data.get('skills'):
            sk = data['skills']
            items = sk if isinstance(sk, list) else [s.strip() for s in str(sk).split(',') if s.strip()]
            sections.append({'title': 'Skills', 'type': 'skills', 'items': items})
        if data.get('certifications'):
            cert = data['certifications']
            items = cert if isinstance(cert, list) else [str(cert)]
            sections.append({'title': 'Certifications', 'type': 'certifications', 'items': items})
        if data.get('achievements'):
            ach = data['achievements']
            items = ach if isinstance(ach, list) else [str(ach)]
            sections.append({'title': 'Achievements', 'type': 'achievements', 'items': items})

    summary = data.get('professional_summary') or data.get('summary', '')
    return contact, sections, summary


def save_cv(data):
    """Create or update a CV."""
    conn = get_db()
    cursor = conn.cursor()
    
    cv_id = data.get('id')
    contact_dict, sections_list, summary = _normalize_cv_data(data)
    contact_info = json.dumps(contact_dict)
    sections = json.dumps(sections_list)
    title = data.get('title') or (f"{contact_dict.get('name')} CV" if contact_dict.get('name') else 'Untitled CV')
    
    if cv_id:
        cursor.execute("""
            UPDATE cvs SET 
                title=?, language=?, contact_info=?, professional_summary=?,
                sections=?, template=?, status=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        """, (
            title,
            data.get('language', 'en'),
            contact_info,
            summary,
            sections,
            data.get('template', 'professional'),
            data.get('status', 'draft'),
            cv_id
        ))
    else:
        cursor.execute("""
            INSERT INTO cvs (title, language, contact_info, professional_summary, sections, template, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            title,
            data.get('language', 'en'),
            contact_info,
            summary,
            sections,
            data.get('template', 'professional'),
            data.get('status', 'draft')
        ))
        cv_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    return cv_id


def save_cv_version(cv_id, version_type='original', content=None):
    """Save a snapshot of a CV in cv_versions to preserve history before edits."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO cv_versions (cv_id, version_type, content)
        VALUES (?, ?, ?)
    """, (cv_id, version_type, json.dumps(content or {})))
    ver_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return ver_id


def get_cv(cv_id):
    """Get a CV by ID."""
    conn = get_db()
    row = conn.execute("SELECT * FROM cvs WHERE id=?", (cv_id,)).fetchone()
    conn.close()
    return dict_from_row(row)


def list_cvs():
    """List all CVs."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM cvs ORDER BY updated_at DESC").fetchall()
    conn.close()
    return [dict_from_row(r) for r in rows]


def delete_cv(cv_id):
    """Delete a CV and its related data."""
    conn = get_db()
    conn.execute("DELETE FROM cvs WHERE id=?", (cv_id,))
    conn.commit()
    conn.close()


def save_evaluation(data):
    """Save an evaluation."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO evaluations (cv_id, evaluation_type, input_text, job_description, results)
        VALUES (?, ?, ?, ?, ?)
    """, (
        data.get('cv_id'),
        data.get('evaluation_type', 'general'),
        data.get('input_text', ''),
        data.get('job_description', ''),
        json.dumps(data.get('results', {}))
    ))
    eval_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return eval_id


def get_evaluation(eval_id):
    """Get an evaluation by ID."""
    conn = get_db()
    row = conn.execute("SELECT * FROM evaluations WHERE id=?", (eval_id,)).fetchone()
    conn.close()
    return dict_from_row(row)


def list_evaluations():
    """List all evaluations."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM evaluations ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict_from_row(r) for r in rows]


def save_interview_session(data):
    """Create or update an interview session."""
    conn = get_db()
    cursor = conn.cursor()
    
    session_id = data.get('id')
    settings = json.dumps(data.get('settings', {}))
    
    if session_id:
        cursor.execute("""
            UPDATE interview_sessions SET
                target_role=?, industry=?, interview_type=?, difficulty=?,
                language=?, cv_id=?, job_description=?, status=?,
                settings=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        """, (
            data.get('target_role', ''),
            data.get('industry', ''),
            data.get('interview_type', 'behavioral'),
            data.get('difficulty', 'medium'),
            data.get('language', 'en'),
            data.get('cv_id'),
            data.get('job_description', ''),
            data.get('status', 'active'),
            settings,
            session_id
        ))
    else:
        cursor.execute("""
            INSERT INTO interview_sessions 
            (target_role, industry, interview_type, difficulty, language, cv_id, job_description, status, settings)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get('target_role', ''),
            data.get('industry', ''),
            data.get('interview_type', 'behavioral'),
            data.get('difficulty', 'medium'),
            data.get('language', 'en'),
            data.get('cv_id'),
            data.get('job_description', ''),
            data.get('status', 'active'),
            settings
        ))
        session_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    return session_id


def save_interview_qa(data):
    """Save an interview Q&A entry."""
    conn = get_db()
    cursor = conn.cursor()
    
    qa_id = data.get('id')
    evaluation = json.dumps(data.get('evaluation', {}))
    
    if qa_id:
        cursor.execute("""
            UPDATE interview_qa SET
                user_answer=?, evaluation=?, example_answer=?, retry_count=?
            WHERE id=?
        """, (
            data.get('user_answer', ''),
            evaluation,
            data.get('example_answer', ''),
            data.get('retry_count', 0),
            qa_id
        ))
    else:
        cursor.execute("""
            INSERT INTO interview_qa (session_id, question_number, question, user_answer, evaluation, example_answer)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data.get('session_id'),
            data.get('question_number', 1),
            data.get('question', ''),
            data.get('user_answer', ''),
            evaluation,
            data.get('example_answer', '')
        ))
        qa_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    return qa_id


def get_interview_session(session_id):
    """Get interview session with all Q&A."""
    conn = get_db()
    session = dict_from_row(conn.execute("SELECT * FROM interview_sessions WHERE id=?", (session_id,)).fetchone())
    if session:
        qas = conn.execute("SELECT * FROM interview_qa WHERE session_id=? ORDER BY question_number", (session_id,)).fetchall()
        session['questions'] = [dict_from_row(q) for q in qas]
    conn.close()
    return session


def list_interview_sessions():
    """List all interview sessions."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM interview_sessions ORDER BY updated_at DESC").fetchall()
    conn.close()
    return [dict_from_row(r) for r in rows]


def save_rejection_analysis(data):
    """Save a rejection analysis."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO rejection_analyses (job_title, company, application_details, feedback_received, analysis, improvement_plan)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data.get('job_title', ''),
        data.get('company', ''),
        data.get('application_details', ''),
        data.get('feedback_received', ''),
        json.dumps(data.get('analysis', {})),
        json.dumps(data.get('improvement_plan', {}))
    ))
    analysis_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return analysis_id


def get_rejection_analysis(analysis_id):
    """Get a rejection analysis by ID."""
    conn = get_db()
    row = conn.execute("SELECT * FROM rejection_analyses WHERE id=?", (analysis_id,)).fetchone()
    conn.close()
    return dict_from_row(row)


def list_rejection_analyses():
    """List all rejection analyses."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM rejection_analyses ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict_from_row(r) for r in rows]


def save_offer_review(data):
    """Save an offer review."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO offer_reviews (job_title, company, offer_details, user_priorities, analysis, negotiation_messages)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data.get('job_title', ''),
        data.get('company', ''),
        data.get('offer_details', ''),
        data.get('user_priorities', ''),
        json.dumps(data.get('analysis', {})),
        json.dumps(data.get('negotiation_messages', []))
    ))
    review_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return review_id


def get_offer_review(review_id):
    """Get an offer review by ID."""
    conn = get_db()
    row = conn.execute("SELECT * FROM offer_reviews WHERE id=?", (review_id,)).fetchone()
    conn.close()
    return dict_from_row(row)


def list_offer_reviews():
    """List all offer reviews."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM offer_reviews ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict_from_row(r) for r in rows]


def save_document(data):
    """Save document metadata."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO documents (filename, original_filename, file_type, file_size, extracted_text, purpose)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data.get('filename', ''),
        data.get('original_filename', ''),
        data.get('file_type', ''),
        data.get('file_size', 0),
        data.get('extracted_text', ''),
        data.get('purpose', '')
    ))
    doc_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return doc_id


def get_document(doc_id):
    """Get a document by ID."""
    conn = get_db()
    row = conn.execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()
    conn.close()
    return dict_from_row(row)


def delete_document(doc_id):
    """Delete a document."""
    conn = get_db()
    doc = conn.execute("SELECT filename FROM documents WHERE id=?", (doc_id,)).fetchone()
    if doc:
        filepath = Config.UPLOAD_FOLDER / doc['filename']
        if filepath.exists():
            filepath.unlink()
    conn.execute("DELETE FROM documents WHERE id=?", (doc_id,))
    conn.commit()
    conn.close()


def save_optimization_suggestions(session_id, cv_id, suggestions):
    """Save a batch of optimization suggestions and return the saved records with IDs."""
    conn = get_db()
    cursor = conn.cursor()
    saved = []
    for s in suggestions:
        orig = s.get('original', s.get('original_text', ''))
        sugg = s.get('suggested', s.get('suggested_text', ''))
        sec  = s.get('section', '')
        reas = s.get('reason', '')
        cursor.execute("""
            INSERT INTO optimization_suggestions (cv_id, session_id, original_text, suggested_text, section, reason)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (cv_id, session_id, orig, sugg, sec, reas))
        saved.append({
            'id': cursor.lastrowid,
            'cv_id': cv_id,
            'session_id': session_id,
            'section': sec,
            'original': orig,
            'suggested': sugg,
            'reason': reas,
            'status': 'pending',
            'user_edited_text': None
        })
    conn.commit()
    conn.close()
    return saved


def get_optimization_suggestions(session_id):
    """Get optimization suggestions for a session."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM optimization_suggestions WHERE session_id=? ORDER BY id", (session_id,)).fetchall()
    conn.close()
    return [dict_from_row(r) for r in rows]


def update_suggestion_status(suggestion_id, status, user_edited_text=None):
    """Update the status of an optimization suggestion."""
    conn = get_db()
    if user_edited_text is not None:
        conn.execute("UPDATE optimization_suggestions SET status=?, user_edited_text=? WHERE id=?",
                     (status, user_edited_text, suggestion_id))
    else:
        conn.execute("UPDATE optimization_suggestions SET status=? WHERE id=?", (status, suggestion_id))
    conn.commit()
    conn.close()


# ── Chat conversation helpers ────────────────────────────────────────────────

def create_conversation(conv_id: str = None, title: str = "New Conversation", language: str = "en"):
    """Create a new chat conversation record. Auto-generates conv_id if not provided."""
    import uuid
    if conv_id is None:
        conv_id = uuid.uuid4().hex
    conn = get_db()
    conn.execute(
        "INSERT OR IGNORE INTO chat_conversations (id, title, language) VALUES (?, ?, ?)",
        (conv_id, title, language)
    )
    conn.commit()
    conn.close()
    return conv_id


def update_conversation_title(conv_id: str, title: str):
    conn = get_db()
    conn.execute(
        "UPDATE chat_conversations SET title=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (title, conv_id)
    )
    conn.commit()
    conn.close()


def list_conversations():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM chat_conversations ORDER BY updated_at DESC LIMIT 50"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def delete_conversation(conv_id: str):
    conn = get_db()
    conn.execute("DELETE FROM chat_conversations WHERE id=?", (conv_id,))
    conn.commit()
    conn.close()


def append_message(conv_id: str, role: str, content: str,
                   tool_calls=None, tool_results=None):
    """Append a message to a conversation. Returns the new message ID."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO chat_messages
           (conversation_id, role, content, tool_calls, tool_results)
           VALUES (?, ?, ?, ?, ?)""",
        (
            conv_id, role, content,
            json.dumps(tool_calls or []),
            json.dumps(tool_results or [])
        )
    )
    msg_id = cursor.lastrowid
    conn.execute(
        "UPDATE chat_conversations SET updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (conv_id,)
    )
    conn.commit()
    conn.close()
    return msg_id


def get_conversation_messages(conv_id: str, limit: int = 40):
    """Return the last `limit` messages for a conversation."""
    conn = get_db()
    rows = conn.execute(
        """SELECT * FROM chat_messages
           WHERE conversation_id=?
           ORDER BY id ASC""",
        (conv_id,)
    ).fetchall()
    conn.close()
    messages = []
    for r in rows:
        d = dict(r)
        for f in ("tool_calls", "tool_results"):
            try:
                d[f] = json.loads(d[f])
            except Exception:
                d[f] = []
        messages.append(d)
    # Return last `limit` messages
    return messages[-limit:]
