# CareerCompass AI — AI Career & Interview Coach

A comprehensive, locally-hosted career coaching web application developed by **Head & Hand** that helps you create and improve CVs, practice interviews, analyze rejections, and review job offers — guided by the Human-Centered AI (HAI) principle of **User Control and Agency** (*"The AI guides. The user decides."*).

## Interactive 3-Stage Onboarding Experience

First-time users are automatically greeted by an accessible, 7-step interactive onboarding experience structured around three progressive learning stages:

1. **Stage 1 — The System Does It (Inform & Explain)**
   - **Step 1 (Welcome & Persona Lens):** Introduces CareerCompass AI, the HAI principle of *User Control and Agency*, Low-Vision Accessibility controls (**Large Text `A+`** and **High Contrast `◐`**), and three selectable persona lenses (**Mostafa**, **Nour Hassan**, and **Salma Adel**).
   - **Step 2 (Service Discovery):** Explores all 7 implemented career services and the AI Chatbot, clearly distinguishing **User-Provided Information** from **AI-Generated Suggestions**.
   - **Step 3 (System Demonstration):** Demonstrates a complete synthetic workflow without requiring personal data, showing sample inputs, structured evaluation scores, AI recommendations, and transparent reasoning for why each recommendation was generated.
2. **Stage 2 — Co-pilot (Explain & Allow Control)**
   - **Step 4 (Guided Practice):** Guides users step-by-step through a real supported workflow (`Evaluate CV` via `/api/evaluate` or `Offer Review` via `/api/offer/review`) with file upload (`/api/upload`), editable synthetic sample data, and a non-interruptive **Ask Co-pilot** Q&A helper.
   - **Step 5 (User Control & Agency Lab):** Explicitly teaches and demonstrates that AI suggestions are optional. Users practice **Accept**, **Reject**, **Edit**, **Request Clarification (`Why?`)**, **Request Revision (`Simple` / `Action` / `Concise` tone)**, and **Undo / Reset**, with a live controlled document preview connected to `/api/optimize/apply`.
3. **Stage 3 — The User Does It (Allow Control & Enable Feedback)**
   - **Step 6 (Independent Use):** Transitions users to independent navigation across all 7 workspaces and the AI Chatbot, with collapsible in-app **Co-pilot Page Guides** and 1-click synthetic sample loaders on every page.
   - **Step 7 (Completion & Feedback):** Displays *"You're ready to take control of your career journey!"*, records optional onboarding feedback, and launches directly into the application.

### Accessing, Skipping, and Restarting the Onboarding

- **Automatic First-Time Launch:** Opens automatically on first visit (persisted via `localStorage` keys `cc_onboarding_status` and `cc_onboarding_step`, with graceful in-memory fallback if browser storage is disabled).
- **Skip Anytime:** Click **`⏭ Skip Tutorial (Use App Now)`**, press **`Esc`**, or click **`✕`** in the top-right corner of the dialog to start using the application immediately without being forced to complete the tutorial.
- **Resume or Replay:** Click **`🎓 Tutorial & Help`** (or **`🎓 Resume Tutorial` / `🎓 Replay Tutorial`**) in the top navigation bar or the bottom of the left sidebar at any time, or click **`🔄 Restart`** inside the onboarding footer.
- **Low-Vision Accessibility:** Toggle **`👁️ A+ (Large Text)`** and **`◐ High Contrast`** from the top header bar or inside the onboarding header at any time. Keyboard navigation (`Tab`, `Shift+Tab`, `ArrowRight`, `ArrowLeft`, `Enter`, `Escape`) and ARIA live announcements (`#obAriaLive`) are supported throughout.

## Features

### 7 Core Services

| # | Service | Description |
|---|---------|-------------|:------------:|
| 1 | **CV Creation** | Build professional CVs with live preview, multiple templates, PDF/DOCX export |
| 2 | **CV Optimization** | Upload a CV and get targeted improvement suggestions | 
| 3 | **CV Evaluation** | Comprehensive quality assessment with scores and actionable feedback | 
| 4 | **Job Matching** | Compare your CV against a job description, find gaps and keywords | 
| 5 | **Mock Interviews** | Interactive interview practice with evaluation and feedback | 
| 6 | **Rejection Analysis** | Understand rejections and build improvement plans | 
| 7 | **Offer Review** | Analyze offers, identify concerns, get negotiation strategies | 

### Additional Features
- 🌐 English and Arabic interface (RTL support)
- 📄 PDF and DOCX import/export
- 💾 Local data persistence (SQLite)
- 🔒 Privacy-first: all data stays on your computer
- 📱 Responsive design for desktop and mobile

## Quick Start (Windows)

### Prerequisites
- **Python 3.10+** installed and in PATH
- **8 GB RAM** minimum

### Installation

1. **Double-click `start.bat`** — it will:
   - Create a virtual environment
   - Install dependencies
   - Start the server

2. **Open your browser** to: **http://localhost:3000**

That's it!

### Manual Installation

```bash
# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the application
python app.py
```

## AI Configuration (Optional)

AI features require an API key from an OpenAI-compatible provider.

### Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   copy .env.example .env.local
   ```

2. Edit `.env.local` and set your API key:
   ```
   AI_API_KEY=sk-your-actual-api-key
   AI_MODEL=gpt-4o-mini
   ```

3. Restart the application.

### Supported Providers

| Provider | Setup |
|----------|-------|
| **OpenAI** | Get key from [platform.openai.com](https://platform.openai.com/api-keys) |
| **Azure OpenAI** | Set `AI_PROVIDER=azure` and `AI_API_BASE=https://your-endpoint.openai.azure.com/` |
| **Any OpenAI-compatible** | Set `AI_PROVIDER=compatible` and `AI_API_BASE=https://your-provider-url/v1` |

### Without AI

CV Creation works fully without AI — you can build, edit, preview, and export CVs. All other services display a clear message explaining that AI configuration is needed.

## Privacy & Data

- **All data is stored locally** in `data/career_coach.db` (SQLite)
- **Uploaded files** are stored in the `uploads/` directory
- **When AI is used**, your CV text/interview answers are sent to the configured AI provider for processing
- **No data is sent anywhere** unless you explicitly use an AI-powered feature
- You can delete your data through the application or by deleting the `data/` and `uploads/` folders

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

## Running Tests

```bash
# Activate virtual environment
venv\Scripts\activate

# Run tests
python -m pytest tests/ -v
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Edit `FLASK_PORT` in `.env.local` |
| Python not found | Install from [python.org](https://www.python.org/downloads/) and check "Add to PATH" |
| PDF export fails | Run `pip install reportlab` |
| DOCX import fails | Run `pip install python-docx PyPDF2` |
| AI not working | Check `AI_API_KEY` in `.env.local`, ensure it's valid |

## Technology Stack

- **Backend**: Python 3, Flask, SQLite
- **Frontend**: HTML5, Tailwind CSS (CDN), Vanilla JavaScript
- **AI**: OpenAI-compatible API (configurable)
- **Documents**: ReportLab (PDF), python-docx (DOCX), PyPDF2 (PDF parsing)
