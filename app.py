"""
AI Career Coach - Main Flask Application
"""
import os
import json
import uuid
from pathlib import Path
from datetime import datetime

from flask import Flask, request, jsonify, send_from_directory, send_file, Response, stream_with_context
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import Config
from database import (
    init_db, save_cv, save_cv_version, get_cv, list_cvs, delete_cv,
    save_evaluation, get_evaluation, list_evaluations,
    save_interview_session, save_interview_qa, get_interview_session, list_interview_sessions,
    save_rejection_analysis, get_rejection_analysis, list_rejection_analyses,
    save_offer_review, get_offer_review, list_offer_reviews,
    save_document, get_document, delete_document,
    save_optimization_suggestions, get_optimization_suggestions, update_suggestion_status,
    # Chat helpers
    create_conversation, list_conversations, delete_conversation,
    append_message, get_conversation_messages, update_conversation_title
)
from ai_service import (
    ai_generate_summary, ai_generate_description, ai_evaluate_cv,
    ai_optimize_cv, ai_match_job, ai_interview_question,
    ai_evaluate_answer, ai_interview_report, ai_analyze_rejection,
    ai_review_offer
)
from doc_utils import save_upload, extract_text, generate_cv_pdf, generate_cv_docx, allowed_file

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / 'static'

# Initialize Flask (single instance)
app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path='/static')
app.config['SECRET_KEY'] = Config.SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH
CORS(app)


def create_app(testing: bool = False):
    """Factory to configure and return the Flask app.
    Allows the test suite to obtain a fresh app instance with optional testing mode.
    """
    Config.ensure_dirs()
    init_db()
    if testing:
        app.config['TESTING'] = True
    return app


# Initialize database on startup
Config.ensure_dirs()
init_db()


# ===================== ERROR HANDLERS =====================

@app.errorhandler(413)
def handle_large_file(e):
    return jsonify({'error': 'Uploaded file exceeds the 16MB maximum size limit.'}), 413


@app.errorhandler(400)
def handle_bad_request(e):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Bad request'}), 400
    return e


@app.errorhandler(404)
def handle_not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Resource not found'}), 404
    return send_from_directory(str(STATIC_DIR), 'index.html')


# ===================== STATIC FILES & SPA =====================

@app.route('/')
def index():
    return send_from_directory(str(STATIC_DIR), 'index.html')


@app.route('/favicon.ico')
def favicon():
    return '', 204


# ===================== CHAT HELPERS =====================

def _build_agent_history(history_rows: list) -> list:
    """Build conversation history for the agent, preserving active tool context (e.g. interview session_id/qa_id)."""
    agent_history = []
    for row in history_rows:
        role    = row.get('role')
        content = row.get('content') or ''
        if role not in ('user', 'assistant'):
            continue
        if role == 'assistant':
            tool_results = row.get('tool_results') or []
            ctx_notes = []
            for tr in tool_results:
                t_name = tr.get('name')
                res    = tr.get('result') or {}
                if t_name == 'start_interview' and res.get('session_id'):
                    ctx_obj = {
                        'session_id': res.get('session_id'),
                        'qa_id': res.get('qa_id'),
                        'question': res.get('question', ''),
                        'question_number': res.get('question_number', 1)
                    }
                    ctx_notes.append(f"[Interview Session Context: {json.dumps(ctx_obj, ensure_ascii=False)}]")
                elif t_name == 'submit_interview_answer' and res.get('session_id'):
                    ctx_obj = {
                        'session_id': res.get('session_id'),
                        'qa_id': res.get('next_qa_id'),
                        'question': res.get('next_question', ''),
                        'question_number': res.get('next_question_num', 2)
                    }
                    ctx_notes.append(f"[Interview Session Context: {json.dumps(ctx_obj, ensure_ascii=False)}]")
                elif t_name == 'create_cv' and res.get('cv_id'):
                    ctx_notes.append(f"[Created CV ID: {res.get('cv_id')}]")
            if ctx_notes:
                content = (content + "\n" + "\n".join(ctx_notes)).strip()
        agent_history.append({'role': role, 'content': content})
    return agent_history


