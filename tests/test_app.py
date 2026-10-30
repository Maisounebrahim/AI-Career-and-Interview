"""
AI Career Coach - Test Suite
Tests critical workflows and API endpoints.
"""
import os
import sys
import json
import unittest
import tempfile
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Use test database
os.environ['FLASK_SECRET_KEY'] = 'test-secret'

from app import app
from database import init_db, get_db
from config import Config

class TestBase(unittest.TestCase):
    """Base test class with setup/teardown."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
        # Use temp database
        self.db_fd, self.db_path = tempfile.mkstemp(suffix='.db')
        Config.DATABASE_PATH = Path(self.db_path)
        init_db()
    
    def tearDown(self):
        """Clean up test fixtures."""
        os.close(self.db_fd)
        os.unlink(self.db_path)


class TestSystemAPI(TestBase):
    """Test system endpoints."""
    
    def test_status_endpoint(self):
        """Test /api/status returns correct format."""
        response = self.client.get('/api/status')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('status', data)
        self.assertEqual(data['status'], 'ok')
        self.assertIn('ai_available', data)
    
    def test_index_page(self):
        """Test that index page loads."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)


class TestCVAPI(TestBase):
    """Test CV CRUD operations."""
    
    def _create_cv(self):
        """Helper to create a new CV and return its ID."""
        data = {
            'title': 'Test CV',
            'language': 'en',
            'contact_info': {'name': 'John Doe', 'email': 'john@example.com'},
            'professional_summary': 'Experienced developer',
            'sections': [
                {
                    'title': 'Experience',
                    'type': 'experience',
                    'items': [
                        {
                            'title': 'Software Engineer',
                            'company': 'Tech Corp',
                            'date': '2020-2023',
                            'description': 'Built web applications'
                        }
                    ]
                }
            ],
            'template': 'professional'
        }
        response = self.client.post('/api/cvs', 
                                     data=json.dumps(data),
                                     content_type='application/json')
        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertIn('id', result)
        return result['id']

    def test_create_cv(self):
        """Test creating a new CV."""
        cv_id = self._create_cv()
        self.assertIsInstance(cv_id, int)
    
    def test_list_cvs(self):
        """Test listing CVs."""
        self._create_cv()
        response = self.client.get('/api/cvs')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)
    
    def test_get_cv(self):
        """Test getting a specific CV."""
        cv_id = self._create_cv()
        response = self.client.get(f'/api/cvs/{cv_id}')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['title'], 'Test CV')
        self.assertEqual(data['contact_info']['name'], 'John Doe')
    
    def test_update_cv(self):
        """Test updating a CV."""
        cv_id = self._create_cv()
        update_data = {
            'title': 'Updated CV',
            'language': 'en',
            'contact_info': {'name': 'Jane Doe', 'email': 'jane@example.com'},
            'professional_summary': 'Senior developer',
            'sections': [],
            'template': 'modern'
        }
        response = self.client.put(f'/api/cvs/{cv_id}',
                                    data=json.dumps(update_data),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # Verify update
        response = self.client.get(f'/api/cvs/{cv_id}')
        data = response.get_json()
        self.assertEqual(data['title'], 'Updated CV')
    
    def test_delete_cv(self):
        """Test deleting a CV."""
        cv_id = self._create_cv()
        response = self.client.delete(f'/api/cvs/{cv_id}')
        self.assertEqual(response.status_code, 200)
        
        # Verify deleted
        response = self.client.get(f'/api/cvs/{cv_id}')
        self.assertEqual(response.status_code, 404)
    
    def test_get_nonexistent_cv(self):
        """Test getting a CV that doesn't exist."""
        response = self.client.get('/api/cvs/99999')
        self.assertEqual(response.status_code, 404)


class TestDocumentUpload(TestBase):
    """Test document upload functionality."""
    
    def test_upload_txt(self):
        """Test uploading a text file."""
        import io
        data = {
            'file': (io.BytesIO(b'Test CV content here'), 'test_cv.txt'),
            'purpose': 'cv_upload'
        }
        response = self.client.post('/api/upload',
                                     data=data,
                                     content_type='multipart/form-data')
        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertIn('extracted_text', result)
        self.assertEqual(result['extracted_text'], 'Test CV content here')
    
    def test_reject_invalid_file(self):
        """Test that invalid file types are rejected."""
        import io
        data = {
            'file': (io.BytesIO(b'not a valid file'), 'test.exe'),
            'purpose': 'test'
        }
        response = self.client.post('/api/upload',
                                     data=data,
                                     content_type='multipart/form-data')
        self.assertEqual(response.status_code, 400)
    
    def test_extract_text_paste(self):
        """Test extracting pasted text."""
        response = self.client.post('/api/extract-text',
                                     data=json.dumps({'text': 'Pasted CV text'}),
                                     content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['text'], 'Pasted CV text')


class TestInterviewAPI(TestBase):
    """Test interview session management."""
    
    def _start_interview(self):
        """Helper to start an interview session and return ID."""
        data = {
            'target_role': 'Software Engineer',
            'industry': 'Technology',
            'interview_type': 'behavioral',
            'difficulty': 'medium',
            'language': 'en'
        }
        response = self.client.post('/api/interview/start',
                                     data=json.dumps(data),
                                     content_type='application/json')
        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertIn('session_id', result)
        return result['session_id']

    def test_start_interview(self):
        """Test starting an interview session."""
        session_id = self._start_interview()
        self.assertIsInstance(session_id, int)
    
    def test_get_interview_session(self):
        """Test getting an interview session."""
        session_id = self._start_interview()
        response = self.client.get(f'/api/interview/{session_id}')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['target_role'], 'Software Engineer')
    
    def test_list_interviews(self):
        """Test listing interview sessions."""
        self._start_interview()
        response = self.client.get('/api/interviews')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)


