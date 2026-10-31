# AI Career Coach

A comprehensive, locally-hosted career coaching web application that helps you create and improve CVs, practice interviews, analyze rejections, and review job offers.

## Features

### 7 Core Services

| # | Service | Description | 
|---|---------|-------------|
| 1 | **CV Creation** | Build professional CVs with live preview, multiple templates, PDF/DOCX export  |
| 2 | **CV Optimization** | Upload a CV and get targeted improvement suggestions  |
| 3 | **CV Evaluation** | Comprehensive quality assessment with scores and actionable feedback  |
| 4 | **Job Matching** | Compare your CV against a job description, find gaps and keywords  |
| 5 | **Mock Interviews** | Interactive interview practice with evaluation and feedback |
| 6 | **Rejection Analysis** | Understand rejections and build improvement plans  |
| 7 | **Offer Review** | Analyze offers, identify concerns, get negotiation strategies  |

### Additional Features
- 🌐 English and Arabic interface (RTL support)
- 📄 PDF and DOCX import/export
- 💾 Local data persistence (SQLite)
- 🔒 Privacy-first: all data stays on your computer
- 📱 Responsive design for desktop and mobile



2. **Open your browser** to: **http://localhost:3000**

That's it!



CV Creation works fully without AI — you can build, edit, preview, and export CVs. All other services display a clear message explaining that AI configuration is needed.


## Project Structure

```
project/
├── app.py              # Flask application & API routes
├── config.py           # Configuration management
├── database.py         # SQLite database operations
├── ai_service.py       # AI provider integration
├── doc_utils.py        # Document parsing & export
├── requirements.txt    # Python dependencies
├── start.bat           # Windows startup script
├── .env.example        # Environment config template
├── .env.local          # Your local config (create this)
├── static/
│   └── index.html      # Single-page frontend application
├── data/
│   └── career_coach.db # SQLite database (auto-created)
├── uploads/            # Uploaded documents
└── tests/
    └── test_app.py     # Automated tests
```



## Technology Stack

- **Backend**: Python 3, Flask, SQLite
- **Frontend**: HTML5, Tailwind CSS (CDN), Vanilla JavaScript
- **AI**: OpenAI-compatible API (configurable)
- **Documents**: ReportLab (PDF), python-docx (DOCX), PyPDF2 (PDF parsing)