def _clean_auto_title(user_msg: str) -> str:
    """Generate a clean conversation title from the first user message."""
    txt = user_msg.strip()
    if '[Attached CV:' in txt:
        before, after = txt.split('[Attached CV:', 1)
        if before.strip():
            txt = before.strip()
        else:
            fname_end = after.find(']')
            fname = after[:fname_end].strip() if fname_end != -1 else 'Document'
            txt = f"CV: {fname}"
    txt = txt.replace('\n', ' ').strip()
    return (txt[:60] + '…') if len(txt) > 60 else (txt or 'New Conversation')


def _maybe_auto_title(conv_id: str, user_msg: str):
    """Set the conversation title only if it is still the default or first exchange."""
    convs = list_conversations()
    for c in convs:
        if c.get('id') == conv_id:
            if c.get('title') in ('New Conversation', '', None):
                update_conversation_title(conv_id, _clean_auto_title(user_msg))
            break


# ===================== API: CHAT AGENT =====================

@app.route('/api/chat', methods=['POST'])
def api_chat():
    """Main chat endpoint. Runs the agent loop and persists messages."""
    from chat_agent import run_agent

    data     = request.get_json(silent=True) or {}
    conv_id  = data.get('conversation_id') or uuid.uuid4().hex
    user_msg = (data.get('message') or '').strip()
    language = data.get('language', 'en')

    if not user_msg:
        return jsonify({'error': 'Empty message'}), 400

    # Ensure conversation exists
    create_conversation(conv_id, language=language)

    # Persist user message
    append_message(conv_id, 'user', user_msg)

    # Build history for agent (last 12 turns with tool context)
    history_rows  = get_conversation_messages(conv_id, limit=12)
    agent_history = _build_agent_history(history_rows)

    # Run the agent
    result = run_agent(agent_history)

    reply        = result.get('reply', '')
    tool_calls   = result.get('tool_calls', [])
    tool_results = result.get('tool_results', [])

    # Persist assistant reply
    append_message(conv_id, 'assistant', reply,
                   tool_calls=tool_calls, tool_results=tool_results)

    # Auto-title conversation from first user message
    _maybe_auto_title(conv_id, user_msg)

    # Fetch all messages for the conversation to include in the response
    all_messages = get_conversation_messages(conv_id, limit=100)

    return jsonify({
        'conversation_id': conv_id,
        'reply':           reply,
        'tool_calls':      tool_calls,
        'tool_results':    tool_results,
        'messages':        all_messages
    })


@app.route('/api/chat/stream', methods=['POST'])
def api_chat_stream():
    """Streaming chat endpoint. Returns newline-delimited JSON (NDJSON)."""
    from chat_agent import stream_agent

    data     = request.get_json(silent=True) or {}
    conv_id  = data.get('conversation_id') or uuid.uuid4().hex
    user_msg = (data.get('message') or '').strip()
    language = data.get('language', 'en')

    if not user_msg:
        return jsonify({'error': 'Empty message'}), 400

    # Persist conversation + user message
    create_conversation(conv_id, language=language)
    append_message(conv_id, 'user', user_msg)

    # Build history (last 12 turns with tool context)
    history_rows  = get_conversation_messages(conv_id, limit=12)
    agent_history = _build_agent_history(history_rows)

    full_reply  = []
    all_tools   = []
    all_results = []

    def generate():
        nonlocal full_reply, all_tools, all_results
        import json as _json

        # First event: send conversation ID so frontend can track this session
        yield _json.dumps({"type": "conv_id", "conversation_id": conv_id}) + "\n"

        for line in stream_agent(agent_history):
            try:
                event = _json.loads(line)
            except Exception:
                continue

            if event.get("type") == "token":
                full_reply.append(event.get("text", ""))
            elif event.get("type") == "done":
                all_tools   = event.get("tool_calls", [])
                all_results = event.get("tool_results", [])

            yield line  # forward raw NDJSON line to client

        # After stream: persist assistant reply to DB
        reply_text = "".join(full_reply)
        append_message(conv_id, 'assistant', reply_text,
                       tool_calls=all_tools, tool_results=all_results)

        # Auto-title conversation from first user message if still untitled
        _maybe_auto_title(conv_id, user_msg)

    return Response(
        stream_with_context(generate()),
        mimetype='application/x-ndjson',
        headers={'X-Accel-Buffering': 'no', 'Cache-Control': 'no-cache'}
    )


