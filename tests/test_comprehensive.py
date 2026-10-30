import io
import json
import os
import tempfile
import unittest
from unittest.mock import patch, MagicMock

import pytest

# Ensure the app can be imported with the correct path
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from config import Config
from database import (
    create_conversation,
    get_conversation_messages,
    delete_conversation,
    list_conversations,
    update_conversation_title,
    append_message,
)
from doc_utils import allowed_file, generate_cv_pdf, generate_cv_docx
from ai_service import get_ai_client

# Helper to get a test client
@pytest.fixture
def client():
    app = create_app(testing=True)
    with app.test_client() as client:
        yield client

# Mock Gemini/OpenAI client used inside ai_service
class MockCompletion:
    def __init__(self, content="Mock response", function_call=None):
        self.choices = [MagicMock(message=MagicMock(content=content, function_call=function_call))]

def mock_get_ai_client(*args, **kwargs):
    mock_client = MagicMock()
    mock_client.chat.completions.create = MagicMock(return_value=MockCompletion())
    return mock_client

# ---------- API Endpoint Tests ----------
class TestChatAPI:
    def test_create_and_get_conversation(self, client):
        # Create conversation
        resp = client.post('/api/chat', json={"message": "Hello"})
        assert resp.status_code == 200
        data = resp.get_json()
        conv_id = data["conversation_id"]
        # Retrieve messages
        resp2 = client.get(f'/api/chat/{conv_id}')
        assert resp2.status_code == 200
        msgs = resp2.get_json()["messages"]
        assert any(m["content"] == "Hello" for m in msgs)
        # Clean up
        client.delete(f'/api/chat/{conv_id}')

    def test_invalid_message(self, client):
        resp = client.post('/api/chat', json={"message": ""})
        assert resp.status_code == 400

    def test_missing_conversation(self, client):
        resp = client.get('/api/chat/nonexistent')
        assert resp.status_code == 404

# ---------- AI Agent Interaction ----------
@patch('ai_service.get_ai_client', side_effect=mock_get_ai_client)
def test_run_agent_plain_text(mock_client, client):
    # Simulate a user message that results in a plain text response (no function call)
    mock_client.return_value.chat.completions.create.return_value = MockCompletion(content="Hello back!")
    resp = client.post('/api/chat', json={"message": "Hi"})
    assert resp.status_code == 200
    data = resp.get_json()
    # The API now returns a 'reply' field and a 'messages' list
    assert "reply" in data or "messages" in data

@patch('ai_service.get_ai_client', side_effect=mock_get_ai_client)
def test_run_agent_function_call(mock_client, client):
    # Simulate a Gemini response that includes a function call to create_cv
    function_call = {
        "name": "create_cv",
        "arguments": json.dumps({"education": "BSc", "skills": ["Python"], "experience": "2 years"})
    }
    mock_client.return_value.chat.completions.create.return_value = MockCompletion(function_call=function_call)
    resp = client.post('/api/chat', json={"message": "Help me create a CV"})
    assert resp.status_code == 200
    data = resp.get_json()
    # The response should include messages list and conversation_id
    assert "conversation_id" in data
    assert "messages" in data

# ---------- Tool Execution Edge Cases ----------
def test_execute_unknown_tool(client):
    # The project does not expose a raw tool endpoint, so we simulate via chat with unknown intent
    resp = client.post('/api/chat', json={"message": "Do something unknown"})
    assert resp.status_code == 200
    data = resp.get_json()
    # Expect either a reply or messages list in the response
    assert "reply" in data or "messages" in data

# ---------- Database Conversation Functions ----------
class TestDatabaseFunctions:
    def test_conversation_lifecycle(self):
        # create_conversation now auto-generates an id when called with keyword args only
        conv_id = create_conversation(title="Test")
        assert isinstance(conv_id, str) and len(conv_id) > 0
        append_message(conv_id, "user", "Hello")
        msgs = get_conversation_messages(conv_id)
        assert len(msgs) == 1
        assert msgs[0]["role"] == "user"
        update_conversation_title(conv_id, "Renamed")
        convs = list_conversations()
        assert any(c["id"] == conv_id and c["title"] == "Renamed" for c in convs)
        delete_conversation(conv_id)
        assert not any(c["id"] == conv_id for c in list_conversations())