class TestEvaluationAPI(TestBase):
    """Test evaluation endpoints handle missing AI gracefully."""
    
    def test_evaluate_requires_text(self):
        """Test that evaluation requires CV text."""
        response = self.client.post('/api/evaluate',
                                     data=json.dumps({}),
                                     content_type='application/json')
        self.assertEqual(response.status_code, 400)
    
    def test_match_requires_both_inputs(self):
        """Test that matching requires both CV and job description."""
        response = self.client.post('/api/match',
                                     data=json.dumps({'cv_text': 'test'}),
                                     content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        response = self.client.post('/api/match',
                                     data=json.dumps({'job_description': 'test'}),
                                     content_type='application/json')
        self.assertEqual(response.status_code, 400)
    
    def test_offer_review_requires_details(self):
        """Test that offer review requires offer details."""
        response = self.client.post('/api/offer/review',
                                     data=json.dumps({}),
                                     content_type='application/json')
        self.assertEqual(response.status_code, 400)


class TestDatabaseOperations(TestBase):
    """Test database operations directly."""
    
    def test_cv_persistence(self):
        """Test that CVs persist correctly."""
        from database import save_cv, get_cv, list_cvs
        
        cv_id = save_cv({
            'title': 'Persistence Test',
            'language': 'ar',
            'contact_info': {'name': 'أحمد'},
            'sections': [{'title': 'المهارات', 'items': ['Python', 'JavaScript']}]
        })
        
        cv = get_cv(cv_id)
        self.assertIsNotNone(cv)
        self.assertEqual(cv['title'], 'Persistence Test')
        self.assertEqual(cv['language'], 'ar')
        self.assertEqual(cv['contact_info']['name'], 'أحمد')
    
    def test_interview_session_with_qa(self):
        """Test interview session with Q&A entries."""
        from database import save_interview_session, save_interview_qa, get_interview_session
        
        session_id = save_interview_session({
            'target_role': 'Data Scientist',
            'industry': 'Finance',
            'interview_type': 'technical',
            'difficulty': 'hard',
            'language': 'en'
        })
        
        save_interview_qa({
            'session_id': session_id,
            'question_number': 1,
            'question': 'Explain overfitting.',
            'user_answer': 'When a model learns noise...',
            'evaluation': {'rating': 'good'}
        })
        
        session = get_interview_session(session_id)
        self.assertIsNotNone(session)
        self.assertEqual(len(session['questions']), 1)
        self.assertEqual(session['questions'][0]['question'], 'Explain overfitting.')
    
    def test_rejection_analysis_storage(self):
        """Test rejection analysis storage."""
        from database import save_rejection_analysis, get_rejection_analysis
        
        analysis_id = save_rejection_analysis({
            'job_title': 'Senior Engineer',
            'company': 'Big Corp',
            'application_details': 'Applied online',
            'feedback_received': 'No feedback',
            'analysis': {'factors': ['experience']},
            'improvement_plan': {'actions': ['upskill']}
        })
        
        analysis = get_rejection_analysis(analysis_id)
        self.assertIsNotNone(analysis)
        self.assertEqual(analysis['job_title'], 'Senior Engineer')
    
    def test_offer_review_storage(self):
        """Test offer review storage."""
        from database import save_offer_review, get_offer_review
        
        review_id = save_offer_review({
            'job_title': 'Lead Developer',
            'company': 'Startup Inc',
            'offer_details': 'Salary: 100k',
            'user_priorities': 'Work-life balance',
            'analysis': {'salary': '100k'}
        })
        
        review = get_offer_review(review_id)
        self.assertIsNotNone(review)
        self.assertEqual(review['company'], 'Startup Inc')


if __name__ == '__main__':
    unittest.main(verbosity=2)