@app.route('/api/chat/conversations', methods=['GET'])
def api_list_conversations():
    return jsonify(list_conversations())


@app.route('/api/chat/conversations/<conv_id>', methods=['GET'])
def api_get_conversation(conv_id):
    msgs = get_conversation_messages(conv_id, limit=100)
    if not msgs and not any(c['id'] == conv_id for c in list_conversations()):
        return jsonify({'error': 'Conversation not found'}), 404
    return jsonify({'conversation_id': conv_id, 'messages': msgs})


# Short alias used by tests: /api/chat/<conv_id>
@app.route('/api/chat/<conv_id>', methods=['GET'])
def api_get_conversation_alias(conv_id):
    msgs = get_conversation_messages(conv_id, limit=100)
    convs = list_conversations()
    if not any(c['id'] == conv_id for c in convs):
        return jsonify({'error': 'Conversation not found'}), 404
    return jsonify({'conversation_id': conv_id, 'messages': msgs})


@app.route('/api/chat/conversations/<conv_id>', methods=['DELETE'])
def api_delete_conversation(conv_id):
    delete_conversation(conv_id)
    return jsonify({'message': 'Conversation deleted'})


# Short alias used by tests: DELETE /api/chat/<conv_id>
@app.route('/api/chat/<conv_id>', methods=['DELETE'])
def api_delete_conversation_alias(conv_id):
    delete_conversation(conv_id)
    return jsonify({'message': 'Conversation deleted'})


# ===================== API: SYSTEM =====================

@app.route('/api/status')
def api_status():
    from ai_service import _effective_model
    available = Config.ai_available()
    provider  = Config.AI_PROVIDER if available else None
    model     = _effective_model()  if available else None
    return jsonify({
        'status': 'ok',
        'ai_available': available,
        'ai_provider': provider,
        'ai_model': model
    })


# ===================== API: CV MANAGEMENT =====================

@app.route('/api/cvs', methods=['GET'])
def api_list_cvs():
    return jsonify(list_cvs())


@app.route('/api/cvs', methods=['POST'])
def api_create_cv():
    data = request.get_json(silent=True) or {}
    cv_id = save_cv(data)
    return jsonify({'id': cv_id, 'message': 'CV created successfully'})


@app.route('/api/cvs/<int:cv_id>', methods=['GET'])
def api_get_cv(cv_id):
    cv = get_cv(cv_id)
    if not cv:
        return jsonify({'error': 'CV not found'}), 404
    return jsonify(cv)


@app.route('/api/cvs/<int:cv_id>', methods=['PUT'])
def api_update_cv(cv_id):
    existing = get_cv(cv_id)
    if not existing:
        return jsonify({'error': 'CV not found'}), 404
    # Preserve a snapshot in cv_versions before updating
    save_cv_version(cv_id, 'snapshot', existing)
    data = request.get_json(silent=True) or {}
    data['id'] = cv_id
    save_cv(data)
    return jsonify({'id': cv_id, 'message': 'CV updated successfully'})


@app.route('/api/cvs/<int:cv_id>', methods=['DELETE'])
def api_delete_cv(cv_id):
    delete_cv(cv_id)
    return jsonify({'message': 'CV deleted successfully'})