# ---------- Document Utilities ----------
class TestDocUtils:
    def test_allowed_file(self):
        assert allowed_file("resume.pdf")
        assert not allowed_file("resume.exe")

    def test_generate_pdf_and_docx(self):
        sample_data = {"name": "John Doe", "education": "BSc CS", "skills": ["Python", "SQL"]}
        pdf_bytes = generate_cv_pdf(sample_data)
        docx_bytes = generate_cv_docx(sample_data)
        assert isinstance(pdf_bytes, bytes) and len(pdf_bytes) > 0
        assert isinstance(docx_bytes, bytes) and len(docx_bytes) > 0

# ---------- Export Routes ----------
def test_export_routes(client):
    # Create a CV directly via the /api/cvs endpoint
    cv_data = {
        "title": "Test CV",
        "name": "John Doe",
        "education": "BSc CS",
        "skills": ["Python", "SQL"]
    }
    create_resp = client.post('/api/cvs', json=cv_data)
    assert create_resp.status_code == 200
    cv_id = create_resp.get_json()["id"]

    # List CVs to confirm it was created
    resp = client.get('/api/cvs')
    assert resp.status_code == 200
    cvs = resp.get_json()
    assert len(cvs) > 0

    pdf_resp = client.get(f'/api/cvs/{cv_id}/export/pdf')
    docx_resp = client.get(f'/api/cvs/{cv_id}/export/docx')
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["Content-Type"] == "application/pdf"
    assert len(pdf_resp.data) > 0
    assert docx_resp.status_code == 200
    assert docx_resp.headers["Content-Type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    assert len(docx_resp.data) > 0

# ---------- Security Checks ----------
def test_status_endpoint_leaks_no_key(client):
    resp = client.get('/api/status')
    assert resp.status_code == 200
    data = resp.get_json()
    # The response should contain a boolean ai_available but never the actual key
    assert "ai_available" in data
    assert data["ai_available"] in [True, False]
    # Ensure the key is not present anywhere in the response body
    assert "AI_API_KEY" not in json.dumps(data)


# ---------- Regression Tests for Discovered Defects ----------
class TestRegressionFixes:
    def test_pdf_and_docx_xml_special_chars_and_arabic(self):
        """Regression: ReportLab Paragraph crashed on unescaped '&', '<', '>' or Arabic text."""
        cv_data = {
            "title": "Arabic & Special Chars CV",
            "language": "ar",
            "template": "modern",
            "contact_info": {
                "name": "أحمد محمد & شركاه <R&D>",
                "email": "ahmed@example.com",
                "phone": "+201000000000",
                "location": "القاهرة، مصر",
            },
            "professional_summary": "مهندس برمجيات خبير في Python & FastAPI مع خبرة > 5 سنوات.",
            "sections": [
                {
                    "title": "الخبرات العملية",
                    "items": [
                        {
                            "title": "Senior Engineer <Backend & AI>",
                            "company": "شركة التقنية & الابتكار",
                            "date": "2021 - 2025",
                            "description": "• تطوير أنظمة الذكاء الاصطناعي & تحسين الأداء\n• تقليل زمن الاستجابة إلى < 100ms",
                        }
                    ],
                },
                {
                    "title": "المشاريع",
                    "items": [
                        {
                            "name": "منصة التوظيف الذكية",
                            "technologies": "Python, Flask & SQLite",
                            "description": "بناء منصة متكاملة لتحليل السير الذاتية.",
                        }
                    ],
                },
            ],
        }
        pdf_bytes = generate_cv_pdf(cv_data)
        docx_bytes = generate_cv_docx(cv_data)
        assert pdf_bytes[:4] == b"%PDF"
        assert len(pdf_bytes) > 1000
        assert len(docx_bytes) > 1000

    @patch("app.ai_optimize_cv")
    def test_optimize_persists_suggestions_and_apply_preserves_original(self, mock_opt, client):
        """Regression: /api/optimize must save suggestions with DB IDs and /api/optimize/apply must preserve original CV."""
        mock_opt.return_value = {
            "success": True,
            "data": {
                "suggestions": [
                    {
                        "section": "Experience",
                        "original": "Worked on backend APIs.",
                        "suggested": "Engineered scalable RESTful backend APIs.",
                        "reason": "Stronger action verb",
                    }
                ],
                "general_notes": "Good foundation.",
            },
        }
        # Create original CV
        create_res = client.post(
            "/api/cvs",
            json={
                "title": "Original CV",
                "contact_info": {"name": "Sara Ali", "email": "sara@example.com"},
                "professional_summary": "Worked on backend APIs.",
                "sections": [],
            },
        )
        orig_cv_id = create_res.get_json()["id"]

        # Call /api/optimize
        opt_res = client.post(
            "/api/optimize",
            json={"cv_id": orig_cv_id, "cv_text": "Sara Ali\nWorked on backend APIs.", "language": "en"},
        )
        assert opt_res.status_code == 200
        opt_data = opt_res.get_json()
        assert "session_id" in opt_data
        suggestions = opt_data["data"]["suggestions"]
        assert len(suggestions) == 1
        sug_id = suggestions[0]["id"]
        assert sug_id is not None

        # Accept & edit suggestion
        upd_res = client.put(
            f"/api/optimize/suggestion/{sug_id}",
            json={"status": "edited", "suggested_text": "Architected and maintained RESTful backend APIs."},
        )
        assert upd_res.status_code == 200

        # Apply optimization
        apply_res = client.post(
            "/api/optimize/apply",
            json={
                "cv_id": orig_cv_id,
                "original_cv_text": "Sara Ali\nWorked on backend APIs.",
                "session_id": opt_data["session_id"],
                "save_as_new_cv": True,
            },
        )
        assert apply_res.status_code == 200
        apply_data = apply_res.get_json()
        assert apply_data["applied_count"] == 1
        assert "Architected and maintained RESTful backend APIs." in apply_data["revised_cv_text"]
        assert apply_data["new_cv_id"] != orig_cv_id

        # Verify original CV is untouched
        orig_cv = client.get(f"/api/cvs/{orig_cv_id}").get_json()
        assert orig_cv["professional_summary"] == "Worked on backend APIs."

    def test_input_validation_endpoints(self, client):
        """Regression: Endpoints must validate missing required inputs with 400."""
        assert client.post("/api/rejection/analyze", json={}).status_code == 400
        assert client.post("/api/ai/generate-summary", json={}).status_code == 400
        assert client.post("/api/ai/generate-description", json={}).status_code == 400

        start_res = client.post("/api/interview/start", json={"target_role": "Backend Engineer"})
        sid = start_res.get_json()["session_id"]
        assert client.post(f"/api/interview/{sid}/answer", json={"answer": ""}).status_code == 400

    @patch("ai_service.ai_evaluate_cv")
    def test_execute_tool_attached_cv_extraction(self, mock_eval):
        """Regression: execute_tool must extract attached CV text from conversation history when ATTACHED_CV is passed."""
        from chat_agent import execute_tool

        mock_eval.return_value = {"success": True, "data": {"overall_assessment": "Strong CV", "scores": {}}}
        messages = [
            {
                "role": "user",
                "content": "قيّم سيرتي الذاتية\n\n[Attached CV: resume.pdf]\nAhmed Hassan\nSenior Software Engineer with 6 years of Python experience in Cairo.",
            }
        ]
        res = execute_tool("evaluate_cv", {"cv_text": "ATTACHED_CV", "target_role": "Software Engineer"}, context_messages=messages)
        assert res["success"] is True
        called_cv_text = mock_eval.call_args[0][0]
        assert "Ahmed Hassan" in called_cv_text
        assert "ATTACHED_CV" not in called_cv_text

    @patch("ai_service.ai_interview_report")
    @patch("ai_service.ai_evaluate_answer")
    @patch("ai_service.ai_interview_question")
    def test_interview_tools_auto_resolve_session_and_report(self, mock_q, mock_eval_ans, mock_rep):
        """Regression: submit_interview_answer and end_interview must auto-resolve session_id/qa_id across turns."""
        from chat_agent import execute_tool

        mock_q.side_effect = [
            {"success": True, "data": {"question": "Tell me about a time you led a project.", "tip": "Use STAR"}},
            {"success": True, "data": {"question": "How do you handle tight deadlines?", "tip": "Be specific"}},
        ]
        mock_eval_ans.return_value = {
            "success": True,
            "data": {"overall_rating": "good", "strengths": ["Clear action"], "weaknesses": []},
        }
        mock_rep.return_value = {
            "success": True,
            "data": {"overall_performance": "Solid interview", "rating": "ready", "key_strengths": ["Leadership"]},
        }

        start_res = execute_tool("start_interview", {"target_role": "Data Analyst", "interview_type": "behavioral"})
        assert start_res["success"] is True
        assert start_res["session_id"] > 0

        # Submit answer without passing session_id or qa_id explicitly (simulating multi-turn LLM call)
        ans_res = execute_tool("submit_interview_answer", {"answer": "In my previous role, I led a 4-person team..."})
        assert ans_res["success"] is True
        assert ans_res["evaluation"]["overall_rating"] == "good"
        assert ans_res["next_question"] == "How do you handle tight deadlines?"

        # End interview and get report
        end_res = execute_tool("end_interview", {})
        assert end_res["success"] is True
        assert end_res["data"]["rating"] == "ready"


