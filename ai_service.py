"""
AI Career Coach - AI Service Module
Handles all AI provider communication via Google Gemini (OpenAI-compatible endpoint).
"""
import json
from config import Config

# ---------------------------------------------------------------------------
# Gemini / AI client factory
# All secrets are loaded from .env.local via Config – no hardcoded keys.
# ---------------------------------------------------------------------------

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
GEMINI_MODEL = "gemini-3.5-flash-lite"


def get_ai_client():
    """Return an OpenAI-compatible client pointing at Google Gemini.

    Uses Config values populated from .env.local.  Returns None when no
    API key is configured.
    """
    if not Config.ai_available():
        print("[AI] No API key configured. Set AI_API_KEY in .env.local.")
        return None

    try:
        from openai import OpenAI

        api_key  = Config.AI_API_KEY
        base_url = Config.AI_API_BASE if Config.AI_API_BASE else GEMINI_BASE_URL

        return OpenAI(api_key=api_key, base_url=base_url)
    except Exception as e:
        print(f"[AI] Failed to initialize client: {e}")
        return None


def _effective_model():
    """Return the model name to use, defaulting to Gemini Flash."""
    if Config.AI_MODEL and Config.AI_MODEL not in ("gpt-4o-mini", ""):
        return Config.AI_MODEL
    return GEMINI_MODEL


def ai_chat(messages, temperature=0.7, max_tokens=1500):
    """Send a chat completion request and return a result dict.

    Returns: {'success': bool, 'content': str} or {'success': False, 'error': str}
    """
    client = get_ai_client()
    if not client:
        return {
            'success': False,
            'error': 'AI client could not be initialised. Check your internet connection.',
            'requires_ai': True
        }
    
    import time
    last_err = None
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model=_effective_model(),
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=60
            )
            return {
                'success': True,
                'content': response.choices[0].message.content
            }
        except Exception as e:
            last_err = e
            if '429' in str(e) and attempt < 2:
                time.sleep(4 * (attempt + 1))
                continue
            break
    return {
        'success': False,
        'error': f'AI request failed: {str(last_err)}'
    }


def ai_json_chat(messages, temperature=0.5, max_tokens=2000):
    """Send a chat request expecting JSON response.
    
    Returns parsed JSON or error dict.
    """
    # Add instruction for JSON output
    if messages and messages[-1]['role'] == 'user':
        messages[-1]['content'] += '\n\nRespond with valid JSON only. No markdown formatting or code blocks.'
    
    result = ai_chat(messages, temperature, max_tokens)
    if not result['success']:
        return result
    
    try:
        content = result['content'].strip()
        # Strip markdown code blocks if present
        if content.startswith('```'):
            lines = content.split('\n')
            content = '\n'.join(lines[1:-1] if lines[-1].strip() == '```' else lines[1:])
        parsed = json.loads(content)
        return {'success': True, 'data': parsed}
    except json.JSONDecodeError:
        return {'success': True, 'content': result['content'], 'data': None}


# ---- Service-specific AI functions ----

def _has_arabic(text):
    """Return True if text contains Arabic characters."""
    if not text:
        return False
    return any('\u0600' <= ch <= '\u06FF' for ch in str(text))


def _resolve_lang(language, sample_text=''):
    """Determine 'ar' or 'en' from explicit language or text content."""
    if language == 'ar' or _has_arabic(sample_text):
        return 'ar'
    return 'en'


def ai_generate_summary(facts):
    """Generate a professional summary from user facts."""
    lang = _resolve_lang(facts.get('language'), json.dumps(facts, ensure_ascii=False))
    lang_instruction = "Respond in Arabic." if lang == 'ar' else "Respond in English."
    messages = [
        {"role": "system", "content": f"""You are a professional CV writer. {lang_instruction} Generate a concise, compelling professional summary 
based on the provided facts. Do NOT invent or embellish qualifications. Only use information provided. 
Return JSON: {{"summary": "the generated summary"}}"""},
        {"role": "user", "content": f"Generate a professional summary from these facts:\n{json.dumps(facts, ensure_ascii=False)}"}
    ]
    return ai_json_chat(messages)