@app.route('/api/cvs/<int:cv_id>/export/pdf', methods=['GET'])
def api_export_cv_pdf(cv_id):
    cv = get_cv(cv_id)
    if not cv:
        return jsonify({'error': 'CV not found'}), 404
    
    pdf_bytes = generate_cv_pdf(cv)
    if pdf_bytes is None:
        return jsonify({'error': 'PDF generation failed. Ensure reportlab is installed.'}), 500
    
    import io
    buffer = io.BytesIO(pdf_bytes)
    filename = f"{cv.get('title', 'cv').replace(' ', '_')}.pdf"
    return send_file(buffer, mimetype='application/pdf', as_attachment=True, download_name=filename)


@app.route('/api/cvs/<int:cv_id>/export/docx', methods=['GET'])
def api_export_cv_docx(cv_id):
    cv = get_cv(cv_id)
    if not cv:
        return jsonify({'error': 'CV not found'}), 404
    
    docx_bytes = generate_cv_docx(cv)
    if docx_bytes is None:
        return jsonify({'error': 'DOCX generation failed. Ensure python-docx is installed.'}), 500
    
    import io
    buffer = io.BytesIO(docx_bytes)
    filename = f"{cv.get('title', 'cv').replace(' ', '_')}.docx"
    return send_file(buffer, mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                     as_attachment=True, download_name=filename)


# ===================== API: AI GENERATION =====================

@app.route('/api/ai/generate-summary', methods=['POST'])
def api_generate_summary():
    data = request.get_json(silent=True) or {}
    if not any(v for k, v in data.items() if k != 'language' and v):
        return jsonify({'error': 'Provide background facts (role, skills, or experience) to generate a summary'}), 400
    result = ai_generate_summary(data)
    if result.get('success') and isinstance(result.get('data'), dict) and result['data'].get('summary'):
        result['summary'] = result['data']['summary']
    return jsonify(result)


@app.route('/api/ai/generate-description', methods=['POST'])
def api_generate_description():
    data = request.get_json(silent=True) or {}
    if not data.get('title') and not data.get('role') and not data.get('description') and not data.get('responsibilities'):
        return jsonify({'error': 'Provide job title or key responsibilities to generate bullet points'}), 400
    if not data.get('title') and data.get('role'):
        data['title'] = data['role']
    if not data.get('description') and data.get('responsibilities'):
        data['description'] = data['responsibilities']
    result = ai_generate_description(data)
    if result.get('success') and isinstance(result.get('data'), dict):
        bullets = result['data'].get('bullets') or result['data'].get('bullet_points') or []
        desc_text = result['data'].get('description') or ('\n'.join(f"• {b.lstrip('•-* ')}" for b in bullets) if bullets else '')
        if desc_text:
            result['description'] = desc_text
            result['data']['description'] = desc_text
    return jsonify(result)


# ===================== API: CV EVALUATION =====================

@app.route('/api/evaluate', methods=['POST'])
def api_evaluate_cv():
    data = request.get_json(silent=True) or {}
    cv_text = (data.get('cv_text') or '').strip()
    language = data.get('language', 'en')
    cv_id = data.get('cv_id')
    
    if not cv_text and cv_id:
        cv = get_cv(cv_id)
        if cv:
            cv_text = _cv_to_text(cv)
    
    if not cv_text:
        return jsonify({'error': 'No CV text provided'}), 400
    
    result = ai_evaluate_cv(cv_text, language)
    
    if result.get('success') and result.get('data'):
        eval_id = save_evaluation({
            'cv_id': cv_id,
            'evaluation_type': 'general',
            'input_text': cv_text[:5000],
            'results': result['data']
        })
        result['evaluation_id'] = eval_id
    
    return jsonify(result)


@app.route('/api/evaluations', methods=['GET'])
def api_list_evaluations():
    return jsonify(list_evaluations())


@app.route('/api/evaluations/<int:eval_id>', methods=['GET'])
def api_get_evaluation(eval_id):
    ev = get_evaluation(eval_id)
    if not ev:
        return jsonify({'error': 'Evaluation not found'}), 404
    return jsonify(ev)


# ===================== API: CV OPTIMIZATION =====================

@app.route('/api/optimize', methods=['POST'])
def api_optimize_cv():
    data = request.get_json(silent=True) or {}
    cv_text = (data.get('cv_text') or '').strip()
    language = data.get('language', 'en')
    target_role = (data.get('target_role') or '').strip()
    cv_id = data.get('cv_id')
    
    if not cv_text and cv_id:
        cv = get_cv(cv_id)
        if cv:
            cv_text = _cv_to_text(cv)
    
    if not cv_text:
        return jsonify({'error': 'No CV text provided'}), 400
    
    result = ai_optimize_cv(cv_text, language, target_role=target_role)
    
    if result.get('success') and result.get('data'):
        session_id = uuid.uuid4().hex
        suggestions = result['data'].get('suggestions', [])
        if suggestions:
            saved_sugs = save_optimization_suggestions(session_id, cv_id, suggestions)
            result['data']['suggestions'] = saved_sugs
        result['session_id'] = session_id
        result['original_cv_text'] = cv_text
    
    return jsonify(result)


@app.route('/api/optimize/suggestions/<session_id>', methods=['GET'])
def api_get_suggestions(session_id):
    suggestions = get_optimization_suggestions(session_id)
    return jsonify(suggestions)


@app.route('/api/optimize/suggestion/<int:suggestion_id>', methods=['PUT'])
def api_update_suggestion(suggestion_id):
    data = request.get_json(silent=True) or {}
    status = data.get('status', 'pending')
    user_text = data.get('user_edited_text') or data.get('suggested_text') or data.get('suggested')
    update_suggestion_status(suggestion_id, status, user_text)
    return jsonify({'message': 'Suggestion updated', 'id': suggestion_id, 'status': status})


@app.route('/api/optimize/apply', methods=['POST'])
def api_apply_optimizations():
    """Apply user-approved or user-edited suggestions to produce a revised CV while preserving the original."""
    data = request.get_json(silent=True) or {}
    original_text = data.get('original_cv_text', '')
    session_id = data.get('session_id')
    cv_id = data.get('cv_id')
    client_suggestions = data.get('suggestions') or []

    if not original_text and cv_id:
        orig_cv = get_cv(cv_id)
        if orig_cv:
            original_text = _cv_to_text(orig_cv)

    if not original_text:
        return jsonify({'error': 'Original CV text is required'}), 400

    db_suggestions = get_optimization_suggestions(session_id) if session_id else []
    suggestions_to_process = client_suggestions if client_suggestions else db_suggestions

    revised_text = original_text
    applied_count = 0

    for s in suggestions_to_process:
        status = s.get('status', 'pending')
        if status not in ('accepted', 'edited'):
            continue
        orig_part = s.get('original') or s.get('original_text') or ''
        replacement = (
            s.get('user_edited_text')
            if (status == 'edited' and s.get('user_edited_text'))
            else (s.get('user_edited_text') or s.get('suggested') or s.get('suggested_text') or '')
        )
        if orig_part and replacement:
            if orig_part in revised_text:
                revised_text = revised_text.replace(orig_part, replacement, 1)
            else:
                revised_text += f"\n\n[{s.get('section', 'Updated')}]: {replacement}"
            applied_count += 1

    new_cv_id = None
    if cv_id:
        orig_cv = get_cv(cv_id)
        if orig_cv:
            # Preserve original CV in cv_versions and create a new revised CV record
            save_cv_version(cv_id, 'original', orig_cv)
            revised_cv_data = dict(orig_cv)
            revised_cv_data.pop('id', None)
            revised_cv_data['title'] = f"{orig_cv.get('title', 'CV')} (Optimized)"
            # Also apply replacements inside summary & section descriptions
            summary_str = revised_cv_data.get('professional_summary', '') or ''
            sections_list = json.loads(json.dumps(revised_cv_data.get('sections', [])))
            for s in suggestions_to_process:
                if s.get('status') not in ('accepted', 'edited'):
                    continue
                orig_part = s.get('original') or s.get('original_text') or ''
                rep_part = s.get('user_edited_text') or s.get('suggested') or s.get('suggested_text') or ''
                if orig_part and rep_part:
                    if orig_part in summary_str:
                        summary_str = summary_str.replace(orig_part, rep_part, 1)
                    for sec in sections_list:
                        for idx, item in enumerate(sec.get('items', [])):
                            if isinstance(item, dict) and item.get('description') and orig_part in item['description']:
                                item['description'] = item['description'].replace(orig_part, rep_part, 1)
                            elif isinstance(item, str) and orig_part in item:
                                sec['items'][idx] = item.replace(orig_part, rep_part, 1)
            revised_cv_data['professional_summary'] = summary_str
            revised_cv_data['sections'] = sections_list
            new_cv_id = save_cv(revised_cv_data)
            save_cv_version(new_cv_id, 'optimized', revised_cv_data)

    return jsonify({
        'success': True,
        'applied_count': applied_count,
        'original_cv_text': original_text,
        'revised_cv_text': revised_text,
        'new_cv_id': new_cv_id
    })