def ai_generate_description(role_info):
    """Generate a professional experience description."""
    lang = _resolve_lang(role_info.get('language'), json.dumps(role_info, ensure_ascii=False))
    lang_instruction = "Respond in Arabic." if lang == 'ar' else "Respond in English."
    messages = [
        {"role": "system", "content": f"""You are a professional CV writer. {lang_instruction} Generate strong, action-verb-driven bullet points 
for work experience. Do NOT invent achievements or metrics not provided. Use only the information given.
Return JSON: {{"bullets": ["bullet1", "bullet2", ...]}}"""},
        {"role": "user", "content": f"Generate professional bullet points for this role:\n{json.dumps(role_info, ensure_ascii=False)}"}
    ]
    return ai_json_chat(messages)


def ai_evaluate_cv(cv_text, language='en'):
    """Evaluate a CV comprehensively."""
    lang_instruction = "Respond in Arabic." if language == 'ar' else "Respond in English."
    messages = [
        {"role": "system", "content": f"""You are a senior career coach evaluating a CV. {lang_instruction}
Provide an honest, constructive evaluation. Do NOT present scores as predictions of hiring success.

Return JSON with this structure:
{{
    "overall_assessment": "A paragraph summarizing the CV quality",
    "scores": {{
        "professional_summary": {{"score": 1-10, "explanation": "..."}},
        "education": {{"score": 1-10, "explanation": "..."}},
        "experience": {{"score": 1-10, "explanation": "..."}},
        "skills": {{"score": 1-10, "explanation": "..."}},
        "projects_achievements": {{"score": 1-10, "explanation": "..."}},
        "organization_readability": {{"score": 1-10, "explanation": "..."}},
        "ats_compatibility": {{"score": 1-10, "explanation": "..."}}
    }},
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "improvements": [
        {{"priority": 1, "area": "...", "suggestion": "...", "reasoning": "..."}}
    ],
    "missing_sections": ["section1"],
    "disclaimer": "These scores reflect general CV quality indicators and should not be interpreted as predictions of hiring outcomes."
}}"""},
        {"role": "user", "content": f"Evaluate this CV:\n\n{cv_text}"}
    ]
    return ai_json_chat(messages, max_tokens=2500)


def ai_optimize_cv(cv_text, language='en', target_role=''):
    """Generate optimization suggestions for a CV."""
    lang_instruction = "Respond in Arabic." if language == 'ar' else "Respond in English."
    role_note = f"Target role: {target_role}." if target_role else ""
    messages = [
        {"role": "system", "content": f"""You are a senior CV optimization specialist. {lang_instruction} {role_note}
Analyze the CV wording, structure, readability, repetition, action verbs, and ATS presentation. Suggest improvements.
Do NOT fabricate experience, qualifications, or skills.
Only suggest rewording, restructuring, and strengthening existing content.

Return JSON:
{{
    "suggestions": [
        {{
            "section": "which section this applies to",
            "original": "the original text",
            "suggested": "your improved version",
            "reason": "why this change improves the CV"
        }}
    ],
    "general_notes": "overall observations about the CV"
}}"""},
        {"role": "user", "content": f"Analyze and suggest optimizations for this CV:\n\n{cv_text}"}
    ]
    return ai_json_chat(messages, max_tokens=2500)