# ===================== API: JOB MATCHING =====================

@app.route('/api/match', methods=['POST'])
def api_match_job():
    data = request.get_json(silent=True) or {}
    cv_text = (data.get('cv_text') or '').strip()
    job_description = (data.get('job_description') or '').strip()
    language = data.get('language', 'en')
    cv_id = data.get('cv_id')
    
    if not cv_text and cv_id:
        cv = get_cv(cv_id)
        if cv:
            cv_text = _cv_to_text(cv)
    
    if not cv_text:
        return jsonify({'error': 'No CV text provided'}), 400
    if not job_description:
        return jsonify({'error': 'No job description provided'}), 400
    
    result = ai_match_job(cv_text, job_description, language)
    
    if result.get('success') and result.get('data'):
        eval_id = save_evaluation({
            'cv_id': cv_id,
            'evaluation_type': 'job_match',
            'input_text': cv_text[:5000],
            'job_description': job_description[:5000],
            'results': result['data']
        })
        result['evaluation_id'] = eval_id
    
    return jsonify(result)


# ===================== API: MOCK INTERVIEWS =====================

@app.route('/api/interview/start', methods=['POST'])
def api_start_interview():
    data = request.get_json(silent=True) or {}
    session_id = save_interview_session({
        'target_role': data.get('target_role', ''),
        'industry': data.get('industry', ''),
        'interview_type': data.get('interview_type', 'behavioral'),
        'difficulty': data.get('difficulty', 'medium'),
        'language': data.get('language', 'en'),
        'cv_id': data.get('cv_id'),
        'job_description': data.get('job_description', ''),
        'status': 'active'
    })
    return jsonify({'session_id': session_id, 'message': 'Interview session started'})


@app.route('/api/interview/<int:session_id>/question', methods=['POST'])
def api_get_question(session_id):
    session = get_interview_session(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    previous_questions = [q.get('question', '') for q in session.get('questions', [])]
    question_number = len(previous_questions) + 1
    
    cv_text = ''
    if session.get('cv_id'):
        cv = get_cv(session['cv_id'])
        if cv:
            cv_text = _cv_to_text(cv)

    context = {
        'role': session.get('target_role', ''),
        'industry': session.get('industry', ''),
        'type': session.get('interview_type', 'behavioral'),
        'difficulty': session.get('difficulty', 'medium'),
        'language': session.get('language', 'en'),
        'job_description': session.get('job_description', ''),
        'cv_text': cv_text,
        'question_number': question_number,
        'previous_questions': previous_questions
    }
    
    result = ai_interview_question(context)
    
    if result.get('success') and result.get('data'):
        qa_id = save_interview_qa({
            'session_id': session_id,
            'question_number': question_number,
            'question': result['data'].get('question', ''),
        })
        result['qa_id'] = qa_id
        result['question_number'] = question_number
    
    return jsonify(result)


@app.route('/api/interview/<int:session_id>/answer', methods=['POST'])
def api_submit_answer(session_id):
    data = request.get_json(silent=True) or {}
    qa_id = data.get('qa_id')
    answer = (data.get('answer') or '').strip()
    question = data.get('question', '')
    is_retry = bool(data.get('retry', False))
    
    if not answer:
        return jsonify({'error': 'No answer provided'}), 400

    session = get_interview_session(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    retry_count = 0
    if qa_id and session.get('questions'):
        for q_row in session['questions']:
            if q_row.get('id') == qa_id:
                retry_count = (q_row.get('retry_count') or 0) + (1 if is_retry or q_row.get('user_answer') else 0)
                if not question:
                    question = q_row.get('question', '')
                break

    context = {
        'role': session.get('target_role', ''),
        'type': session.get('interview_type', 'behavioral'),
        'language': session.get('language', 'en')
    }
    
    result = ai_evaluate_answer(question, answer, context)
    
    if result.get('success') and result.get('data') and qa_id:
        save_interview_qa({
            'id': qa_id,
            'user_answer': answer,
            'evaluation': result['data'],
            'example_answer': result['data'].get('example_answer', ''),
            'retry_count': retry_count
        })
        result['retry_count'] = retry_count
    
    return jsonify(result)


@app.route('/api/interview/<int:session_id>/report', methods=['GET'])
def api_interview_report(session_id):
    session = get_interview_session(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Update status
    save_interview_session({**session, 'id': session_id, 'status': 'completed'})
    lang = request.args.get('language') or session.get('language', 'en')
    result = ai_interview_report(session, language=lang)
    return jsonify(result)


@app.route('/api/interview/<int:session_id>', methods=['GET'])
def api_get_interview(session_id):
    session = get_interview_session(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    return jsonify(session)


@app.route('/api/interviews', methods=['GET'])
def api_list_interviews():
    return jsonify(list_interview_sessions())


# ===================== API: REJECTION ANALYSIS =====================

@app.route('/api/rejection/analyze', methods=['POST'])
def api_analyze_rejection():
    data = request.get_json(silent=True) or {}
    
    details = {
        'job_title': (data.get('job_title') or '').strip(),
        'company': (data.get('company') or '').strip(),
        'application_details': (data.get('application_details') or '').strip(),
        'feedback_received': (data.get('feedback_received') or '').strip(),
    }
    if not details['job_title'] and not details['application_details'] and not details['feedback_received']:
        return jsonify({'error': 'Job title or rejection details required'}), 400
    
    language = data.get('language', 'en')
    result = ai_analyze_rejection(details, language=language)
    
    if result.get('success') and result.get('data'):
        analysis_id = save_rejection_analysis({
            **details,
            'analysis': result['data'].get('analysis', {}),
            'improvement_plan': result['data'].get('improvement_plan', {})
        })
        result['analysis_id'] = analysis_id
    
    return jsonify(result)


@app.route('/api/rejections', methods=['GET'])
def api_list_rejections():
    return jsonify(list_rejection_analyses())


@app.route('/api/rejections/<int:analysis_id>', methods=['GET'])
def api_get_rejection(analysis_id):
    analysis = get_rejection_analysis(analysis_id)
    if not analysis:
        return jsonify({'error': 'Analysis not found'}), 404
    return jsonify(analysis)


# ===================== API: OFFER REVIEW =====================

@app.route('/api/offer/review', methods=['POST'])
def api_review_offer():
    data = request.get_json(silent=True) or {}
    
    offer_details = (data.get('offer_details') or '').strip()
    priorities = (data.get('user_priorities') or '').strip()
    language = data.get('language', 'en')
    
    if not offer_details:
        return jsonify({'error': 'No offer details provided'}), 400
    
    result = ai_review_offer(offer_details, priorities, language=language)
    
    if result.get('success') and result.get('data'):
        review_id = save_offer_review({
            'job_title': data.get('job_title', ''),
            'company': data.get('company', ''),
            'offer_details': offer_details,
            'user_priorities': priorities,
            'analysis': result['data']
        })
        result['review_id'] = review_id
    
    return jsonify(result)


@app.route('/api/offers', methods=['GET'])
def api_list_offers():
    return jsonify(list_offer_reviews())


@app.route('/api/offers/<int:review_id>', methods=['GET'])
def api_get_offer(review_id):
    review = get_offer_review(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    return jsonify(review)


# ===================== API: DOCUMENT UPLOAD =====================

@app.route('/api/upload', methods=['POST'])
def api_upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    purpose = request.form.get('purpose', 'general')
    
    result = save_upload(file, purpose)
    if not result:
        return jsonify({'error': 'Invalid file type. Allowed: PDF, DOCX, TXT'}), 400
    
    doc_id = save_document(result)
    result['id'] = doc_id
    
    return jsonify(result)


@app.route('/api/documents/<int:doc_id>', methods=['GET'])
def api_get_document(doc_id):
    doc = get_document(doc_id)
    if not doc:
        return jsonify({'error': 'Document not found'}), 404
    return jsonify(doc)


@app.route('/api/documents/<int:doc_id>', methods=['DELETE'])
def api_delete_document(doc_id):
    delete_document(doc_id)
    return jsonify({'message': 'Document deleted'})


@app.route('/api/extract-text', methods=['POST'])
def api_extract_text():
    """Extract text from uploaded file or pasted content."""
    if 'file' in request.files:
        file = request.files['file']
        result = save_upload(file, 'text_extraction')
        if result:
            doc_id = save_document(result)
            return jsonify({
                'text': result['extracted_text'],
                'document_id': doc_id,
                'filename': result['original_filename']
            })
        return jsonify({'error': 'Invalid file'}), 400
    
    data = request.get_json(silent=True) or {}
    return jsonify({'text': data.get('text', '')})


# ===================== HELPERS =====================

def _cv_to_text(cv):
    """Convert CV data to plain text for AI processing."""
    parts = []
    
    contact = cv.get('contact_info', {})
    if isinstance(contact, str):
        try:
            contact = json.loads(contact)
        except Exception:
            contact = {}
    
    if contact.get('name'):
        parts.append(contact['name'])
    
    contact_fields = []
    for f in ['email', 'phone', 'location', 'linkedin']:
        if contact.get(f):
            contact_fields.append(contact[f])
    if contact_fields:
        parts.append(' | '.join(contact_fields))
    
    summary = cv.get('professional_summary', '')
    if summary:
        parts.append(f"\nProfessional Summary:\n{summary}")
    
    sections = cv.get('sections', [])
    if isinstance(sections, str):
        try:
            sections = json.loads(sections)
        except Exception:
            sections = []
    
    for section in sections:
        title = section.get('title', '')
        if title:
            parts.append(f"\n{title}:")
        
        items = section.get('items', [])
        for item in items:
            if isinstance(item, dict):
                header = item.get('title', item.get('degree', item.get('name', '')))
                sub = item.get('company', item.get('institution', item.get('issuer', '')))
                date = item.get('date', item.get('dates', ''))
                tech = item.get('technologies', '')
                link = item.get('link', '')
                if header:
                    line = header
                    if sub:
                        line += f" - {sub}"
                    if date:
                        line += f" ({date})"
                    if tech:
                        line += f" [{tech}]"
                    if link:
                        line += f" ({link})"
                    parts.append(line)
                desc = item.get('description', '')
                if desc:
                    parts.append(desc)
                for b in item.get('bullets', []):
                    parts.append(f"  • {b}")
            elif isinstance(item, str):
                parts.append(f"  • {item}")
    
    return '\n'.join(parts)


# ===================== MAIN =====================

if __name__ == '__main__':
    import sys
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    ai_status = "[Connected]" if Config.ai_available() else "[Optional - Not Configured]"
    print(f"\n{'='*60}")
    print(f"  AI Career Coach")
    print(f"  Local URL: http://localhost:{Config.PORT}")
    print(f"  AI Status: {ai_status}")
    print(f"{'='*60}\n")
    
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=Config.DEBUG
    )