def ai_match_job(cv_text, job_description, language='en'):
    """Match a CV against a job description."""
    lang_instruction = "Respond in Arabic." if language == 'ar' else "Respond in English."
    messages = [
        {"role": "system", "content": f"""You are a career matching specialist. {lang_instruction}
Compare the CV against the job description. Be accurate and honest.
Distinguish between confirmed gaps (user clearly lacks something) and 
missing information (not mentioned in CV but user might have it).
Never suggest inventing qualifications.

Return JSON:
{{
    "job_requirements": {{
        "required": ["req1", "req2"],
        "preferred": ["pref1", "pref2"]
    }},
    "matching_qualifications": [
        {{"requirement": "...", "cv_evidence": "...", "strength": "strong|moderate|weak"}}
    ],
    "gaps": [
        {{"requirement": "...", "type": "confirmed_gap|missing_info", "suggestion": "..."}}
    ],
    "transferable_skills": ["skill1"],
    "keywords": {{
        "present": ["keyword1"],
        "missing_important": ["keyword2"],
        "missing_optional": ["keyword3"]
    }},
    "screening_concerns": ["concern1"],
    "cv_improvements": [
        {{"area": "...", "suggestion": "...", "priority": "high|medium|low"}}
    ],
    "overall_match": "A paragraph summarizing the match quality",
    "disclaimer": "This analysis compares documented qualifications and does not replicate any proprietary ATS scoring system."
}}"""},
        {"role": "user", "content": f"CV:\n{cv_text}\n\nJob Description:\n{job_description}"}
    ]
    return ai_json_chat(messages, max_tokens=2500)


def ai_interview_question(context):
    """Generate an interview question."""
    extra_ctx = ""
    if context.get('job_description'):
        extra_ctx += f"\nJob Description context: {str(context['job_description'])[:1500]}"
    if context.get('cv_text'):
        extra_ctx += f"\nCandidate CV context: {str(context['cv_text'])[:1500]}"
    messages = [
        {"role": "system", "content": f"""You are a professional interviewer conducting a {context.get('type', 'behavioral')} interview
for a {context.get('role', 'professional')} position in the {context.get('industry', 'general')} industry.
Difficulty: {context.get('difficulty', 'medium')}.
Language: {'Arabic' if context.get('language') == 'ar' else 'English'}.

Generate one interview question appropriate to the context.
{'For behavioral questions, design questions that can be answered using the STAR framework.' if context.get('type') == 'behavioral' else ''}

Return JSON:
{{
    "question": "the interview question",
    "type": "behavioral|technical|hr|situational",
    "tip": "a brief tip for answering this type of question",
    "star_applicable": true/false
}}"""},
        {"role": "user", "content": f"Context: Question #{context.get('question_number', 1)}. Previous questions: {json.dumps(context.get('previous_questions', []), ensure_ascii=False)}{extra_ctx}"}
    ]
    return ai_json_chat(messages)


def ai_evaluate_answer(question, answer, context):
    """Evaluate an interview answer."""
    lang = 'Arabic' if _resolve_lang(context.get('language'), f"{question} {answer}") == 'ar' else 'English'
    messages = [
        {"role": "system", "content": f"""You are a professional interview coach evaluating an answer.
Interview type: {context.get('type', 'behavioral')}. Role: {context.get('role', '')}.
Language: {lang}. Respond in {lang}.

Evaluate honestly and constructively. For behavioral questions, check STAR framework usage.
For technical questions, evaluate accuracy and reasoning.

Return JSON:
{{
    "overall_rating": "excellent|good|fair|needs_improvement",
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "recommendations": ["recommendation1", "recommendation2"],
    "example_answer": "a stronger example answer for reference",
    "star_analysis": {{
        "situation": {{"present": true/false, "feedback": "..."}},
        "task": {{"present": true/false, "feedback": "..."}},
        "action": {{"present": true/false, "feedback": "..."}},
        "result": {{"present": true/false, "feedback": "..."}}
    }}
}}"""},
        {"role": "user", "content": f"Question: {question}\n\nAnswer: {answer}"}
    ]
    return ai_json_chat(messages, max_tokens=2000)


def ai_interview_report(session_data, language=None):
    """Generate an interview performance report."""
    lang_code = _resolve_lang(language or session_data.get('language'), json.dumps(session_data, ensure_ascii=False))
    lang_instruction = "Respond in Arabic." if lang_code == 'ar' else "Respond in English."
    messages = [
        {"role": "system", "content": f"""You are a professional interview coach providing a final performance report. {lang_instruction}
Summarize the candidate's performance, identify patterns, and provide a practice plan.

Return JSON:
{{
    "overall_performance": "summary paragraph",
    "rating": "excellent|good|fair|needs_improvement",
    "key_strengths": ["strength1", "strength2"],
    "areas_for_improvement": ["area1", "area2"],
    "patterns_observed": ["pattern1"],
    "practice_plan": [
        {{"area": "...", "action": "...", "timeframe": "..."}}
    ],
    "encouragement": "a motivating closing message"
}}"""},
        {"role": "user", "content": f"Interview session data:\n{json.dumps(session_data, ensure_ascii=False)}"}
    ]
    return ai_json_chat(messages, max_tokens=2000)


def ai_analyze_rejection(details, language='en'):
    """Analyze a job rejection."""
    lang_code = _resolve_lang(language, json.dumps(details, ensure_ascii=False))
    lang_instruction = "Respond in Arabic." if lang_code == 'ar' else "Respond in English."
    messages = [
        {"role": "system", "content": f"""You are a compassionate and analytical career coach helping someone understand a job rejection. {lang_instruction}
Be honest but supportive. Clearly distinguish facts from hypotheses.
Never claim to know the employer's actual reason without evidence.

Return JSON:
{{
    "analysis": {{
        "likely_factors": [
            {{"factor": "...", "evidence_type": "fact|hypothesis", "explanation": "..."}}
        ],
        "cv_related": ["issue1"],
        "qualification_related": ["issue1"],
        "application_related": ["issue1"],
        "interview_related": ["issue1"]
    }},
    "improvement_plan": {{
        "immediate_actions": [
            {{"action": "...", "area": "...", "priority": "high|medium|low"}}
        ],
        "short_term": [
            {{"action": "...", "timeframe": "...", "expected_impact": "..."}}
        ],
        "long_term": [
            {{"action": "...", "timeframe": "...", "expected_impact": "..."}}
        ]
    }},
    "encouragement": "supportive message",
    "disclaimer": "This analysis is based on the information provided and represents possible factors rather than confirmed reasons."
}}"""},
        {"role": "user", "content": f"Rejection details:\n{json.dumps(details, ensure_ascii=False)}"}
    ]
    return ai_json_chat(messages, max_tokens=2000)


def ai_review_offer(offer_details, priorities, language='en'):
    """Review a job offer."""
    lang_code = _resolve_lang(language, f"{offer_details} {priorities}")
    lang_instruction = "Respond in Arabic." if lang_code == 'ar' else "Respond in English."
    messages = [
        {"role": "system", "content": f"""You are a career advisor reviewing a job offer. {lang_instruction}
Summarize the offer, identify concerns, suggest questions, and recommend negotiation strategies.
Never accept, reject, or negotiate on the user's behalf.
Distinguish general guidance from legal advice.

Return JSON:
{{
    "summary": {{
        "salary": "...",
        "benefits": ["benefit1"],
        "responsibilities": ["resp1"],
        "working_arrangements": "...",
        "other_terms": ["term1"]
    }},
    "analysis": {{
        "positive_aspects": ["aspect1"],
        "concerns": [
            {{"term": "...", "concern": "...", "severity": "high|medium|low"}}
        ],
        "unclear_terms": ["term1"],
        "questions_to_ask": ["question1"]
    }},
    "negotiation": {{
        "strategies": [
            {{"area": "...", "approach": "...", "rationale": "..."}}
        ],
        "talking_points": ["point1"],
        "sample_message": "a professional negotiation email draft"
    }},
    "disclaimer": "This is general career guidance, not legal advice. Consider consulting an employment lawyer for contract review."
}}"""},
        {"role": "user", "content": f"Offer details:\n{offer_details}\n\nMy priorities:\n{priorities}"}
    ]
    return ai_json_chat(messages, max_tokens=2500)
