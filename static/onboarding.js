/**
 * CareerCompass AI — Interactive 3-Stage Onboarding & Contextual Co-Pilot System
 * Developed by Team Head & Hand
 *
 * Core HAI Principle: User Control and Agency ("The AI guides. The user decides.")
 *
 * Progressive Learning Stages:
 *   Stage 1: The System Does It (Inform & Explain) — Steps 1, 2, 3
 *   Stage 2: Co-pilot (Explain & Allow Control)    — Steps 4, 5
 *   Stage 3: The User Does It (Allow Control & Enable Feedback) — Steps 6, 7
 *
 * Modular Components:
 *   - OnboardingStorage      : Safe localStorage wrapper with in-memory fallback
 *   - OnboardingContainer    : Modal lifecycle, keyboard navigation, focus management, ARIA announcer
 *   - OnboardingProgress     : 3-stage banner, accessible progressbar, and interactive step pills
 *   - WelcomeStep            : Step 1 — Welcome, HAI principle intro, and Persona selector (Mostafa, Nour, Salma)
 *   - ServiceDiscoveryStep   : Step 2 — Stage 1 service discovery across all 7 real services + AI Chat
 *   - SystemDemoStep         : Step 3 — Stage 1 synthetic walkthrough distinguishing User Input vs AI Suggestion
 *   - GuidedPracticeStep     : Step 4 — Stage 2 real guided CV Evaluation / Offer Review practice with Co-pilot Q&A
 *   - UserControlStep        : Step 5 — Stage 2 interactive Accept / Reject / Edit / Clarify / Revise / Undo lab
 *   - IndependentUseStep     : Step 6 — Stage 3 transition to independent workflows & contextual help controls
 *   - CompletionStep         : Step 7 — Stage 3 completion ("You're ready to take control of your career journey!")
 *   - OnboardingNavigation   : Accessible Back, Next, Skip, Replay, and Finish controls
 *   - ContextualHelpBar      : Non-intrusive in-app contextual guide & 1-click sample loader on service pages
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SAFE PERSISTENCE LAYER (Handles unavailable/cleared localStorage)
  // ═══════════════════════════════════════════════════════════════════════════
  const memoryStore = {};
  const OnboardingStorage = {
    get(key, fallback = null) {
      try {
        const val = window.localStorage.getItem(key);
        return val !== null ? val : (key in memoryStore ? memoryStore[key] : fallback);
      } catch (e) {
        return key in memoryStore ? memoryStore[key] : fallback;
      }
    },
    set(key, value) {
      memoryStore[key] = String(value);
      try {
        window.localStorage.setItem(key, String(value));
      } catch (e) {
        // Graceful fallback when storage is disabled or quota exceeded
      }
    },
    remove(key) {
      delete memoryStore[key];
      try {
        window.localStorage.removeItem(key);
      } catch (e) {}
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. PERSONA PROFILES & SYNTHETIC DATA (Mostafa, Nour Hassan, Salma Adel)
  // ═══════════════════════════════════════════════════════════════════════════
  const PERSONAS = {
    nour: {
      id: 'nour',
      name: 'Nour Hassan',
      age: 25,
      badge: 'Persona 2 • Intermediate Tech & AI',
      role: 'Junior Data Analyst Candidate',
      avatar: '📊',
      color: 'indigo',
      summary: '25-year-old CS graduate aiming to evaluate and optimize her CV for Junior Data Analyst roles and practice behavioral interviews.',
      adaptationNote: 'Emphasizes evidence-based CV Evaluation scores, side-by-side phrasing optimization controls (Accept, Edit, Reject), and STAR interview preparation.',
      targetRole: 'Junior Data Analyst',
      sampleCvText: `[SYNTHETIC SAMPLE CV — NOUR HASSAN]
Nour Hassan
cairo.nour.sample@example.com | +20 100 000 0000 | Cairo, Egypt | linkedin.com/in/nour-sample

PROFESSIONAL SUMMARY
Computer Science graduate interested in data analysis and business intelligence. Worked with Python, SQL, and Excel during university coursework and internship.

EXPERIENCE
Data Intern — SmartRetail Analytics (Jul 2025 – Oct 2025)
- Helped the team clean sales data and fix missing values.
- Made weekly charts and dashboards for store managers.
- Wrote SQL queries to get customer reports from the database.

EDUCATION
B.Sc. in Computer Science — Cairo University (2021 – 2025)
Grade: Very Good (GPA 3.4/4.0)

PROJECTS
Customer Churn Analysis Project — Python, Pandas, Scikit-learn
- Analyzed telecom dataset of 5,000 rows to identify churn factors and presented findings.

SKILLS
Python, SQL, Excel, Power BI, Pandas, Data Cleaning, Communication`,
      demoEvaluation: {
        overall_assessment: 'Solid foundational profile for a Junior Data Analyst with relevant internship and academic project experience. However, your experience bullet points use passive phrasing ("Helped the team", "Made weekly charts") instead of highlighting how you used Python, SQL, and Power BI to drive clear outcomes.',
        scores: {
          professional_summary: { score: 7, explanation: 'Clear goal, but could explicitly mention core tools (SQL, Power BI, Python) and analytical focus.' },
          education: { score: 9, explanation: 'Strong Computer Science degree with GPA clearly stated.' },
          experience: { score: 6, explanation: 'Describes duties passively ("Helped", "Made") rather than specific actions and analytical scope.' },
          skills: { score: 8, explanation: 'Relevant data stack (Python, SQL, Pandas, Power BI) is well organized.' },
          projects_achievements: { score: 8, explanation: 'Good inclusion of dataset size (5,000 rows) in the Churn Analysis project.' },
          organization_readability: { score: 8, explanation: 'Clean section headings and chronological structure.' },
          ats_compatibility: { score: 7, explanation: 'Contains core keywords, though "ETL", "Data Visualization", and "KPIs" could be clearer.' }
        },
        strengths: [
          'Relevant hands-on Data Internship combined with a B.Sc. in Computer Science.',
          'Clear technical toolkit including Python, SQL, Pandas, and Power BI.',
          'Quantified dataset scale (5,000 rows) in the academic project.'
        ],
        weaknesses: [
          'Experience bullets start with weak verbs ("Helped the team", "Made weekly charts").',
          'Python and SQL impact in the internship is understated compared to your actual skills list.'
        ],
        improvements: [
          {
            priority: 'high',
            area: 'Experience & Skills Alignment',
            suggestion: 'Your CV could better highlight your Python and SQL experience by specifying how you automated data cleaning and structured SQL queries during your internship.',
            reasoning: 'Recruiters and ATS scanners look for evidence of technical skills inside work experience, not just in the Skills list.'
          },
          {
            priority: 'medium',
            area: 'Professional Summary',
            suggestion: 'Open with your target title ("Entry-Level Data Analyst") and core strengths (SQL querying, Python data wrangling, Power BI dashboarding).',
            reasoning: 'Gives hiring managers immediate clarity in the first 6 seconds of reading.'
          }
        ],
        missing_sections: ['Certifications (Optional)'],
        disclaimer: 'These scores reflect general CV quality indicators and should not be interpreted as predictions of hiring outcomes.'
      }
    },

    mostafa: {
      id: 'mostafa',
      name: 'Mostafa',
      age: 23,
      badge: 'Persona 1 • Simple English & Step-by-Step',
      role: 'Entry-Level Cybersecurity / IT Graduate',
      avatar: '🛡️',
      color: 'emerald',
      summary: '23-year-old recent computing graduate with limited AI experience and developing English skills, building his first professional English CV for entry-level cybersecurity roles.',
      adaptationNote: 'Uses simple, clear English, defines technical terms (ATS, Action Verbs, Professional Summary), and shows how to present university projects honestly without inventing experience.',
      targetRole: 'Junior Cybersecurity Analyst / SOC Intern',
      sampleCvText: `[SYNTHETIC SAMPLE CV — MOSTAFA]
Mostafa Mahmoud
mostafa.cyber.sample@example.com | +20 101 000 0000 | Alexandria, Egypt

PROFESSIONAL SUMMARY
Fresh graduate in Information Technology. I want to work in Cybersecurity or IT Support. I studied network security and Linux in university.

EDUCATION
B.Sc. in Information Technology — Alexandria University (2021 – 2025)
Graduation Project: Network Intrusion Detection Lab (Grade: Excellent)

PROJECTS
University Lab Project: Network Packet Analyzer & Firewall Rules
- Used Wireshark and Linux iptables to watch network traffic in a virtual lab.
- Found suspicious port scans and wrote simple firewall rules to block them.

Home Lab: Vulnerability Scanning Practice
- Installed Kali Linux and VirtualBox to test common web security issues (OWASP Top 10) on practice machines.

SKILLS
Linux, Wireshark, Basic Python, TCP/IP Networking, Firewalls, Troubleshooting`,
      demoEvaluation: {
        overall_assessment: 'Great start for a recent graduate! Even without full-time company experience, your university lab projects (Wireshark, Linux firewall rules, OWASP practice) are strong evidence for an entry-level SOC or IT Security internship. We can make your English phrasing more professional while keeping every fact 100% honest.',
        scores: {
          professional_summary: { score: 6, explanation: 'Uses informal phrasing ("I want to work in..."). Can be written in clearer professional English.' },
          education: { score: 9, explanation: 'Clearly lists IT degree and an Excellent grade on a security graduation project.' },
          experience: { score: 6, explanation: 'No formal job yet — which is normal for a fresh graduate! Highlighting academic labs bridges this gap.' },
          skills: { score: 8, explanation: 'Good foundational security tools (Wireshark, Linux, TCP/IP).' },
          projects_achievements: { score: 8, explanation: 'Practical lab work clearly shows hands-on curiosity.' },
          organization_readability: { score: 8, explanation: 'Easy to read and well organized.' },
          ats_compatibility: { score: 7, explanation: 'Adding standard terms like "Network Monitoring" and "Incident Triage" where accurate will help.' }
        },
        strengths: [
          'Strong, relevant graduation project in Network Intrusion Detection.',
          'Hands-on lab practice with industry tools (Wireshark, Linux iptables, VirtualBox).',
          'Honest presentation of entry-level skills without exaggeration.'
        ],
        weaknesses: [
          'Summary uses casual phrasing ("I want to work in...") instead of professional profile style.',
          'Project descriptions use simple verbs ("Used", "Found") that can be strengthened in clear English.'
        ],
        improvements: [
          {
            priority: 'high',
            area: 'Academic Projects Presentation',
            suggestion: 'Replace "Used Wireshark to watch network traffic" with "Monitored virtual lab network traffic using Wireshark and configured Linux iptables firewall rules to block unauthorized port scans."',
            reasoning: 'Uses professional English action verbs ("Monitored", "Configured") while describing the exact same university lab work honestly.'
          },
          {
            priority: 'medium',
            area: 'Professional Summary',
            suggestion: 'Rewrite as: "Detail-oriented IT graduate with hands-on academic lab experience in Linux administration, TCP/IP traffic analysis (Wireshark), and firewall configuration seeking a Junior SOC / Cybersecurity Internship."',
            reasoning: 'Communicates your degree, real skills, and target role clearly to employers.'
          }
        ],
        missing_sections: ['Certifications / Online Courses (e.g., TryHackMe or Cisco Intro to Cybersecurity if applicable)'],
        disclaimer: 'These scores reflect general CV quality indicators and should not be interpreted as predictions of hiring outcomes.'
      }
    },

    salma: {
      id: 'salma',
      name: 'Salma Adel',
      age: 37,
      badge: 'Persona 3 • Low-Vision Accessible & Offer Review',
      role: 'Web Developer Reviewing a Job Offer',
      avatar: '💼',
      color: 'amber',
      summary: '37-year-old CS graduate with strong web development skills and low-vision accessibility needs. Wants to review a Junior Web Developer job offer, understand its terms and risks, and make her own informed decision.',
      adaptationNote: 'High-contrast readable typography, short paragraphs, 1-click Large Text & High Contrast mode, and demonstrates how CareerCompass AI reviews job offers and suggests clarification questions without making decisions for her.',
      targetRole: 'Junior Web Developer',
      sampleOfferText: `[SYNTHETIC SAMPLE JOB OFFER — SALMA ADEL]
Position: Junior Web Developer (Full-Stack React & Node.js)
Company: Horizon Digital Solutions
Base Salary: 18,000 EGP / month (Gross)
Working Arrangement: Hybrid (3 days on-site in Smart Village, 2 days remote)
Working Hours: 9:00 AM – 6:00 PM (Sunday to Thursday), plus "additional weekend support as required by project deadlines without separate overtime pay."
Probation Period: 6 months (typically 3 months under standard practice).
Intellectual Property & Non-Compete Clause: "Employee agrees not to work for any software or web agency in Egypt for 24 months after leaving the company, and all personal coding projects created during employment belong to the company."
Benefits: Medical insurance after completing probation; 14 days annual leave.`,
      samplePriorities: 'Fair work-life balance, clear remote work terms, reasonable contract clauses, and accessible workspace adjustments.',
      sampleCvText: `[SYNTHETIC SAMPLE CV — SALMA ADEL]
Salma Adel
salma.webdev.sample@example.com | +20 102 000 0000 | Giza, Egypt

PROFESSIONAL SUMMARY
Experienced Web Developer with strong proficiency in React, TypeScript, modern CSS, accessibility (WCAG 2.1 AA), and RESTful API integration.

EXPERIENCE
Freelance Frontend & Full-Stack Web Developer (2022 – Present)
- Built responsive, accessible web applications for 8+ local business clients using React, Tailwind CSS, and Node.js.
- Improved keyboard navigation and screen-reader compatibility across client portals.

EDUCATION
B.Sc. in Computer Science — Helwan University

SKILLS
React, JavaScript (ES6+), TypeScript, HTML5, CSS3, WCAG Accessibility, Node.js, Git`,
      demoOfferReview: {
        summary: {
          salary: '18,000 EGP / month (Gross)',
          working_arrangements: 'Hybrid (3 days on-site, 2 days remote), 9 AM – 6 PM + uncompensated weekend support clause',
          benefits: ['Medical insurance (delayed until after 6-month probation)', '14 days annual leave'],
          responsibilities: ['Full-Stack React & Node.js Web Development', 'Weekend deadline support'],
          other_terms: ['6-month probation period', '24-month broad non-compete clause', 'Broad IP ownership covering personal projects']
        },
        analysis: {
          positive_aspects: [
            'Clear hybrid schedule (2 days remote per week).',
            'Role matches your React and Node.js technical stack.'
          ],
          concerns: [
            {
              term: '6-Month Probation Period',
              concern: 'Standard probation under Egyptian Labor Law is capped at 3 months with a single employer. A 6-month probation period is unusually long and delays medical insurance.',
              severity: 'high'
            },
            {
              term: 'Unpaid Weekend Support Clause',
              concern: '"Additional weekend support without separate overtime pay" creates risk of frequent unpaid overtime and burnout.',
              severity: 'high'
            },
            {
              term: 'Broad 24-Month Non-Compete & Personal IP Clause',
              concern: 'Restricting work at "any software or web agency in Egypt for 24 months" and claiming ownership of unrelated personal projects made outside work hours is overly broad.',
              severity: 'medium'
            }
          ],
          unclear_terms: [
            'Net take-home salary after taxes and social insurance deductions.',
            'Maximum frequency of weekend support and whether compensatory time-off (TOIL) is provided.',
            'Whether medical insurance can start on Day 1 instead of after probation.'
          ],
          questions_to_ask: [
            'Can the probation period be aligned with the standard 3-month period, with medical insurance starting upon hiring?',
            'How often is weekend support needed, and is compensatory time off granted when weekend hours are worked?',
            'Can the IP clause be clarified so it only covers work created during working hours or using company equipment?'
          ]
        },
        negotiation: {
          strategies: [
            {
              area: 'Probation & Medical Coverage',
              approach: 'Request a standard 3-month probation period and Day-1 medical insurance enrollment.',
              rationale: 'Aligns with standard market and legal norms while protecting your health coverage.'
            },
            {
              area: 'Working Hours & Scope of IP',
              approach: 'Ask for written clarification on weekend work limits and narrow the IP clause to company-related work.',
              rationale: 'Protects your work-life balance and your independent portfolio.'
            }
          ],
          talking_points: [
            'Express enthusiasm for the React/Node.js role and the team.',
            'Ask to adjust probation from 6 months to 3 months.',
            'Clarify expectations around weekend support and personal open-source projects.'
          ],
          sample_message: 'Dear Hiring Team,\n\nThank you very much for offering me the Junior Web Developer position at Horizon Digital Solutions. I am excited about contributing to the team with my React and Node.js experience.\n\nBefore finalizing the agreement, I would appreciate clarifying a few contract terms:\n1. Probation & Benefits: Could we align the probation period to the standard 3 months and begin medical insurance coverage from the start date?\n2. Working Hours: Could we clarify how weekend support is scheduled and whether compensatory time off is provided?\n3. Intellectual Property: Could we specify that the IP clause applies to work related to company business or created using company resources?\n\nI look forward to discussing this together.\n\nBest regards,\nSalma Adel'
        },
        disclaimer: 'This is general career guidance, not legal advice. You remain in full control of whether to accept, negotiate, or decline any job offer.'
      },
      demoEvaluation: {
        overall_assessment: 'Strong, well-structured Web Developer CV with a rare and valuable specialization in WCAG Web Accessibility. Quantifying client impact and highlighting full-stack architecture will make your profile even stronger.',
        scores: {
          professional_summary: { score: 8, explanation: 'Clear, professional summary highlighting React, TypeScript, and WCAG 2.1 AA accessibility.' },
          education: { score: 8, explanation: 'B.Sc. in Computer Science clearly documented.' },
          experience: { score: 8, explanation: 'Strong freelance track record (8+ clients) with clear technical stack.' },
          skills: { score: 9, explanation: 'Excellent modern frontend stack + accessibility expertise.' },
          projects_achievements: { score: 7, explanation: 'Adding 1–2 named portfolio projects with live links or metrics would strengthen evidence.' },
          organization_readability: { score: 9, explanation: 'Clean headings, short readable lines, and high clarity.' },
          ats_compatibility: { score: 8, explanation: 'Strong keyword coverage for React/Frontend roles.' }
        },
        strengths: [
          'Proven experience delivering React & Node.js applications for 8+ clients.',
          'Distinctive expertise in WCAG 2.1 AA accessibility and keyboard/screen-reader usability.'
        ],
        weaknesses: [
          'Could list 1–2 specific project case studies with measurable outcomes.'
        ],
        improvements: [
          {
            priority: 'medium',
            area: 'Experience Impact',
            suggestion: 'Your CV could better highlight your React and WCAG accessibility results by mentioning specific usability improvements delivered for clients.',
            reasoning: 'Concrete examples help hiring managers picture your impact immediately.'
          }
        ],
        missing_sections: ['Named Portfolio Projects'],
        disclaimer: 'These scores reflect general CV quality indicators and should not be interpreted as predictions of hiring outcomes.'
      }
    }
  };

  // Initial suggestions for Step 5 (User Control & Agency Lab)
  function getInitialControlSuggestions(personaId) {
    if (personaId === 'mostafa') {
      return [
        {
          id: 'demo_sug_1',
          section: 'Projects — Network Packet Analyzer',
          original: 'Used Wireshark and Linux iptables to watch network traffic in a virtual lab.',
          suggested: 'Monitored virtual lab network traffic using Wireshark and configured Linux iptables firewall rules to block unauthorized port scans.',
          reason: 'Replaces informal verbs ("Used", "watch") with clear professional cybersecurity terminology ("Monitored", "configured") while keeping your exact lab experience 100% honest.',
          clarification: 'Why did the AI suggest this? Entry-level cybersecurity recruiters search for action verbs like "Monitored" and "Configured" alongside tools like "Wireshark" and "iptables". Notice it does NOT claim you worked at a company — it accurately frames your university virtual lab.',
          revisions: {
            simple: 'Analyzed network traffic in a university virtual lab using Wireshark and set up Linux iptables firewall rules.',
            action: 'Configured Linux iptables firewall rules and inspected packet captures in Wireshark to detect and block simulated port scans.',
            concise: 'Monitored lab network traffic with Wireshark and enforced Linux iptables firewall rules.'
          },
          status: 'pending',
          user_edited_text: null
        },
        {
          id: 'demo_sug_2',
          section: 'Professional Summary',
          original: 'Fresh graduate in Information Technology. I want to work in Cybersecurity or IT Support. I studied network security and Linux in university.',
          suggested: 'Detail-oriented Information Technology graduate with hands-on academic lab experience in Linux administration, TCP/IP traffic analysis (Wireshark), and firewall configuration seeking an entry-level Cybersecurity or SOC Analyst role.',
          reason: 'Transforms first-person casual sentences ("I want to work in...") into a standard English CV summary that highlights your real degree and lab skills.',
          clarification: 'Why did the AI suggest this? English CVs avoid "I want to..." and instead summarize your degree, core technical skills, and target role in 2 clear lines.',
          revisions: {
            simple: 'Information Technology graduate with practical university lab skills in Linux, Wireshark, and network security, seeking a Junior Cybersecurity or IT Support role.',
            action: 'Entry-Level Cybersecurity candidate (B.Sc. IT) skilled in Linux system hardening, packet inspection with Wireshark, and OWASP vulnerability testing.',
            concise: 'B.Sc. IT graduate skilled in Linux, Wireshark, and TCP/IP security seeking a Junior SOC / Cybersecurity role.'
          },
          status: 'pending',
          user_edited_text: null
        },
        {
          id: 'demo_sug_3',
          section: 'Skills & Tools Highlight',
          original: 'Linux, Wireshark, Basic Python, TCP/IP Networking, Firewalls, Troubleshooting',
          suggested: 'Network Security: Wireshark, Linux (iptables, Kali), TCP/IP | Scripting & Foundations: Python (Automation Basics), OWASP Top 10, IT Troubleshooting',
          reason: 'Groups your existing skills into clear categories so hiring managers can scan them in seconds.',
          clarification: 'Why did the AI suggest this? Grouping skills into "Network Security" and "Scripting & Foundations" improves readability without adding any skills you do not have.',
          revisions: {
            simple: 'Security Tools: Wireshark, Linux, Firewalls | Networking & Code: TCP/IP, Python Basics, Troubleshooting',
            action: 'Cybersecurity & Networking: TCP/IP, Wireshark Packet Analysis, Linux iptables, Kali Linux, Python Scripting',
            concise: 'Wireshark, Linux (iptables), TCP/IP Networking, OWASP Lab Testing, Python Basics, IT Troubleshooting'
          },
          status: 'pending',
          user_edited_text: null
        }
      ];
    }

    if (personaId === 'salma') {
      return [
        {
          id: 'demo_sug_1',
          section: 'Offer Negotiation — Probation & Medical Insurance',
          original: 'Accept the 6-month probation period and delayed medical insurance as written in the initial draft.',
          suggested: 'Request aligning the probation period to the standard 3 months and starting medical insurance coverage on Day 1.',
          reason: 'Under standard market and Egyptian labor norms, probation is capped at 3 months. Asking politely protects your healthcare coverage.',
          clarification: 'Why did the AI suggest this? A 6-month probation period leaves you without medical benefits for half a year. However, YOU decide whether this is a priority for you or if you prefer to negotiate salary instead.',
          revisions: {
            simple: 'Could we set the probation period to the standard 3 months and start medical insurance from Day 1?',
            action: 'I would like to align the probation clause with the standard 3-month period and include Day-1 medical coverage.',
            concise: 'Request 3-month standard probation + Day-1 medical insurance.'
          },
          status: 'pending',
          user_edited_text: null
        },
        {
          id: 'demo_sug_2',
          section: 'Offer Negotiation — Weekend Support Clause',
          original: 'Additional weekend support as required by project deadlines without separate overtime pay.',
          suggested: 'Ask HR to clarify how often weekend support occurs and request compensatory time-off (TOIL) when weekend hours are required.',
          reason: 'Open-ended unpaid weekend clauses can lead to burnout; clarifying expectations upfront prevents misunderstandings.',
          clarification: 'Why did the AI suggest this? The AI does NOT reject the offer for you. Instead, it drafts a polite question so you can get clear facts from the employer before making your decision.',
          revisions: {
            simple: 'Could you share how often weekend support is needed, and if we get a day off in exchange?',
            action: 'Could we specify a cap on weekend support hours or include compensatory time off for weekend deployments?',
            concise: 'Clarify frequency of weekend support and compensatory time off.'
          },
          status: 'pending',
          user_edited_text: null
        },
        {
          id: 'demo_sug_3',
          section: 'CV Experience — Highlighting Web Accessibility & React',
          original: 'Built responsive, accessible web applications for 8+ local business clients using React, Tailwind CSS, and Node.js.',
          suggested: 'Engineered 8+ responsive, WCAG 2.1 AA accessible web applications using React, TypeScript, Tailwind CSS, and Node.js, improving keyboard and screen-reader usability.',
          reason: 'Your CV could better highlight your React and WCAG accessibility expertise in a single high-impact statement.',
          clarification: 'Why did the AI suggest this? Combining your client count (8+) with your specific accessibility standard (WCAG 2.1 AA) makes your seniority stand out immediately.',
          revisions: {
            simple: 'Developed 8+ accessible React and Node.js web apps following WCAG 2.1 AA guidelines for keyboard and screen-reader users.',
            action: 'Delivered 8+ full-stack React and Node.js client portals with full WCAG 2.1 AA keyboard and screen-reader compliance.',
            concise: 'Built 8+ WCAG-compliant React & Node.js web applications.'
          },
          status: 'pending',
          user_edited_text: null
        }
      ];
    }

    // Default: Nour Hassan (Persona 2)
    return [
      {
        id: 'demo_sug_1',
        section: 'Experience — SmartRetail Analytics Internship',
        original: 'Helped the team clean sales data and fix missing values.',
        suggested: 'Cleaned and standardized retail sales datasets using Python (Pandas), resolving missing values to improve weekly reporting accuracy.',
        reason: 'Your CV could better highlight your Python and SQL experience: connecting "Python (Pandas)" directly to your internship data-cleaning work proves hands-on capability.',
        clarification: 'Why did the AI suggest this? In your Skills section you listed Python and Pandas, but your internship bullet only said "Helped the team clean sales data." Connecting the tool to the task makes your experience concrete—without inventing fake numbers.',
        revisions: {
          simple: 'Used Python and Pandas to clean retail sales data and fix missing values for weekly reports.',
          action: 'Automated data cleaning pipelines in Python (Pandas) to resolve missing records across retail sales datasets.',
          concise: 'Cleaned retail sales data using Python (Pandas) for accurate reporting.'
        },
        status: 'pending',
        user_edited_text: null
      },
      {
        id: 'demo_sug_2',
        section: 'Experience — SQL & Dashboard Reporting',
        original: 'Made weekly charts and dashboards for store managers. Wrote SQL queries to get customer reports from the database.',
        suggested: 'Extracted customer purchase metrics using SQL queries and built interactive weekly Power BI dashboards for store managers.',
        reason: 'Replaces weak verbs ("Made", "get") with analytical verbs ("Extracted", "built") and highlights SQL + Power BI together.',
        clarification: 'Why did the AI suggest this? Data Analyst job descriptions heavily weight SQL querying + BI dashboarding. Combining these two related bullets shows end-to-end workflow ownership.',
        revisions: {
          simple: 'Wrote SQL queries to pull customer data and designed weekly Power BI dashboards for store managers.',
          action: 'Authored SQL queries to extract customer KPIs and designed weekly Power BI dashboards for store leadership.',
          concise: 'Queried customer data via SQL and built weekly Power BI dashboards.'
        },
        status: 'pending',
        user_edited_text: null
      },
      {
        id: 'demo_sug_3',
        section: 'Professional Summary',
        original: 'Computer Science graduate interested in data analysis and business intelligence. Worked with Python, SQL, and Excel during university coursework and internship.',
        suggested: 'Analytical Computer Science graduate (GPA 3.4/4.0) with internship experience in Python (Pandas), SQL querying, and Power BI dashboarding, seeking a Junior Data Analyst role.',
        reason: 'Leads with your strong GPA, core technical stack (Python, SQL, Power BI), and clear target role.',
        clarification: 'Why did the AI suggest this? Recruiters scan the top summary first. Including your real GPA (3.4/4.0) and specific tools gives immediate credibility.',
        revisions: {
          simple: 'Computer Science graduate skilled in Python, SQL, Excel, and Power BI with hands-on data internship experience seeking a Junior Data Analyst position.',
          action: 'Junior Data Analyst candidate (B.Sc. CS, 3.4 GPA) experienced in SQL reporting, Python data wrangling, and Power BI visualization.',
          concise: 'CS graduate (3.4 GPA) skilled in Python, SQL, and Power BI seeking a Junior Data Analyst role.'
        },
        status: 'pending',
        user_edited_text: null
      }
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. ONBOARDING STATE & STEP DEFINITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  const STEPS = [
    {
      index: 0,
      id: 'welcome',
      stage: 1,
      stageLabel: 'Stage 1: The System Does It',
      stagePrinciple: 'HAI Principle: Inform & Explain',
      shortTitle: '1. Welcome & Persona',
      title: 'Welcome to CareerCompass AI',
      subtitle: 'Learn how our AI Career & Interview Coach works — while you stay in full control of every decision.'
    },
    {
      index: 1,
      id: 'discovery',
      stage: 1,
      stageLabel: 'Stage 1: The System Does It',
      stagePrinciple: 'HAI Principle: Inform & Explain',
      shortTitle: '2. Service Discovery',
      title: 'Explore Your 7 Career Services & AI Coach',
      subtitle: 'Understand what CareerCompass AI can do, what information you provide, and what the AI generates.'
    },
    {
      index: 2,
      id: 'system-demo',
      stage: 1,
      stageLabel: 'Stage 1: The System Does It',
      stagePrinciple: 'HAI Principle: Inform & Explain',
      shortTitle: '3. System Demo',
      title: 'Stage 1: The System Does It (Live Walkthrough)',
      subtitle: 'Observe a complete demonstration using synthetic data before trying anything yourself. No personal data required.'
    },
    {
      index: 3,
      id: 'guided-practice',
      stage: 2,
      stageLabel: 'Stage 2: Co-pilot',
      stagePrinciple: 'HAI Principle: Explain & Allow Control',
      shortTitle: '4. Co-pilot Practice',
      title: 'Stage 2: Co-pilot (Guided Practice Together)',
      subtitle: 'Try a real supported workflow with step-by-step contextual guidance, editable inputs, and instant Q&A help.'
    },
    {
      index: 4,
      id: 'user-control',
      stage: 2,
      stageLabel: 'Stage 2: Co-pilot',
      stagePrinciple: 'HAI Principle: Allow Control & Agency',
      shortTitle: '5. User Control Lab',
      title: 'User Control & Agency: You Make the Final Decision',
      subtitle: 'AI suggestions are never mandatory. Practice accepting, rejecting, editing, questioning, revising, or undoing AI recommendations.'
    },
    {
      index: 5,
      id: 'independent-use',
      stage: 3,
      stageLabel: 'Stage 3: The User Does It',
      stagePrinciple: 'HAI Principle: Allow Control & Enable Feedback',
      shortTitle: '6. Independent Use',
      title: 'Stage 3: The User Does It (Independent Workspace)',
      subtitle: 'Transition smoothly to full independence with non-intrusive contextual help and full control over all tools.'
    },
    {
      index: 6,
      id: 'completion',
      stage: 3,
      stageLabel: 'Stage 3: The User Does It',
      stagePrinciple: 'HAI Principle: Allow Control & Enable Feedback',
      shortTitle: '7. Ready to Launch',
      title: "You're ready to take control of your career journey!",
      subtitle: 'You have completed the 3-stage onboarding. Replay any stage anytime or jump straight into your career tools.'
    }
  ];

  const OB = {
    isOpen: false,
    currentStep: parseInt(OnboardingStorage.get('cc_onboarding_step', '0'), 10) || 0,
    status: OnboardingStorage.get('cc_onboarding_status', null), // null | 'in_progress' | 'completed' | 'skipped'
    persona: OnboardingStorage.get('cc_onboarding_persona', 'nour'),
    largeText: OnboardingStorage.get('cc_a11y_large_text', 'false') === 'true',
    highContrast: OnboardingStorage.get('cc_a11y_high_contrast', 'false') === 'true',
    showContextualTips: OnboardingStorage.get('cc_contextual_tips', 'true') !== 'false',
    // Step 3 Demo sub-state
    demoTab: 'walkthrough', // 'walkthrough' | 'chat-sim' | 'glossary'
    demoRevealedStep: 4,
    // Step 4 Co-pilot Guided Practice sub-state
    practiceMode: 'evaluate', // 'evaluate' | 'offer'
    practiceRole: 'Junior Data Analyst',
    practiceInput: '',
    practiceLoading: false,
    practiceResult: null,
    practiceIsSynthetic: true,
    practiceQuestion: '',
    practiceQaHistory: [],
    // Step 5 User Control Lab sub-state
    controlSuggestions: getInitialControlSuggestions(OnboardingStorage.get('cc_onboarding_persona', 'nour')),
    editingIndex: null,
    clarifyIndex: 0,
    appliedPreviewText: null,
    savedNewCvId: null,
    // Step 7 Feedback sub-state
    feedbackRating: OnboardingStorage.get('cc_onboarding_feedback', ''),
    feedbackComment: '',
    feedbackSubmitted: false,
    lastFocusedElement: null
  };

  if (OB.currentStep < 0 || OB.currentStep >= STEPS.length) {
    OB.currentStep = 0;
  }

  // Initialize practice input from persona
  function syncPracticeWithPersona(personaId, forceReset = false) {
    const p = PERSONAS[personaId] || PERSONAS.nour;
    if (personaId === 'salma') {
      OB.practiceMode = 'offer';
      OB.practiceRole = p.targetRole;
      if (forceReset || !OB.practiceInput) {
        OB.practiceInput = p.sampleOfferText;
        OB.practiceIsSynthetic = true;
      }
    } else {
      OB.practiceMode = 'evaluate';
      OB.practiceRole = p.targetRole;
      if (forceReset || !OB.practiceInput) {
        OB.practiceInput = p.sampleCvText;
        OB.practiceIsSynthetic = true;
      }
    }
    if (forceReset) {
      OB.practiceResult = null;
      OB.controlSuggestions = getInitialControlSuggestions(personaId);
      OB.editingIndex = null;
      OB.clarifyIndex = 0;
      OB.appliedPreviewText = null;
      OB.savedNewCvId = null;
    }
  }
  syncPracticeWithPersona(OB.persona, true);

  function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = String(str ?? '');
    return d.innerHTML;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ACCESSIBILITY MODES (Salma's Low-Vision Support & Screen Reader Live Region)
  // ═══════════════════════════════════════════════════════════════════════════
  function applyAccessibilityModes() {
    document.body.classList.toggle('cc-large-text', OB.largeText);
    document.body.classList.toggle('cc-high-contrast', OB.highContrast);
    OnboardingStorage.set('cc_a11y_large_text', OB.largeText ? 'true' : 'false');
    OnboardingStorage.set('cc_a11y_high_contrast', OB.highContrast ? 'true' : 'false');

    const a11yBtn = document.getElementById('headerA11yBtn');
    if (a11yBtn) {
      const active = OB.largeText || OB.highContrast;
      a11yBtn.setAttribute('aria-pressed', String(active));
      a11yBtn.className = active
        ? 'text-xs font-bold px-2.5 py-1.5 rounded-lg border-2 border-indigo-700 bg-indigo-50 text-indigo-900 flex items-center gap-1 shadow-sm'
        : 'text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1';
    }
  }

  function toggleLargeText() {
    OB.largeText = !OB.largeText;
    applyAccessibilityModes();
    announceToScreenReader(`Large text mode ${OB.largeText ? 'enabled' : 'disabled'}.`);
    if (OB.isOpen) renderOnboarding();
    renderContextualHelpBar();
  }

  function toggleHighContrast() {
    OB.highContrast = !OB.highContrast;
    applyAccessibilityModes();
    announceToScreenReader(`High contrast mode ${OB.highContrast ? 'enabled' : 'disabled'}.`);
    if (OB.isOpen) renderOnboarding();
    renderContextualHelpBar();
  }

  function announceToScreenReader(message) {
    const liveEl = document.getElementById('obAriaLive');
    if (liveEl) {
      liveEl.textContent = '';
      setTimeout(() => {
        liveEl.textContent = message;
      }, 30);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. COMPONENT: OnboardingProgress (Stage Banner + Progress Bar + Step Pills)
  // ═══════════════════════════════════════════════════════════════════════════
  function renderOnboardingProgress(stepObj) {
    const pct = Math.round(((stepObj.index + 1) / STEPS.length) * 100);
    const stages = [
      { num: 1, title: 'Stage 1: The System Does It', desc: 'Observe & Understand', steps: [0, 1, 2] },
      { num: 2, title: 'Stage 2: Co-pilot', desc: 'Guided Practice & Control', steps: [3, 4] },
      { num: 3, title: 'Stage 3: The User Does It', desc: 'Independent Mastery', steps: [5, 6] }
    ];

    return `
      <div class="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 space-y-2.5">
        <!-- 3-Stage Progressive Learning Banner -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2" role="region" aria-label="Three Onboarding Learning Stages">
          ${stages.map(st => {
            const isCurrent = stepObj.stage === st.num;
            const isDone = stepObj.stage > st.num;
            return `
              <button type="button"
                onclick="window.CCOnboarding.goToStep(${st.steps[0]})"
                aria-current="${isCurrent ? 'step' : 'false'}"
                class="text-left rtl:text-right px-3 py-2 rounded-xl border transition-all flex items-center gap-2.5 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm font-bold'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }">
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                  isCurrent ? 'bg-white text-indigo-700' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }">${isDone ? '✓' : st.num}</span>
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-bold truncate">${escHtml(st.title)}</div>
                  <div class="text-[11px] truncate ${isCurrent ? 'text-indigo-100' : 'text-slate-500'}">${escHtml(st.desc)}</div>
                </div>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Accessible Progressbar & Step Pills -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div class="flex items-center gap-2 flex-wrap" role="tablist" aria-label="Onboarding Steps">
            ${STEPS.map(s => {
              const active = s.index === stepObj.index;
              const completed = s.index < stepObj.index;
              return `
                <button type="button"
                  role="tab"
                  aria-selected="${active}"
                  aria-label="Step ${s.index + 1} of ${STEPS.length}: ${escHtml(s.shortTitle)}"
                  onclick="window.CCOnboarding.goToStep(${s.index})"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    active
                      ? 'bg-indigo-100 text-indigo-900 border-indigo-400 font-bold ring-2 ring-indigo-500/20'
                      : completed
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }">
                  ${completed ? '✓ ' : ''}${escHtml(s.shortTitle)}
                </button>
              `;
            }).join('')}
          </div>
          <div class="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span>Step ${stepObj.index + 1} of ${STEPS.length} (${pct}%)</span>
          </div>
        </div>

        <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden"
             role="progressbar"
             aria-valuenow="${stepObj.index + 1}"
             aria-valuemin="1"
             aria-valuemax="${STEPS.length}"
             aria-valuetext="Step ${stepObj.index + 1} of ${STEPS.length}: ${escHtml(stepObj.title)}">
          <div class="h-full bg-indigo-600 transition-all duration-300" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. COMPONENT: WelcomeStep (Step 1 — Welcome, HAI Principle & Personas)
  // ═══════════════════════════════════════════════════════════════════════════
  function renderWelcomeStep() {
    const activePersona = PERSONAS[OB.persona] || PERSONAS.nour;
    return `
      <div class="space-y-6">
        <!-- Hero Banner -->
        <div class="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 text-white rounded-2xl p-6 shadow-md">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="space-y-2 max-w-2xl">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-indigo-100 text-xs font-semibold">
                <span>🎯 CareerCompass AI • Team Head & Hand</span>
                <span>•</span>
                <span>Human-Centered AI (HAI)</span>
              </div>
              <h3 class="text-xl sm:text-2xl font-extrabold leading-tight">
                The AI Guides. You Decide.
              </h3>
              <p class="text-sm text-indigo-100 leading-relaxed">
                Welcome to <strong>CareerCompass AI</strong> — your local, privacy-first AI Career and Interview Coach.
                This interactive 3-stage onboarding shows you how our tools work, helps you practice on a real task, and puts you in complete control of every AI recommendation.
              </p>
            </div>
            <div class="bg-white/10 border border-white/20 rounded-xl p-4 text-xs space-y-1.5 min-w-[220px]">
              <div class="font-bold text-amber-300 uppercase tracking-wider">Core HAI Principle</div>
              <div class="text-sm font-bold text-white">User Control & Agency</div>
              <p class="text-indigo-100 leading-snug">
                AI suggestions are options, never commands. You can accept, edit, reject, question, or undo any suggestion.
              </p>
            </div>
          </div>
        </div>

        <!-- How the 3 Stages Work -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white border-2 border-indigo-200 rounded-2xl p-4 space-y-2 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold">Stage 1</span>
              <span class="text-xs font-semibold text-slate-500">Inform & Explain</span>
            </div>
            <h4 class="font-bold text-slate-900 text-base">1. The System Does It</h4>
            <p class="text-xs text-slate-600 leading-relaxed">
              Watch a clear demonstration using synthetic sample data. See how the system distinguishes <strong>your facts</strong> from <strong>AI suggestions</strong> and explains its reasoning.
            </p>
          </div>

          <div class="bg-white border-2 border-emerald-200 rounded-2xl p-4 space-y-2 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">Stage 2</span>
              <span class="text-xs font-semibold text-slate-500">Explain & Allow Control</span>
            </div>
            <h4 class="font-bold text-slate-900 text-base">2. Co-pilot (Guided Practice)</h4>
            <p class="text-xs text-slate-600 leading-relaxed">
              Try a real workflow with step-by-step guidance. Practice reviewing AI recommendations using <strong>Accept</strong>, <strong>Reject</strong>, <strong>Edit</strong>, <strong>Clarify</strong>, and <strong>Undo</strong> controls.
            </p>
          </div>

          <div class="bg-white border-2 border-amber-200 rounded-2xl p-4 space-y-2 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">Stage 3</span>
              <span class="text-xs font-semibold text-slate-500">Allow Control & Feedback</span>
            </div>
            <h4 class="font-bold text-slate-900 text-base">3. The User Does It</h4>
            <p class="text-xs text-slate-600 leading-relaxed">
              Use all 7 career services and the AI Chatbot independently at your own pace, with optional contextual help and one-click tutorial replay anytime.
            </p>
          </div>
        </div>

        <!-- Persona Tailoring Selector -->
        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 class="font-bold text-slate-900 text-base">Choose an Example Persona Lens (Optional)</h4>
              <p class="text-xs text-slate-600">
                Tailor the tutorial's examples and guidance style to match different career goals and accessibility needs. You can switch personas at any step.
              </p>
            </div>
            <span class="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-900">
              Active Lens: ${escHtml(activePersona.name)}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3" role="radiogroup" aria-label="Select Onboarding Persona">
            ${Object.values(PERSONAS).map(p => {
              const selected = p.id === OB.persona;
              return `
                <button type="button"
                  role="radio"
                  aria-checked="${selected}"
                  onclick="window.CCOnboarding.selectPersona('${p.id}')"
                  class="text-left rtl:text-right p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
                    selected
                      ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white/80 border-slate-200 hover:border-slate-400'
                  }">
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-2xl" aria-hidden="true">${p.avatar}</span>
                      <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }">${selected ? '✓ Selected' : 'Select'}</span>
                    </div>
                    <div class="font-bold text-slate-900 text-sm">${escHtml(p.name)} (${p.age})</div>
                    <div class="text-xs font-semibold text-indigo-700">${escHtml(p.role)}</div>
                    <p class="text-xs text-slate-600 leading-relaxed">${escHtml(p.summary)}</p>
                  </div>
                  <div class="pt-2 border-t border-slate-100 text-[11px] text-slate-700">
                    <strong>Onboarding focus:</strong> ${escHtml(p.adaptationNote)}
                  </div>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Low-Vision Quick Toggle Callout (Especially for Salma) -->
          <div class="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div class="space-y-0.5">
              <div class="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <span>👁️ Low-Vision & Readability Controls (Salma's Accessibility Mode)</span>
              </div>
              <p class="text-xs text-amber-900">
                Need larger fonts or stronger contrast? Toggle <strong>Large Text (A+)</strong> or <strong>High Contrast</strong> anytime from here or the top bar.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button type="button"
                onclick="window.CCOnboarding.toggleLargeText()"
                aria-pressed="${OB.largeText}"
                class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  OB.largeText
                    ? 'bg-indigo-700 text-white border-indigo-800'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                }">
                ${OB.largeText ? '✓ Large Text: ON (A+)' : 'A+ Enable Large Text'}
              </button>
              <button type="button"
                onclick="window.CCOnboarding.toggleHighContrast()"
                aria-pressed="${OB.highContrast}"
                class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  OB.highContrast
                    ? 'bg-slate-900 text-amber-300 border-slate-900'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                }">
                ${OB.highContrast ? '✓ High Contrast: ON' : '◐ High Contrast'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. COMPONENT: ServiceDiscoveryStep (Step 2 — Stage 1: Real Implemented Services)
  // ═══════════════════════════════════════════════════════════════════════════
  function renderServiceDiscoveryStep() {
    const p = PERSONAS[OB.persona] || PERSONAS.nour;
    const services = [
      {
        id: 'cv-create',
        icon: '📄',
        name: '1. CV Creation & Export',
        aiStatus: 'Works with or without AI',
        userProvides: 'Contact details, education, work experience, academic projects, and skills.',
        aiGenerates: 'Optional professional summary & action-verb bullet points based strictly on your real facts. Exports to PDF & DOCX.',
        recommendedFor: ['mostafa', 'nour']
      },
      {
        id: 'cv-eval',
        icon: '📊',
        name: '2. CV Evaluation',
        aiStatus: 'AI-Powered Rubric Analysis',
        userProvides: 'Uploaded PDF/DOCX/TXT CV or pasted CV text.',
        aiGenerates: '7 category scores (1–10), strengths, weaknesses, and prioritized improvement suggestions with reasoning.',
        recommendedFor: ['nour', 'mostafa']
      },
      {
        id: 'cv-opt',
        icon: '✏️',
        name: '3. CV Optimization (With User Control)',
        aiStatus: 'AI Phrasing + User Approval',
        userProvides: 'Your existing CV text and optional target role.',
        aiGenerates: 'Side-by-side Original vs. Suggested rewrites. You Accept, Edit, or Reject each item while preserving your original CV.',
        recommendedFor: ['nour', 'mostafa', 'salma']
      },
      {
        id: 'job-match',
        icon: '🔍',
        name: '4. Job Matching & Gap Check',
        aiStatus: 'AI Evidence Comparison',
        userProvides: 'Your CV + a specific Job Description.',
        aiGenerates: 'Matching qualifications, missing ATS keywords, and a clear distinction between Confirmed Gaps vs. Missing Information.',
        recommendedFor: ['nour', 'mostafa']
      },
      {
        id: 'interview',
        icon: '🎤',
        name: '5. Mock Interviews (STAR Coach)',
        aiStatus: 'Interactive Session + Report',
        userProvides: 'Target role, difficulty, interview type, and your answers to each question.',
        aiGenerates: 'One question at a time, STAR framework evaluation (Situation, Task, Action, Result), retry option, and a final report.',
        recommendedFor: ['nour', 'mostafa']
      },
      {
        id: 'rejection',
        icon: '💔',
        name: '6. Rejection Analysis',
        aiStatus: 'Fact vs. Hypothesis Recovery Plan',
        userProvides: 'Job title, application context, and any recruiter feedback received.',
        aiGenerates: 'Likely factors explicitly labeled as [Fact] or [Hypothesis], plus an immediate, short-term, and long-term action plan.',
        recommendedFor: ['nour', 'mostafa']
      },
      {
        id: 'offer',
        icon: '💼',
        name: '7. Job Offer Review & Negotiation',
        aiStatus: 'Implemented • Career Guidance',
        userProvides: 'Offer letter text or PDF/DOCX (salary, hours, probation, clauses) + your personal priorities.',
        aiGenerates: 'Summary of terms, flagged concerns by severity, clarification questions to ask HR, and a customizable negotiation email draft.',
        recommendedFor: ['salma', 'nour']
      }
    ];

    return `
      <div class="space-y-5">
        <!-- Stage 1 Context Box -->
        <div class="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <div class="text-xs font-bold uppercase tracking-wider text-indigo-800">
              Stage 1: The System Does It • Service Discovery
            </div>
            <p class="text-xs text-slate-700 leading-relaxed">
              CareerCompass AI combines an <strong>AI Career Chatbot</strong> (which can run any tool conversationally) with <strong>7 dedicated workspace pages</strong>.
              Below is what each service does and how <strong>your input</strong> stays distinct from <strong>AI suggestions</strong>.
            </p>
          </div>
          <div class="text-xs bg-white border border-indigo-200 rounded-xl px-3 py-2 text-indigo-900 font-semibold">
            Viewing highlights for: <strong>${escHtml(p.name)}</strong> (${escHtml(p.role)})
          </div>
        </div>

        <!-- Services Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${services.map(srv => {
            const isHighlighted = srv.recommendedFor.includes(OB.persona);
            return `
              <div class="bg-white rounded-2xl border-2 p-4 space-y-2.5 transition-all ${
                isHighlighted ? 'border-indigo-500 shadow-sm' : 'border-slate-200'
              }">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xl" aria-hidden="true">${srv.icon}</span>
                    <h4 class="font-bold text-slate-900 text-sm">${escHtml(srv.name)}</h4>
                  </div>
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    ${isHighlighted ? `<span class="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">★ Key for ${escHtml(p.name)}</span>` : ''}
                    <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">${escHtml(srv.aiStatus)}</span>
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div class="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                    <span class="font-bold text-sky-900 block text-[11px]">👤 What You Provide (User Data)</span>
                    <p class="text-slate-700 mt-0.5 leading-snug">${escHtml(srv.userProvides)}</p>
                  </div>
                  <div class="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                    <span class="font-bold text-indigo-900 block text-[11px]">✨ What AI Generates (Suggestions)</span>
                    <p class="text-slate-700 mt-0.5 leading-snug">${escHtml(srv.aiGenerates)}</p>
                  </div>
                </div>
              </div>
            `;
          }).join('')}

          <!-- Honest Boundaries & Privacy Card -->
          <div class="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5 flex flex-col justify-between">
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-amber-300">🔒 Transparency & Honest Boundaries</span>
                <span class="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold">HAI Inform Principle</span>
              </div>
              <h4 class="font-bold text-sm">What CareerCompass AI Will Never Do</h4>
              <ul class="text-xs text-slate-200 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><strong>No Fabricated Qualifications:</strong> It never invents degrees, jobs, or fake metrics you didn't provide.</li>
                <li><strong>No Automatic Overwrites:</strong> Optimizing a CV saves a snapshot of your original CV first.</li>
                <li><strong>Offer Review Is Career Guidance, Not Legal Advice:</strong> For Salma's offer review scenario, the system highlights contract risks and drafts questions, but never accepts or rejects an offer on your behalf.</li>
                <li><strong>Local Privacy:</strong> All CVs, evaluations, and chats are stored locally in your SQLite database (<code>data/career_coach.db</code>).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. COMPONENT: SystemDemoStep (Step 3 — Stage 1: "The System Does It")
  // ═══════════════════════════════════════════════════════════════════════════
  function renderSystemDemoStep() {
    const p = PERSONAS[OB.persona] || PERSONAS.nour;
    const isSalma = OB.persona === 'salma';
    const isMostafa = OB.persona === 'mostafa';
    const evalData = p.demoEvaluation;

    return `
      <div class="space-y-5">
        <!-- Stage 1 Header & Persona Switcher -->
        <div class="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-indigo-700 text-white text-xs font-bold">Stage 1: The System Does It</span>
              <span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">🧪 100% Synthetic Sample Data</span>
            </div>
            <p class="text-xs text-slate-700 leading-relaxed">
              Watch how CareerCompass AI processes a synthetic example for <strong>${escHtml(p.name)}</strong>.
              Notice how <strong>User-Provided Information</strong> is kept separate from <strong>AI-Generated Suggestions</strong> and how every recommendation includes a transparent reason.
            </p>
          </div>
          <!-- Quick Persona Switcher inside Demo -->
          <div class="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200">
            <span class="text-[11px] font-semibold text-slate-500 px-1.5">Demo Lens:</span>
            ${Object.values(PERSONAS).map(per => `
              <button type="button"
                onclick="window.CCOnboarding.selectPersona('${per.id}')"
                class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  per.id === OB.persona ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }">
                ${per.avatar} ${escHtml(per.name)}
              </button>
            `).join('')}
          </div>
        </div>

        ${isMostafa ? `
          <!-- Mostafa Plain-English Glossary Strip -->
          <div class="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-2">
            <div class="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <span>📖 Simple English Career Glossary (For Mostafa)</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div class="bg-white p-2.5 rounded-xl border border-emerald-200">
                <strong class="text-emerald-900 block">1. Professional Summary</strong>
                <span class="text-slate-700">2–3 sentences at the top of your CV telling employers your degree, main skills, and the job you want.</span>
              </div>
              <div class="bg-white p-2.5 rounded-xl border border-emerald-200">
                <strong class="text-emerald-900 block">2. Action Verbs</strong>
                <span class="text-slate-700">Strong starting words like <em>"Monitored"</em>, <em>"Configured"</em>, or <em>"Built"</em> instead of <em>"I did"</em> or <em>"Used"</em>.</span>
              </div>
              <div class="bg-white p-2.5 rounded-xl border border-emerald-200">
                <strong class="text-emerald-900 block">3. ATS (Applicant Tracking System)</strong>
                <span class="text-slate-700">Software companies use to scan CVs for clear section titles (Education, Skills, Projects) and job keywords.</span>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- 4-Part Synthetic Walkthrough: (1) Sample Input -> (2) Chatbot Interaction -> (3) AI Evaluation -> (4) Recommendation & Why -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

          <!-- LEFT COLUMN: 1. Sample Input & 2. Chatbot Interaction -->
          <div class="space-y-4">
            <!-- 1. Sample Input Card -->
            <div class="bg-white rounded-2xl border-2 border-sky-200 p-4 space-y-2.5 shadow-sm">
              <div class="flex items-center justify-between gap-2">
                <span class="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 text-xs font-bold">
                  1. 👤 User-Provided Information (Synthetic Input)
                </span>
                <span class="text-[11px] font-semibold text-slate-500">Fictional Example Only</span>
              </div>
              <p class="text-xs text-slate-600">
                ${isSalma
                  ? 'Salma pastes a fictional Junior Web Developer job offer to check its terms and risks:'
                  : `${escHtml(p.name)} provides a fictional CV excerpt for a ${escHtml(p.targetRole)} role:`}
              </p>
              <pre class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 overflow-x-auto max-h-48 leading-relaxed">${escHtml(isSalma ? p.sampleOfferText : p.sampleCvText)}</pre>
            </div>

            <!-- 2. How the User Interacts with the Chatbot -->
            <div class="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-800">2. 💬 Example Chatbot Interaction</span>
                <span class="text-[11px] text-slate-500">Natural Language + Tool Execution</span>
              </div>

              <div class="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <!-- User Message -->
                <div class="flex justify-end">
                  <div class="bg-indigo-600 text-white text-xs rounded-2xl rounded-br-sm px-3.5 py-2.5 max-w-[85%] leading-relaxed">
                    <div class="text-[10px] font-bold text-indigo-200 uppercase mb-0.5">👤 User (${escHtml(p.name)})</div>
                    ${isSalma
                      ? 'I received this Junior Web Developer job offer. Can you review the terms, explain any risks in plain language, and suggest questions I should ask HR before I decide?'
                      : isMostafa
                      ? 'Here is my draft CV for an entry-level Cybersecurity internship. Please evaluate it and tell me how to describe my university lab projects in clear English.'
                      : 'Please evaluate my attached CV for a Junior Data Analyst position and explain how I can strengthen my experience section.'}
                  </div>
                </div>

                <!-- AI Response -->
                <div class="flex items-start gap-2.5">
                  <div class="w-7 h-7 rounded-xl bg-indigo-700 text-white text-xs flex items-center justify-center flex-shrink-0 mt-1" aria-hidden="true">🎯</div>
                  <div class="bg-white border border-slate-200 text-slate-800 text-xs rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex-1 leading-relaxed space-y-1.5">
                    <div class="text-[10px] font-bold text-indigo-700 uppercase">🤖 CareerCompass AI Response (Suggestion)</div>
                    <p>
                      ${isSalma
                        ? 'I have analyzed your job offer terms below. While the hybrid schedule and React/Node.js stack match your profile, I flagged <strong>3 contract clauses</strong> (including the 6-month probation period and unpaid weekend support) that you may want to clarify or negotiate. <strong>You remain in full control of whether to accept, negotiate, or decline this offer.</strong>'
                        : isMostafa
                        ? 'I evaluated your CV! Your university lab projects with <strong>Wireshark</strong> and <strong>Linux iptables</strong> are great for an entry-level cybersecurity internship. Below, I scored each section and suggested clearer English action verbs using only your real lab work—nothing is changed unless you approve it.'
                        : 'I have completed a 7-criteria evaluation of your CV. Your academic background and data toolkit (Python, SQL, Power BI) are strong, but your internship bullets understate your technical work. Review the scores and optional recommendations below.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: 3. Example Evaluation/Analysis & 4. Recommendation + Why It Was Generated -->
          <div class="space-y-4">
            ${isSalma ? `
              <!-- Salma Offer Review Demonstration -->
              <div class="bg-white rounded-2xl border-2 border-indigo-200 p-4 space-y-3 shadow-sm">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold">
                    3. ✨ AI Offer Analysis (Structured Output)
                  </span>
                  <span class="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Supports Your Decision</span>
                </div>
                <p class="text-xs text-slate-700 leading-relaxed">
                  <strong>Compensation:</strong> ${escHtml(p.demoOfferReview.summary.salary)} • <strong>Schedule:</strong> ${escHtml(p.demoOfferReview.summary.working_arrangements)}
                </p>
                <div class="space-y-2">
                  <div class="text-xs font-bold text-slate-800">⚠️ Identified Contract Concerns:</div>
                  ${p.demoOfferReview.analysis.concerns.map(c => `
                    <div class="p-2.5 rounded-xl border text-xs ${
                      c.severity === 'high' ? 'bg-red-50 border-red-200 text-slate-900' : 'bg-amber-50 border-amber-200 text-slate-900'
                    }">
                      <div class="flex items-center justify-between">
                        <span class="font-bold">${escHtml(c.term)}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.severity === 'high' ? 'bg-red-200 text-red-950' : 'bg-amber-200 text-amber-950'
                        }">⚠ ${escHtml(c.severity)} severity</span>
                      </div>
                      <p class="mt-1 leading-relaxed">${escHtml(c.concern)}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : `
              <!-- CV Evaluation Demonstration (Nour & Mostafa) -->
              <div class="bg-white rounded-2xl border-2 border-indigo-200 p-4 space-y-3 shadow-sm">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold">
                    3. 📊 Example AI Evaluation Report
                  </span>
                  <span class="text-sm font-extrabold text-indigo-700">Overall: 7.6 / 10</span>
                </div>
                <p class="text-xs text-slate-700 leading-relaxed">${escHtml(evalData.overall_assessment)}</p>
                <div class="grid grid-cols-2 gap-2">
                  ${Object.entries(evalData.scores).slice(0, 4).map(([k, v]) => `
                    <div class="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div class="flex justify-between text-[11px] font-bold text-slate-800">
                        <span class="capitalize">${escHtml(k.replace(/_/g, ' '))}</span>
                        <span>${v.score}/10</span>
                      </div>
                      <div class="score-bar"><div class="score-fill ${v.score >= 8 ? 'bg-emerald-600' : 'bg-amber-500'}" style="width:${v.score * 10}%"></div></div>
                      <p class="text-[11px] text-slate-600 leading-snug">${escHtml(v.explanation)}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            `}

            <!-- 4. Sample Recommendation & Why It Was Generated -->
            <div class="bg-amber-50/90 rounded-2xl border-2 border-amber-300 p-4 space-y-2.5 shadow-sm">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 text-xs font-bold">
                  4. 💡 Sample Recommendation & Why It Was Generated
                </span>
                <span class="text-[11px] font-bold text-amber-900">HAI Explain Principle</span>
              </div>

              <div class="bg-white rounded-xl p-3 border border-amber-200 space-y-2 text-xs">
                <div class="font-bold text-slate-900">
                  🤖 AI Recommendation:
                  <span class="text-indigo-800 font-semibold">
                    "${escHtml(evalData.improvements[0].suggestion)}"
                  </span>
                </div>
                <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                  <strong class="text-slate-900 block mb-0.5">🔍 Why the system generated this recommendation:</strong>
                  ${escHtml(evalData.improvements[0].reasoning)}
                </div>
                <div class="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span class="px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-semibold">👤 User Fact Preserved: Real tools & projects only</span>
                  <span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-semibold">✨ AI Suggestion: Optional phrasing improvement</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. COMPONENT: GuidedPracticeStep (Step 4 — Stage 2: "Co-pilot")
  // ═══════════════════════════════════════════════════════════════════════════
  function renderGuidedPracticeStep() {
    const p = PERSONAS[OB.persona] || PERSONAS.nour;
    const isOfferMode = OB.practiceMode === 'offer';

    return `
      <div class="space-y-5">
        <!-- Stage 2 Banner & First Appearance of User Control Principle -->
        <div class="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-xs font-bold">Stage 2: Co-pilot (Guided Practice)</span>
              <span class="px-2.5 py-0.5 rounded-full bg-white text-emerald-900 border border-emerald-300 text-xs font-bold">HAI Principle: Explain & Allow Control</span>
            </div>
            <!-- Switch Practice Task -->
            <div class="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-emerald-200 text-xs">
              <button type="button"
                onclick="window.CCOnboarding.setPracticeMode('evaluate')"
                class="px-2.5 py-1 rounded-lg font-bold transition-all ${!isOfferMode ? 'bg-emerald-700 text-white' : 'text-slate-700 hover:bg-slate-100'}">
                📊 Practice CV Evaluation
              </button>
              <button type="button"
                onclick="window.CCOnboarding.setPracticeMode('offer')"
                class="px-2.5 py-1 rounded-lg font-bold transition-all ${isOfferMode ? 'bg-emerald-700 text-white' : 'text-slate-700 hover:bg-slate-100'}">
                💼 Practice Offer Review (Salma)
              </button>
            </div>
          </div>
          <p class="text-xs text-slate-800 leading-relaxed font-medium">
            🧭 <strong>Co-pilot Guidance:</strong> Try a real supported feature right here! Follow the numbered steps below.
            <em>"AI can help you explore options and improve your work, but you remain in control of every important decision."</em>
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <!-- LEFT 7 COLS: Real Guided Task Input & Execution -->
          <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 class="font-bold text-slate-900 text-sm">
                  ${isOfferMode ? 'Guided Task: Review a Job Offer (/api/offer/review)' : 'Guided Task: Evaluate a CV (/api/evaluate)'}
                </h4>
                <p class="text-xs text-slate-500">
                  Connected to the real CareerCompass AI workflow. Upload your own file, edit the text, or test with synthetic sample data.
                </p>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${
                OB.practiceIsSynthetic ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-sky-100 text-sky-900 border border-sky-300'
              }">
                ${OB.practiceIsSynthetic ? '🧪 Using Synthetic Sample Data' : '👤 Using Your Custom/Uploaded Data'}
              </span>
            </div>

            <!-- Guided Step A: Target Role / Priorities -->
            <div class="space-y-1.5">
              <label for="obPracticeRoleInput" class="block text-xs font-bold text-slate-800">
                Step A — ${isOfferMode ? 'Specify Your Personal Priorities (What matters most to you?)' : 'Specify Target Job Role (Helps contextualize feedback)'}
              </label>
              <input id="obPracticeRoleInput"
                type="text"
                value="${escHtml(OB.practiceRole)}"
                oninput="window.CCOnboarding.updatePracticeRole(this.value)"
                placeholder="${isOfferMode ? 'e.g. Fair hours, 3-month probation, hybrid flexibility' : 'e.g. Junior Data Analyst, Junior SOC Analyst'}"
                class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600" />
            </div>

            <!-- Guided Step B: Upload or Edit Input -->
            <div class="space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <label for="obPracticeTextInput" class="block text-xs font-bold text-slate-800">
                  Step B — ${isOfferMode ? 'Provide or Correct Offer Details (Required)' : 'Provide or Correct CV Text (Required)'}
                </label>
                <div class="flex items-center gap-2">
                  <label class="cursor-pointer px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-semibold">
                    📎 Upload PDF/DOCX/TXT
                    <input type="file" class="hidden" accept=".pdf,.docx,.doc,.txt" onchange="window.CCOnboarding.handlePracticeUpload(event)" />
                  </label>
                  <button type="button"
                    onclick="window.CCOnboarding.loadSyntheticSample()"
                    class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                    🔄 Reset to ${escHtml(p.name)}'s Sample
                  </button>
                </div>
              </div>
              <textarea id="obPracticeTextInput"
                rows="7"
                oninput="window.CCOnboarding.updatePracticeInput(this.value)"
                placeholder="${isOfferMode ? 'Paste job offer terms here...' : 'Paste CV content here...'}"
                class="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono leading-relaxed focus:ring-2 focus:ring-indigo-600">${escHtml(OB.practiceInput)}</textarea>
              <p class="text-[11px] text-slate-500">
                💡 <strong>You can edit or correct any line above</strong> before running the analysis.
              </p>
            </div>

            <!-- Guided Step C: Run Analysis -->
            <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button type="button"
                id="obRunPracticeBtn"
                onclick="window.CCOnboarding.runGuidedPractice()"
                ${OB.practiceLoading ? 'disabled' : ''}
                class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2">
                <span>${OB.practiceLoading ? '⏳ Running Real Analysis…' : (isOfferMode ? '▶ Step C: Run Offer Review Now' : '▶ Step C: Run CV Evaluation Now')}</span>
              </button>
              <button type="button"
                onclick="window.CCOnboarding.openServicePageDirectly('${isOfferMode ? 'offer' : 'cv-eval'}')"
                class="text-xs text-indigo-700 hover:underline font-semibold">
                ↗ Or open full ${isOfferMode ? 'Offer Review' : 'Evaluate CV'} page in background
              </button>
            </div>

            <!-- Guided Step D: Results Explanation -->
            <div id="obPracticeResultsContainer" class="pt-2">
              ${renderGuidedPracticeResults()}
            </div>
          </div>

          <!-- RIGHT 5 COLS: Contextual Instructions & Non-Interruptive Co-pilot Help Q&A -->
          <div class="lg:col-span-5 space-y-4">
            <!-- Contextual Checklist -->
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 class="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span>🗺️ Co-pilot Step-by-Step Guide</span>
              </h4>
              <ol class="text-xs text-slate-700 space-y-2 list-decimal pl-4 leading-relaxed">
                <li>
                  <strong>Check Target Role / Priorities:</strong> Tell the system what role or priorities you are aiming for so feedback is relevant.
                </li>
                <li>
                  <strong>Review or Upload Input:</strong> Use the pre-filled <em>Synthetic Sample Data</em> for ${escHtml(p.name)}, edit any line to correct information, or upload your own PDF/DOCX file.
                </li>
                <li>
                  <strong>Run the Evaluation:</strong> Click <strong>Run</strong> to call the CareerCompass AI backend and see scores, strengths, and recommendations.
                </li>
                <li>
                  <strong>Exercise Your Agency:</strong> Read the reasoning behind each suggestion. In the next step (Step 5), you will practice accepting, editing, or rejecting individual suggestions!
                </li>
              </ol>
            </div>

            <!-- Interactive Co-pilot Clarification Q&A (Ask Questions Without Leaving Workflow) -->
            <div class="bg-white border-2 border-indigo-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-indigo-950 text-sm">❓ Ask Co-pilot a Question (Instant Help)</h4>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900">Non-Interruptive</span>
              </div>
              <p class="text-xs text-slate-600">
                Have a question about how evaluation works or what a term means? Click a question below or type your own:
              </p>

              <div class="flex flex-wrap gap-1.5">
                ${[
                  'How are CV scores calculated?',
                  'Will AI invent skills I do not have?',
                  'What does ATS compatibility mean?',
                  'Does Offer Review replace a lawyer?'
                ].map(q => `
                  <button type="button"
                    onclick="window.CCOnboarding.askCopilotQuestion('${escHtml(q)}')"
                    class="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 text-left">
                    💬 ${escHtml(q)}
                  </button>
                `).join('')}
              </div>

              <div class="flex gap-2">
                <input id="obCopilotQuestionInput"
                  type="text"
                  placeholder="Ask a question about this step…"
                  onkeydown="if(event.key==='Enter'){event.preventDefault();window.CCOnboarding.askCopilotQuestion(this.value);}"
                  class="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 text-xs" />
                <button type="button"
                  onclick="window.CCOnboarding.askCopilotQuestion(document.getElementById('obCopilotQuestionInput').value)"
                  class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">
                  Ask
                </button>
              </div>

              <div id="obCopilotQaLog" class="space-y-2 max-h-48 overflow-y-auto">
                ${OB.practiceQaHistory.length === 0 ? `
                  <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                    💡 <strong>Tip:</strong> Ask any question above — your work in the practice form on the left will not be interrupted or lost.
                  </div>
                ` : OB.practiceQaHistory.map(item => `
                  <div class="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs space-y-1">
                    <div class="font-bold text-indigo-950">Q: ${escHtml(item.q)}</div>
                    <div class="text-slate-800 leading-relaxed"><strong>Co-pilot:</strong> ${escHtml(item.a)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderGuidedPracticeResults() {
    if (OB.practiceLoading) {
      return `
        <div class="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-3">
          <div class="flex gap-1"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
          <span><strong>Co-pilot is analyzing your input…</strong> Generating structured evaluation and reasoning.</span>
        </div>
      `;
    }
    if (!OB.practiceResult) {
      return `
        <div class="p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600">
          👆 Click <strong>"${OB.practiceMode === 'offer' ? 'Step C: Run Offer Review Now' : 'Step C: Run CV Evaluation Now'}"</strong> above to see your live results and Co-pilot explanation here.
        </div>
      `;
    }

    const res = OB.practiceResult;
    if (res.mode === 'offer') {
      const d = res.data;
      const concerns = d.analysis?.concerns || [];
      const questions = d.analysis?.questions_to_ask || [];
      return `
        <div class="bg-emerald-50/60 border-2 border-emerald-300 rounded-2xl p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-bold text-sm text-emerald-950">✅ Offer Review Complete (${res.sourceLabel})</span>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">You Decide How to Proceed</span>
          </div>
          <p class="text-xs text-slate-800 leading-relaxed">
            <strong>Co-pilot Explanation:</strong> The system summarized the offer terms (${escHtml(d.summary?.salary || 'Salary reviewed')}) and identified <strong>${concerns.length} potential concern(s)</strong> and <strong>${questions.length} clarification question(s)</strong> you can ask the employer.
          </p>
          <div class="space-y-2">
            ${concerns.slice(0, 3).map(c => `
              <div class="p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                <span class="font-bold text-slate-900">${escHtml(c.term)}</span>
                <span class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${c.severity === 'high' ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-900'}">${escHtml(c.severity || 'medium')}</span>
                <p class="text-slate-700 mt-1">${escHtml(c.concern)}</p>
              </div>
            `).join('')}
          </div>
          ${questions.length ? `
            <div class="p-2.5 bg-white rounded-xl border border-indigo-200 text-xs space-y-1">
              <div class="font-bold text-indigo-900">💬 Suggested Clarification Questions for HR:</div>
              ${questions.slice(0, 3).map(q => `<p class="text-slate-700">• ${escHtml(q)}</p>`).join('')}
            </div>
          ` : ''}
          <div class="p-2.5 bg-indigo-900 text-white rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
            <span>🎯 <strong>Next:</strong> Practice accepting, editing, or rejecting AI recommendations in Step 5!</span>
            <button type="button" onclick="window.CCOnboarding.nextStep()" class="px-3 py-1 bg-white text-indigo-900 rounded-lg font-bold">
              Go to Step 5: User Control Lab →
            </button>
          </div>
        </div>
      `;
    }

    // CV Evaluation result
    const d = res.data;
    const scores = d.scores || {};
    const scoreEntries = Object.entries(scores);
    const avg = scoreEntries.reduce((acc, [, v]) => acc + (v.score || 0), 0) / Math.max(scoreEntries.length, 1);
    const improvements = d.improvements || [];

    return `
      <div class="bg-emerald-50/60 border-2 border-emerald-300 rounded-2xl p-4 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-bold text-sm text-emerald-950">✅ CV Evaluation Complete (${res.sourceLabel})</span>
          <span class="text-base font-extrabold text-indigo-700">Score: ${avg.toFixed(1)} / 10</span>
        </div>
        <p class="text-xs text-slate-800 leading-relaxed">
          <strong>Co-pilot Explanation:</strong> ${escHtml(d.overall_assessment || '')}
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          ${scoreEntries.slice(0, 6).map(([k, v]) => `
            <div class="p-2 bg-white rounded-lg border border-slate-200 text-xs">
              <div class="flex justify-between font-bold text-slate-800 text-[11px]">
                <span class="capitalize truncate">${escHtml(k.replace(/_/g, ' '))}</span>
                <span>${v.score}/10</span>
              </div>
              <div class="score-bar mt-1"><div class="score-fill ${v.score >= 8 ? 'bg-emerald-600' : v.score >= 6 ? 'bg-amber-500' : 'bg-red-500'}" style="width:${(v.score || 5) * 10}%"></div></div>
            </div>
          `).join('')}
        </div>
        ${improvements.length ? `
          <div class="space-y-1.5">
            <div class="text-xs font-bold text-indigo-950">🎯 Key Recommendations (Optional — You Decide What to Keep):</div>
            ${improvements.slice(0, 2).map(imp => `
              <div class="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                <div class="font-bold text-slate-900">[${escHtml(imp.area || 'Section')}] ${escHtml(imp.suggestion || '')}</div>
                ${imp.reasoning ? `<div class="text-[11px] text-slate-600"><strong>Why:</strong> ${escHtml(imp.reasoning)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div class="p-2.5 bg-indigo-900 text-white rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
          <span>🎯 <strong>Ready to exercise control?</strong> Try accepting, editing, or rejecting recommendations in Step 5!</span>
          <button type="button" onclick="window.CCOnboarding.nextStep()" class="px-3 py-1 bg-white text-indigo-900 rounded-lg font-bold">
            Continue to Step 5: User Control Lab →
          </button>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. COMPONENT: UserControlStep (Step 5 — Core Feature: User Control & Agency)
  // ═══════════════════════════════════════════════════════════════════════════
  function renderUserControlStep() {
    const p = PERSONAS[OB.persona] || PERSONAS.nour;
    const suggestions = OB.controlSuggestions || [];
    const counts = {
      accepted: suggestions.filter(s => s.status === 'accepted').length,
      edited: suggestions.filter(s => s.status === 'edited').length,
      rejected: suggestions.filter(s => s.status === 'rejected').length,
      pending: suggestions.filter(s => s.status === 'pending').length
    };

    // Build live preview of final controlled output
    const previewLines = suggestions.map((s, idx) => {
      if (s.status === 'accepted') {
        return `✓ [Item ${idx + 1} — ACCEPTED AI SUGGESTION]\n${s.suggested}`;
      }
      if (s.status === 'edited') {
        return `✏️ [Item ${idx + 1} — USER-EDITED VERSION]\n${s.user_edited_text || s.suggested}`;
      }
      if (s.status === 'rejected') {
        return `✕ [Item ${idx + 1} — REJECTED (ORIGINAL KEPT)]\n${s.original}`;
      }
      return `⏳ [Item ${idx + 1} — PENDING REVIEW (ORIGINAL KEPT BY DEFAULT)]\n${s.original}`;
    }).join('\n\n');

    return `
      <div class="space-y-5">
        <!-- Core HAI Principle Banner -->
        <div class="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold uppercase">
              Core Feature • User Control and Agency
            </span>
            <div class="flex items-center gap-1.5">
              ${Object.values(PERSONAS).map(per => `
                <button type="button"
                  onclick="window.CCOnboarding.selectPersona('${per.id}')"
                  class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    per.id === OB.persona ? 'bg-white text-indigo-950' : 'bg-white/10 text-white hover:bg-white/20'
                  }">
                  ${per.avatar} ${escHtml(per.name)}
                </button>
              `).join('')}
            </div>
          </div>
          <h4 class="text-base sm:text-lg font-extrabold text-amber-300">
            "AI can help you explore options and improve your work, but you remain in control of every important decision."
          </h4>
          <p class="text-xs text-slate-200 leading-relaxed">
            Below are 3 AI-generated recommendations for <strong>${escHtml(p.name)}</strong> (including highlighting Python/SQL, cybersecurity lab projects, or job offer clauses).
            Test all <strong>6 working User Control actions</strong>: <strong>Accept</strong>, <strong>Reject</strong>, <strong>Edit</strong>, <strong>Request Clarification</strong>, <strong>Request Revision</strong>, and <strong>Undo / Reset</strong>.
          </p>
        </div>

        <!-- Status Summary Bar & Global Undo -->
        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-bold text-slate-800">Your Decisions So Far:</span>
            <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold">✓ Accepted: ${counts.accepted}</span>
            <span class="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 font-bold">✏️ Edited: ${counts.edited}</span>
            <span class="px-2.5 py-1 rounded-full bg-red-100 text-red-900 font-bold">✕ Rejected: ${counts.rejected}</span>
            <span class="px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-bold">⏳ Pending: ${counts.pending}</span>
          </div>
          <div class="flex items-center gap-2">
            <button type="button"
              onclick="window.CCOnboarding.resetAllControlSuggestions()"
              class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold">
              ↩ Undo All / Reset to Original
            </button>
          </div>
        </div>

        <!-- Suggestions + Live Controlled Output Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <!-- Left 7 Cols: Interactive Suggestion Cards -->
          <div class="lg:col-span-7 space-y-3.5">
            ${suggestions.map((s, idx) => {
              const isEditing = OB.editingIndex === idx;
              const isClarifying = OB.clarifyIndex === idx;
              const statusBadge =
                s.status === 'accepted'
                  ? `<span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold">✓ Accepted</span>`
                  : s.status === 'edited'
                  ? `<span class="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 text-xs font-bold">✏️ Edited by You</span>`
                  : s.status === 'rejected'
                  ? `<span class="px-2.5 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300 text-xs font-bold">✕ Rejected (Original Kept)</span>`
                  : `<span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold">⏳ Pending Your Decision</span>`;

              const activeSuggestedText = s.user_edited_text || s.suggested;

              return `
                <div class="bg-white rounded-2xl border-2 p-4 space-y-3 shadow-sm transition-all ${
                  s.status === 'accepted' || s.status === 'edited'
                    ? 'border-emerald-500'
                    : s.status === 'rejected'
                    ? 'border-red-300 bg-slate-50/60'
                    : 'border-slate-200'
                }">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-xs font-extrabold uppercase tracking-wide text-slate-700">
                      #${idx + 1} • ${escHtml(s.section)}
                    </span>
                    ${statusBadge}
                  </div>

                  <!-- Original vs AI Suggested Comparison -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div class="p-3 rounded-xl bg-sky-50/80 border border-sky-200 space-y-1">
                      <span class="text-[11px] font-bold text-sky-950 block">👤 Your Original Text</span>
                      <p class="text-slate-800 leading-relaxed">${escHtml(s.original)}</p>
                    </div>
                    <div class="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                      <span class="text-[11px] font-bold text-emerald-950 block">
                        ${s.status === 'edited' ? '✏️ Your Custom Edited Version' : '✨ AI Suggested Improvement'}
                      </span>
                      <p class="text-slate-900 font-medium leading-relaxed">${escHtml(activeSuggestedText)}</p>
                    </div>
                  </div>

                  <!-- Short Reason -->
                  <p class="text-xs text-slate-600">
                    <strong>Reason:</strong> ${escHtml(s.reason)}
                  </p>

                  <!-- Optional Clarification Box -->
                  ${isClarifying ? `
                    <div class="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-slate-800 space-y-1">
                      <div class="font-bold text-amber-950 flex items-center justify-between">
                        <span>🔍 Clarification & Evidence Check</span>
                        <button type="button" onclick="window.CCOnboarding.toggleClarify(${idx})" class="text-slate-500 hover:text-slate-800 font-bold">✕ Close</button>
                      </div>
                      <p class="leading-relaxed">${escHtml(s.clarification)}</p>
                    </div>
                  ` : ''}

                  <!-- Optional Edit Box -->
                  ${isEditing ? `
                    <div class="p-3 rounded-xl bg-indigo-50 border border-indigo-300 space-y-2 text-xs">
                      <label for="obControlEditInput_${idx}" class="font-bold text-indigo-950 block">
                        ✏️ Edit this recommendation in your own words:
                      </label>
                      <textarea id="obControlEditInput_${idx}" rows="3"
                        class="w-full border border-indigo-300 rounded-lg p-2 text-xs text-slate-900 bg-white">${escHtml(activeSuggestedText)}</textarea>
                      <div class="flex justify-end gap-2">
                        <button type="button"
                          onclick="window.CCOnboarding.cancelEditSuggestion()"
                          class="px-3 py-1 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700">
                          Cancel
                        </button>
                        <button type="button"
                          onclick="window.CCOnboarding.saveEditSuggestion(${idx})"
                          class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
                          ✓ Save My Edit & Accept
                        </button>
                      </div>
                    </div>
                  ` : ''}

                  <!-- 6 Working User Control Action Buttons -->
                  <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <!-- Left: Clarify & Request Revision -->
                    <div class="flex flex-wrap items-center gap-1.5">
                      <button type="button"
                        onclick="window.CCOnboarding.toggleClarify(${idx})"
                        aria-label="Request clarification for suggestion ${idx + 1}"
                        class="px-2.5 py-1 rounded-lg text-xs font-semibold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950">
                        💬 Why? (Clarify)
                      </button>
                      <div class="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                        <span class="px-1.5 font-semibold text-slate-600">🔄 Revise Tone:</span>
                        <button type="button" onclick="window.CCOnboarding.reviseSuggestion(${idx}, 'simple')" class="px-2 py-0.5 rounded hover:bg-white font-semibold text-slate-800" title="Simple English">Simple</button>
                        <button type="button" onclick="window.CCOnboarding.reviseSuggestion(${idx}, 'action')" class="px-2 py-0.5 rounded hover:bg-white font-semibold text-slate-800" title="Action-Oriented">Action</button>
                        <button type="button" onclick="window.CCOnboarding.reviseSuggestion(${idx}, 'concise')" class="px-2 py-0.5 rounded hover:bg-white font-semibold text-slate-800" title="Short & Concise">Concise</button>
                      </div>
                    </div>

                    <!-- Right: Undo, Reject, Edit, Accept -->
                    <div class="flex flex-wrap items-center gap-1.5">
                      ${s.status !== 'pending' ? `
                        <button type="button"
                          onclick="window.CCOnboarding.setSuggestionStatus(${idx}, 'pending')"
                          aria-label="Undo decision for suggestion ${idx + 1}"
                          class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300">
                          ↩ Undo
                        </button>
                      ` : ''}
                      <button type="button"
                        onclick="window.CCOnboarding.setSuggestionStatus(${idx}, 'rejected')"
                        aria-label="Reject suggestion ${idx + 1}"
                        class="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 text-red-800 border border-red-200">
                        ✕ Reject
                      </button>
                      <button type="button"
                        onclick="window.CCOnboarding.openEditSuggestion(${idx})"
                        aria-label="Edit suggestion ${idx + 1}"
                        class="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200">
                        ✏️ Edit
                      </button>
                      <button type="button"
                        onclick="window.CCOnboarding.setSuggestionStatus(${idx}, 'accepted')"
                        aria-label="Accept suggestion ${idx + 1}"
                        class="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                        ✓ Accept
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Right 5 Cols: Live Controlled Result Preview & Apply to Real Backend -->
          <div class="lg:col-span-5 space-y-4 sticky top-2">
            <div class="bg-white rounded-2xl border-2 border-slate-300 p-4 space-y-3 shadow-sm">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-slate-900 text-sm">📄 Your Final Controlled Document Preview</h4>
                <span class="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Live Preview</span>
              </div>
              <p class="text-xs text-slate-600">
                Only items you <strong>Accept</strong> or <strong>Edit</strong> are applied. Items left <strong>Pending</strong> or <strong>Rejected</strong> preserve your original wording.
              </p>
              <textarea readonly rows="10" aria-label="Controlled document preview"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 leading-relaxed">${escHtml(previewLines)}</textarea>

              <div class="flex flex-wrap gap-2">
                <button type="button"
                  onclick="window.CCOnboarding.applyControlledChangesToBackend()"
                  class="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow">
                  ✨ Apply My Approved Changes (/api/optimize/apply)
                </button>
                <button type="button"
                  onclick="navigator.clipboard.writeText(${JSON.stringify(previewLines)}).then(()=>window.toast&&window.toast('Copied controlled output!','success'))"
                  class="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300">
                  📋 Copy
                </button>
              </div>

              ${OB.appliedPreviewText ? `
                <div class="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 space-y-1">
                  <div class="font-bold">✅ Applied & Verified via Backend (/api/optimize/apply)!</div>
                  <p>Your original version was preserved while generating your customized revision.</p>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. COMPONENT: IndependentUseStep (Step 6 — Stage 3: "The User Does It")
  // ═══════════════════════════════════════════════════════════════════════════
  function renderIndependentUseStep() {
    const quickLaunchCards = [
      { page: 'chat', icon: '💬', title: 'AI Career Chat Coach', desc: 'Ask questions in English or Arabic, attach a CV, or run any service conversationally.' },
      { page: 'cv-create', icon: '📄', title: 'Create & Export CV', desc: 'Build a CV with live preview, 3 templates, AI summary/bullets, and PDF/DOCX export.' },
      { page: 'cv-eval', icon: '📊', title: 'Evaluate CV', desc: 'Get a 7-dimension quality rubric, strengths, weaknesses, and prioritized improvements.' },
      { page: 'cv-opt', icon: '✏️', title: 'Optimize CV (User Control)', desc: 'Review side-by-side phrasing suggestions with Accept, Edit, and Reject controls.' },
      { page: 'job-match', icon: '🔍', title: 'Job Match Analysis', desc: 'Compare your CV against a job posting to find confirmed gaps and missing keywords.' },
      { page: 'interview', icon: '🎤', title: 'Mock Interview Practice', desc: 'Practice behavioral or technical interviews with STAR feedback and retry support.' },
      { page: 'rejection', icon: '💔', title: 'Rejection Analysis', desc: 'Separate facts from hypotheses and build a structured recovery plan.' },
      { page: 'offer', icon: '💼', title: 'Job Offer Review', desc: 'Analyze salary, probation, and contract clauses, and generate negotiation scripts.' }
    ];

    return `
      <div class="space-y-5">
        <div class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-amber-800 text-white text-xs font-bold">Stage 3: The User Does It</span>
            <span class="text-xs font-bold text-amber-950">HAI Principle: Allow Control & Enable Feedback</span>
          </div>
          <h4 class="font-bold text-slate-900 text-sm">
            Transitioning from Guided Practice to Full Independence
          </h4>
          <p class="text-xs text-slate-700 leading-relaxed">
            You now know how CareerCompass AI works and how to control its outputs. When you close this tutorial:
          </p>
          <ul class="text-xs text-slate-700 list-disc pl-5 space-y-1">
            <li><strong>No Interruptions:</strong> The tutorial will not pop up again automatically once completed or skipped.</li>
            <li><strong>Non-Intrusive Contextual Help:</strong> Every page includes a collapsible <strong>💡 Page Guide & Sample Loader</strong> bar that you can show or hide anytime.</li>
            <li><strong>Always Accessible:</strong> Click the <strong>🎓 Guide & Help</strong> button in the top navigation bar whenever you want to replay the tutorial or toggle Low-Vision Accessibility modes.</li>
          </ul>
        </div>

        <!-- Contextual Help Preference Toggle -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-0.5">
            <div class="font-bold text-sm text-slate-900">💡 In-App Contextual Co-pilot Tips</div>
            <p class="text-xs text-slate-600">
              Show a non-intrusive helper bar at the top of service pages with quick tips and 1-click synthetic demo data.
            </p>
          </div>
          <button type="button"
            onclick="window.CCOnboarding.toggleContextualTips()"
            aria-pressed="${OB.showContextualTips}"
            class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              OB.showContextualTips
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }">
            ${OB.showContextualTips ? '✓ Contextual Tips: Enabled' : 'Contextual Tips: Hidden'}
          </button>
        </div>

        <!-- Jump Directly to Any Real Application Feature -->
        <div class="space-y-2.5">
          <h4 class="font-bold text-slate-900 text-sm">Explore Any Feature Independently (Click to Open Directly):</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${quickLaunchCards.map(c => `
              <button type="button"
                onclick="window.CCOnboarding.finishAndGoTo('${c.page}')"
                class="bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-400 rounded-2xl p-3.5 text-left rtl:text-right transition-all shadow-sm flex flex-col justify-between gap-2">
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-xl" aria-hidden="true">${c.icon}</span>
                    <span class="text-[11px] font-bold text-indigo-700">Open →</span>
                  </div>
                  <div class="font-bold text-slate-900 text-xs">${escHtml(c.title)}</div>
                  <p class="text-[11px] text-slate-600 leading-snug">${escHtml(c.desc)}</p>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. COMPONENT: CompletionStep (Step 7 — Stage 3 Completion & Feedback)
  // ═══════════════════════════════════════════════════════════════════════════
  function renderCompletionStep() {
    return `
      <div class="space-y-6 text-center py-4 max-w-3xl mx-auto">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-indigo-600 text-white text-3xl flex items-center justify-center mx-auto shadow-lg" aria-hidden="true">
          🎓
        </div>

        <div class="space-y-2">
          <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold uppercase tracking-wide">
            Onboarding Complete • All 3 Stages Mastered
          </span>
          <h3 class="text-2xl sm:text-3xl font-extrabold text-slate-900">
            "You're ready to take control of your career journey!"
          </h3>
          <p class="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Remember our core principle: <strong>The AI guides. The user decides.</strong>
            Use CareerCompass AI to draft, evaluate, optimize, practice interviews, and review offers — while keeping full authority over your career decisions.
          </p>
        </div>

        <!-- 3-Stage Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left rtl:text-right">
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <div class="text-xs font-bold text-emerald-800">✓ Stage 1: The System Does It</div>
            <p class="text-xs text-slate-600">Observed how the AI analyzes synthetic inputs and explains its reasoning transparently.</p>
          </div>
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <div class="text-xs font-bold text-emerald-800">✓ Stage 2: Co-pilot & Control</div>
            <p class="text-xs text-slate-600">Practiced real workflows and exercised Accept, Edit, Reject, Clarify, Revise, and Undo controls.</p>
          </div>
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <div class="text-xs font-bold text-emerald-800">✓ Stage 3: The User Does It</div>
            <p class="text-xs text-slate-600">Ready for independent use with optional page guides, low-vision accessibility, and 1-click replay.</p>
          </div>
        </div>

        <!-- HAI Principle: Enable Feedback Widget -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 max-w-xl mx-auto space-y-3 text-left rtl:text-right shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-800">💬 Quick Onboarding Feedback (HAI Enable Feedback Principle)</span>
            <span class="text-[11px] text-slate-500">Optional</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs text-slate-600">How clear and helpful was this tutorial?</span>
            ${[
              { val: 'very_helpful', label: '👍 Very Clear & Helpful' },
              { val: 'somewhat_helpful', label: '👌 Good, Got the Basics' },
              { val: 'needs_improvement', label: '💡 Could Be Simpler' }
            ].map(opt => `
              <button type="button"
                onclick="window.CCOnboarding.saveFeedback('${opt.val}')"
                aria-pressed="${OB.feedbackRating === opt.val}"
                class="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  OB.feedbackRating === opt.val
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }">
                ${opt.label}
              </button>
            `).join('')}
          </div>
          ${OB.feedbackRating ? `
            <p class="text-xs text-emerald-800 font-semibold">
              ✓ Thank you! Your feedback preference has been recorded locally.
            </p>
          ` : ''}
        </div>

        <!-- Primary Action Buttons -->
        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button type="button"
            onclick="window.CCOnboarding.finishAndGoTo('chat')"
            class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-extrabold shadow-lg transition-all">
            🚀 Start Using CareerCompass AI Now
          </button>
          <button type="button"
            onclick="window.CCOnboarding.finishAndGoTo(OB.persona === 'salma' ? 'offer' : OB.persona === 'mostafa' ? 'cv-create' : 'cv-eval')"
            class="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow transition-all">
            ${OB.persona === 'salma' ? '💼 Open Job Offer Review' : OB.persona === 'mostafa' ? '📄 Open CV Builder' : '📊 Open CV Evaluation'}
          </button>
          <button type="button"
            onclick="window.CCOnboarding.restartTutorial()"
            class="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold">
            🔄 Replay Tutorial from Step 1
          </button>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. COMPONENT: OnboardingNavigation (Footer Controls)
  // ═══════════════════════════════════════════════════════════════════════════
  function renderOnboardingNavigation(stepObj) {
    const isFirst = stepObj.index === 0;
    const isLast = stepObj.index === STEPS.length - 1;

    return `
      <div class="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <!-- Left Controls: Skip & Replay -->
        <div class="flex items-center gap-2">
          ${!isLast ? `
            <button type="button"
              onclick="window.CCOnboarding.skipTutorial()"
              aria-label="Skip onboarding tutorial and use the application immediately"
              class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-200/70 border border-slate-300 bg-white">
              ⏭ Skip Tutorial (Use App Now)
            </button>
          ` : ''}
          ${stepObj.index > 0 ? `
            <button type="button"
              onclick="window.CCOnboarding.restartTutorial()"
              aria-label="Restart tutorial from Step 1"
              class="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60">
              🔄 Restart
            </button>
          ` : ''}
        </div>

        <!-- Center HAI Reminder -->
        <div class="hidden xl:block text-xs text-slate-500 font-medium">
          🎯 <strong>HAI Principle:</strong> The AI guides. The user decides. (Press <kbd class="px-1.5 py-0.5 bg-white border rounded text-[10px]">Esc</kbd> to close anytime)
        </div>

        <!-- Right Controls: Back & Next / Finish -->
        <div class="flex items-center gap-2.5">
          <button type="button"
            onclick="window.CCOnboarding.prevStep()"
            ${isFirst ? 'disabled' : ''}
            aria-label="Go to previous onboarding step"
            class="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none">
            ← Back
          </button>

          ${!isLast ? `
            <button type="button"
              id="obPrimaryNextBtn"
              onclick="window.CCOnboarding.nextStep()"
              aria-label="Go to next onboarding step: ${escHtml(STEPS[stepObj.index + 1]?.shortTitle || 'Next')}"
              class="px-5 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
              Next: ${escHtml(STEPS[stepObj.index + 1]?.shortTitle || 'Continue')} →
            </button>
          ` : `
            <button type="button"
              id="obPrimaryFinishBtn"
              onclick="window.CCOnboarding.finishAndGoTo('chat')"
              aria-label="Finish onboarding and launch CareerCompass AI"
              class="px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
              ✓ Finish & Launch App
            </button>
          `}
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. COMPONENT: OnboardingContainer (Modal Renderer & Event Wiring)
  // ═══════════════════════════════════════════════════════════════════════════
  function renderStepBody(stepObj) {
    switch (stepObj.id) {
      case 'welcome':
        return renderWelcomeStep();
      case 'discovery':
        return renderServiceDiscoveryStep();
      case 'system-demo':
        return renderSystemDemoStep();
      case 'guided-practice':
        return renderGuidedPracticeStep();
      case 'user-control':
        return renderUserControlStep();
      case 'independent-use':
        return renderIndependentUseStep();
      case 'completion':
        return renderCompletionStep();
      default:
        return renderWelcomeStep();
    }
  }

  function renderOnboarding() {
    const modal = document.getElementById('onboardingModal');
    if (!modal) return;

    if (!OB.isOpen) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      return;
    }

    const stepObj = STEPS[OB.currentStep] || STEPS[0];
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl border-2 border-slate-300 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden"
           role="document">
        <!-- Modal Top Header -->
        <div class="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-500 text-white flex items-center justify-center text-base font-bold flex-shrink-0" aria-hidden="true">
              🎯
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span id="onboardingStageDesc" class="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                  ${escHtml(stepObj.stageLabel)} • ${escHtml(stepObj.stagePrinciple)}
                </span>
              </div>
              <h2 id="onboardingTitle" tabindex="-1" class="text-base sm:text-lg font-extrabold text-slate-900 truncate focus:outline-none">
                ${escHtml(stepObj.title)}
              </h2>
            </div>
          </div>

          <!-- Header Right Accessibility & Close Controls -->
          <div class="flex items-center gap-2">
            <button type="button"
              onclick="window.CCOnboarding.toggleLargeText()"
              aria-pressed="${OB.largeText}"
              aria-label="Toggle large text mode for low-vision accessibility"
              class="px-2.5 py-1 rounded-lg text-xs font-bold border ${
                OB.largeText ? 'bg-indigo-700 text-white border-indigo-800' : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
              }">
              A+ ${OB.largeText ? 'Large Text ON' : 'Large Text'}
            </button>
            <button type="button"
              onclick="window.CCOnboarding.toggleHighContrast()"
              aria-pressed="${OB.highContrast}"
              aria-label="Toggle high contrast mode for low-vision accessibility"
              class="px-2.5 py-1 rounded-lg text-xs font-bold border ${
                OB.highContrast ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
              }">
              ◐ ${OB.highContrast ? 'High Contrast ON' : 'Contrast'}
            </button>
            <button type="button"
              onclick="window.CCOnboarding.skipTutorial()"
              aria-label="Close and skip tutorial"
              title="Close tutorial (Escape)"
              class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 font-bold text-sm flex items-center justify-center">
              ✕
            </button>
          </div>
        </div>

        <!-- Progress Component -->
        ${renderOnboardingProgress(stepObj)}

        <!-- Step Main Scrollable Body -->
        <div id="onboardingStepBody" class="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40">
          ${renderStepBody(stepObj)}
        </div>

        <!-- Navigation Footer Component -->
        ${renderOnboardingNavigation(stepObj)}
      </div>
    `;

    updateHeaderStatusButton();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. COMPONENT: ContextualHelpBar (In-App Stage 2/3 Co-pilot Banner)
  // ═══════════════════════════════════════════════════════════════════════════
  const PAGE_GUIDES = {
    'chat': {
      title: 'AI Career Chat Coach',
      whatToDo: 'Type any career request in English or Arabic, or attach a PDF/DOCX CV using the 📎 button.',
      haiTip: 'The chatbot uses real tools (Evaluate, Optimize, Match, Interview, Offer Review) and shows structured cards so you can verify every suggestion.',
      hasSample: true,
      sampleLabel: 'Load Sample Chat Prompt'
    },
    'cv-create': {
      title: 'Create & Export CV',
      whatToDo: 'Fill in your contact info, experience, education, projects, and skills, or click "Load Synthetic Sample CV" to test live preview and PDF/DOCX export.',
      haiTip: 'Click "✨ AI Generate Summary" or "✨ AI Bullets" for optional phrasing ideas — you can edit every word in the form before saving or exporting.',
      hasSample: true,
      sampleLabel: 'Fill Sample CV Form'
    },
    'cv-opt': {
      title: 'Optimize CV (User Control & Agency)',
      whatToDo: 'Select a saved CV, upload a file, or paste your CV text, then click "Analyze & Optimize".',
      haiTip: 'Review each suggestion individually: click Accept, Edit, or Reject. Applying changes creates a new optimized CV while preserving your original CV.',
      hasSample: true,
      sampleLabel: 'Fill Sample CV to Optimize'
    },
    'cv-eval': {
      title: 'Evaluate CV',
      whatToDo: 'Paste your CV or upload a PDF/DOCX to receive a 7-dimension quality rubric and prioritized improvements.',
      haiTip: 'Scores are qualitative indicators to guide your revisions, not automated hiring predictions.',
      hasSample: true,
      sampleLabel: 'Fill Sample CV to Evaluate'
    },
    'job-match': {
      title: 'Job Match & Gap Analysis',
      whatToDo: 'Provide both your CV and a target Job Description to compare qualifications and keywords.',
      haiTip: 'The system distinguishes Confirmed Gaps from Missing Info and never fabricates qualifications you do not have.',
      hasSample: true,
      sampleLabel: 'Fill Sample CV + Job Description'
    },
    'interview': {
      title: 'Interactive Mock Interview',
      whatToDo: 'Enter your target role, choose Behavioral or Technical, and practice answering one question at a time.',
      haiTip: 'After each answer, review the STAR evaluation, retry the question to improve, or advance to the next question.',
      hasSample: true,
      sampleLabel: 'Fill Sample Interview Setup'
    },
    'rejection': {
      title: 'Job Rejection Analysis',
      whatToDo: 'Enter the role and application/interview details to understand likely factors and build a recovery plan.',
      haiTip: 'Each factor is explicitly labeled as a [Fact] or [Hypothesis] so inferences are never presented as certainties.',
      hasSample: true,
      sampleLabel: 'Fill Sample Rejection Scenario'
    },
    'offer': {
      title: 'Job Offer Review & Negotiation Guide (Salma Scenario)',
      whatToDo: 'Paste your job offer terms (or upload the offer letter) and list your personal priorities.',
      haiTip: 'CareerCompass AI highlights positive terms, flags risks by severity, and drafts negotiation questions — you make the final decision.',
      hasSample: true,
      sampleLabel: "Fill Salma's Sample Job Offer"
    }
  };

  function getActivePageId() {
    const activeSec = document.querySelector('.page-section.active');
    if (!activeSec || !activeSec.id) return 'chat';
    return activeSec.id.replace(/^page-/, '');
  }

  function renderContextualHelpBar() {
    const bar = document.getElementById('contextualHelpBar');
    if (!bar) return;

    const pageId = getActivePageId();
    const guide = PAGE_GUIDES[pageId] || PAGE_GUIDES['chat'];
    const p = PERSONAS[OB.persona] || PERSONAS.nour;

    if (!OB.showContextualTips) {
      bar.innerHTML = `
        <div class="bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-2">
            <span>🧭 <strong>${escHtml(guide.title)}</strong> — Remember: <em>The AI guides. The user decides.</em></span>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.CCOnboarding.toggleContextualTips()" class="text-indigo-700 hover:underline font-semibold">
              💡 Show Page Guide
            </button>
            <span>•</span>
            <button type="button" onclick="window.CCOnboarding.openTutorial()" class="text-indigo-700 hover:underline font-semibold">
              🎓 Open Tutorial
            </button>
          </div>
        </div>
      `;
      return;
    }

    bar.innerHTML = `
      <div class="bg-indigo-50/90 border-b border-indigo-200 px-4 py-2.5 text-xs">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div class="space-y-0.5 flex-1 min-w-[260px]">
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-indigo-700 text-white font-bold text-[11px]">💡 Co-pilot Page Guide: ${escHtml(guide.title)}</span>
              <span class="text-slate-700 font-medium">${escHtml(guide.whatToDo)}</span>
            </div>
            <div class="text-indigo-950">
              <strong>🛡️ User Control & Agency:</strong> ${escHtml(guide.haiTip)}
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            ${guide.hasSample ? `
              <button type="button"
                onclick="window.CCOnboarding.fillPageSample('${pageId}')"
                class="px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg font-bold shadow-sm">
                🧪 ${escHtml(guide.sampleLabel)} (${escHtml(p.name)})
              </button>
            ` : ''}
            <button type="button"
              onclick="window.CCOnboarding.openTutorial()"
              class="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
              🎓 Tutorial (${OB.status === 'completed' ? 'Replay' : `Step ${OB.currentStep + 1}/${STEPS.length}`})
            </button>
            <button type="button"
              onclick="window.CCOnboarding.toggleContextualTips()"
              aria-label="Hide contextual page guide"
              title="Minimize guide"
              class="px-2 py-1 text-slate-500 hover:text-slate-800 font-bold">
              Hide ✕
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function updateHeaderStatusButton() {
    const btn = document.getElementById('onboardingTriggerBtn');
    if (!btn) return;
    if (OB.status === 'completed') {
      btn.innerHTML = `🎓 <span>Replay Tutorial</span>`;
      btn.title = 'Replay the 3-stage interactive onboarding tutorial';
    } else if (OB.status === 'skipped' || OB.status === 'in_progress') {
      btn.innerHTML = `🎓 <span>Resume Tutorial (${OB.currentStep + 1}/${STEPS.length})</span>`;
      btn.title = 'Resume or restart the interactive onboarding tutorial';
    } else {
      btn.innerHTML = `🎓 <span>Tutorial & Help</span>`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. INTERACTIVE CONTROLLER ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  const Controller = {
    openTutorial(stepIndex = null) {
      OB.lastFocusedElement = document.activeElement;
      if (typeof stepIndex === 'number' && stepIndex >= 0 && stepIndex < STEPS.length) {
        OB.currentStep = stepIndex;
      }
      OB.isOpen = true;
      if (!OB.status) {
        OB.status = 'in_progress';
        OnboardingStorage.set('cc_onboarding_status', 'in_progress');
      }
      OnboardingStorage.set('cc_onboarding_step', OB.currentStep);
      renderOnboarding();
      const s = STEPS[OB.currentStep];
      announceToScreenReader(`${s.stageLabel}, Step ${s.index + 1} of ${STEPS.length}: ${s.title}`);
      setTimeout(() => {
        document.getElementById('onboardingTitle')?.focus();
      }, 50);
    },

    restartTutorial() {
      OB.currentStep = 0;
      OB.status = 'in_progress';
      OnboardingStorage.set('cc_onboarding_status', 'in_progress');
      OnboardingStorage.set('cc_onboarding_step', '0');
      syncPracticeWithPersona(OB.persona, true);
      this.openTutorial(0);
      if (window.toast) window.toast('Tutorial restarted from Stage 1 (Step 1 of 7).', 'info');
    },

    skipTutorial() {
      OB.isOpen = false;
      if (OB.status !== 'completed') {
        OB.status = 'skipped';
        OnboardingStorage.set('cc_onboarding_status', 'skipped');
      }
      OnboardingStorage.set('cc_onboarding_step', OB.currentStep);
      renderOnboarding();
      updateHeaderStatusButton();
      renderContextualHelpBar();
      announceToScreenReader('Onboarding skipped. You can resume or replay it anytime from the Tutorial & Help button in the top navigation bar.');
      if (window.toast) window.toast('Onboarding paused. Click "🎓 Resume Tutorial" in the top bar anytime!', 'info');
      setTimeout(() => {
        (document.getElementById('onboardingTriggerBtn') || OB.lastFocusedElement)?.focus();
      }, 50);
    },

    finishAndGoTo(pageId = 'chat') {
      OB.isOpen = false;
      OB.status = 'completed';
      OB.currentStep = STEPS.length - 1;
      OnboardingStorage.set('cc_onboarding_status', 'completed');
      OnboardingStorage.set('cc_onboarding_step', String(STEPS.length - 1));
      renderOnboarding();
      updateHeaderStatusButton();
      if (typeof window.showPage === 'function' && pageId) {
        window.showPage(pageId);
      }
      renderContextualHelpBar();
      announceToScreenReader('Onboarding completed! You are now in the main CareerCompass AI application.');
      if (window.toast) window.toast("You're ready to take control of your career journey!", 'success');
      setTimeout(() => {
        document.getElementById('onboardingTriggerBtn')?.focus();
      }, 50);
    },

    nextStep() {
      if (OB.currentStep < STEPS.length - 1) {
        OB.currentStep += 1;
        OnboardingStorage.set('cc_onboarding_step', OB.currentStep);
        if (OB.currentStep === STEPS.length - 1) {
          OB.status = 'completed';
          OnboardingStorage.set('cc_onboarding_status', 'completed');
        }
        renderOnboarding();
        const s = STEPS[OB.currentStep];
        announceToScreenReader(`${s.stageLabel}, Step ${s.index + 1} of ${STEPS.length}: ${s.title}`);
        setTimeout(() => {
          document.getElementById('onboardingTitle')?.focus();
        }, 40);
      }
    },

    prevStep() {
      if (OB.currentStep > 0) {
        OB.currentStep -= 1;
        OnboardingStorage.set('cc_onboarding_step', OB.currentStep);
        renderOnboarding();
        const s = STEPS[OB.currentStep];
        announceToScreenReader(`${s.stageLabel}, Step ${s.index + 1} of ${STEPS.length}: ${s.title}`);
        setTimeout(() => {
          document.getElementById('onboardingTitle')?.focus();
        }, 40);
      }
    },

    goToStep(idx) {
      if (idx >= 0 && idx < STEPS.length) {
        OB.currentStep = idx;
        OnboardingStorage.set('cc_onboarding_step', OB.currentStep);
        renderOnboarding();
        const s = STEPS[OB.currentStep];
        announceToScreenReader(`${s.stageLabel}, Step ${s.index + 1} of ${STEPS.length}: ${s.title}`);
        setTimeout(() => {
          document.getElementById('onboardingTitle')?.focus();
        }, 40);
      }
    },

    selectPersona(personaId) {
      if (!PERSONAS[personaId]) return;
      OB.persona = personaId;
      OnboardingStorage.set('cc_onboarding_persona', personaId);
      syncPracticeWithPersona(personaId, true);
      if (personaId === 'salma' && !OB.largeText) {
        // Automatically offer or enable comfortable reading if Salma is chosen
      }
      renderOnboarding();
      renderContextualHelpBar();
      announceToScreenReader(`Selected persona lens: ${PERSONAS[personaId].name} (${PERSONAS[personaId].role}).`);
    },

    toggleLargeText,
    toggleHighContrast,

    toggleContextualTips() {
      OB.showContextualTips = !OB.showContextualTips;
      OnboardingStorage.set('cc_contextual_tips', OB.showContextualTips ? 'true' : 'false');
      if (OB.isOpen) renderOnboarding();
      renderContextualHelpBar();
    },

    // ── Step 4: Co-pilot Guided Practice Actions ──
    setPracticeMode(mode) {
      OB.practiceMode = mode === 'offer' ? 'offer' : 'evaluate';
      const p = PERSONAS[OB.persona] || PERSONAS.nour;
      if (OB.practiceMode === 'offer') {
        OB.practiceRole = PERSONAS.salma.samplePriorities;
        OB.practiceInput = PERSONAS.salma.sampleOfferText;
      } else {
        OB.practiceRole = p.targetRole;
        OB.practiceInput = p.sampleCvText;
      }
      OB.practiceIsSynthetic = true;
      OB.practiceResult = null;
      renderOnboarding();
    },

    updatePracticeRole(val) {
      OB.practiceRole = val;
    },

    updatePracticeInput(val) {
      OB.practiceInput = val;
      OB.practiceIsSynthetic = val.includes('[SYNTHETIC SAMPLE');
    },

    loadSyntheticSample() {
      const p = PERSONAS[OB.persona] || PERSONAS.nour;
      if (OB.practiceMode === 'offer') {
        OB.practiceRole = PERSONAS.salma.samplePriorities;
        OB.practiceInput = PERSONAS.salma.sampleOfferText;
      } else {
        OB.practiceRole = p.targetRole;
        OB.practiceInput = p.sampleCvText;
      }
      OB.practiceIsSynthetic = true;
      OB.practiceResult = null;
      renderOnboarding();
      if (window.toast) window.toast(`Loaded synthetic sample data for ${p.name}`, 'info');
    },

    async handlePracticeUpload(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (window.toast) window.toast(`Uploading ${file.name} via /api/upload…`, 'info');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('purpose', 'onboarding_practice');
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.extracted_text) {
          OB.practiceInput = data.extracted_text;
          OB.practiceIsSynthetic = false;
          renderOnboarding();
          if (window.toast) window.toast(`Extracted ${data.extracted_text.length} characters from ${file.name}`, 'success');
        } else {
          if (window.toast) window.toast(data.error || 'Could not extract file text', 'error');
        }
      } catch (err) {
        if (window.toast) window.toast('Upload failed', 'error');
      }
      event.target.value = '';
    },

    async runGuidedPractice() {
      const text = (OB.practiceInput || '').trim();
      if (!text) {
        if (window.toast) window.toast('Please provide or load sample text first.', 'error');
        return;
      }
      OB.practiceLoading = true;
      renderOnboarding();
      announceToScreenReader('Running guided analysis...');

      const p = PERSONAS[OB.persona] || PERSONAS.nour;
      try {
        if (OB.practiceMode === 'offer') {
          const resp = await fetch('/api/offer/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offer_details: text,
              user_priorities: OB.practiceRole,
              job_title: 'Junior Web Developer',
              company: 'Horizon Digital Solutions',
              language: (window.S && window.S.lang) || 'en'
            })
          });
          const json = await resp.json();
          if (resp.ok && json.success && json.data) {
            OB.practiceResult = { mode: 'offer', data: json.data, sourceLabel: 'Live AI API (/api/offer/review)' };
          } else {
            // Transparent fallback using Salma's structured evaluation if API key is rate-limited
            OB.practiceResult = { mode: 'offer', data: PERSONAS.salma.demoOfferReview, sourceLabel: 'Verified Sample Analysis' };
          }
        } else {
          const resp = await fetch('/api/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cv_text: text,
              target_role: OB.practiceRole,
              language: (window.S && window.S.lang) || 'en'
            })
          });
          const json = await resp.json();
          if (resp.ok && json.success && json.data) {
            OB.practiceResult = { mode: 'evaluate', data: json.data, sourceLabel: 'Live AI API (/api/evaluate)' };
          } else {
            OB.practiceResult = { mode: 'evaluate', data: p.demoEvaluation, sourceLabel: 'Verified Sample Evaluation' };
          }
        }
      } catch (e) {
        OB.practiceResult = OB.practiceMode === 'offer'
          ? { mode: 'offer', data: PERSONAS.salma.demoOfferReview, sourceLabel: 'Verified Sample Analysis' }
          : { mode: 'evaluate', data: p.demoEvaluation, sourceLabel: 'Verified Sample Evaluation' };
      }

      OB.practiceLoading = false;
      renderOnboarding();
      announceToScreenReader('Analysis complete. Review your results and Co-pilot explanation.');
    },

    askCopilotQuestion(qText) {
      const q = (qText || '').trim();
      if (!q) return;
      const lower = q.toLowerCase();
      let answer = '';
      if (lower.includes('score') || lower.includes('calculat')) {
        answer = 'Scores (1–10) evaluate 7 specific areas: Summary, Education, Experience, Skills, Projects, Readability, and ATS keywords. They are qualitative coaching indicators to help you prioritize edits—never automated hiring predictions.';
      } else if (lower.includes('invent') || lower.includes('fabricat') || lower.includes('fake') || lower.includes('add skill')) {
        answer = 'No. CareerCompass AI is strictly instructed never to invent degrees, jobs, or skills you did not provide. Furthermore, in Step 5 you can edit or reject any phrasing suggestion before it touches your CV.';
      } else if (lower.includes('ats')) {
        answer = 'ATS (Applicant Tracking System) refers to software employers use to scan CVs for standard headings (like Experience, Education, Skills) and role keywords. Using clear headings and matching terminology helps your CV pass initial screening.';
      } else if (lower.includes('lawyer') || lower.includes('legal') || lower.includes('offer')) {
        answer = 'Job Offer Review provides general career guidance—highlighting unclear clauses, probation length, and negotiation talking points. It is not formal legal advice, and you always decide whether to accept, negotiate, or decline an offer.';
      } else {
        answer = 'In Stage 2 (Co-pilot), you can edit any input in the text box on the left, run the real evaluation, and then move to Step 5 to accept, edit, or reject individual AI suggestions.';
      }
      OB.practiceQaHistory.unshift({ q, a: answer });
      renderOnboarding();
      announceToScreenReader(`Co-pilot answered: ${answer}`);
    },

    openServicePageDirectly(pageId) {
      const text = OB.practiceInput || '';
      OB.isOpen = false;
      renderOnboarding();
      if (typeof window.showPage === 'function') {
        window.showPage(pageId);
      }
      if (pageId === 'cv-eval') {
        const el = document.getElementById('evalCvText');
        if (el) el.value = text;
      } else if (pageId === 'offer') {
        const el = document.getElementById('offDetails');
        if (el) el.value = text;
      }
      renderContextualHelpBar();
      if (window.toast) window.toast('Pre-filled service page! Click "🎓 Resume Tutorial" in the top bar anytime.', 'info');
    },

    // ── Step 5: User Control & Agency Lab Actions ──
    setSuggestionStatus(idx, status) {
      const s = OB.controlSuggestions[idx];
      if (!s) return;
      s.status = status;
      if (status === 'pending' || status === 'rejected') {
        s.user_edited_text = null;
      }
      OB.editingIndex = null;
      renderOnboarding();
      announceToScreenReader(`Suggestion ${idx + 1} marked as ${status}.`);
      if (window.toast) {
        const msg = status === 'accepted' ? `Accepted suggestion #${idx + 1}` : status === 'rejected' ? `Rejected suggestion #${idx + 1} (original kept)` : `Reset suggestion #${idx + 1} to pending`;
        window.toast(msg, status === 'accepted' ? 'success' : 'info');
      }
    },

    openEditSuggestion(idx) {
      OB.editingIndex = OB.editingIndex === idx ? null : idx;
      renderOnboarding();
      if (OB.editingIndex !== null) {
        setTimeout(() => {
          document.getElementById(`obControlEditInput_${idx}`)?.focus();
        }, 40);
      }
    },

    cancelEditSuggestion() {
      OB.editingIndex = null;
      renderOnboarding();
    },

    saveEditSuggestion(idx) {
      const inp = document.getElementById(`obControlEditInput_${idx}`);
      const s = OB.controlSuggestions[idx];
      if (!inp || !s) return;
      const val = inp.value.trim();
      if (!val) return;
      s.user_edited_text = val;
      s.status = 'edited';
      OB.editingIndex = null;
      renderOnboarding();
      announceToScreenReader(`Saved your custom edit for suggestion ${idx + 1}.`);
      if (window.toast) window.toast(`Saved your custom edit for #${idx + 1}!`, 'success');
    },

    toggleClarify(idx) {
      OB.clarifyIndex = OB.clarifyIndex === idx ? null : idx;
      renderOnboarding();
    },

    reviseSuggestion(idx, tone) {
      const s = OB.controlSuggestions[idx];
      if (!s || !s.revisions || !s.revisions[tone]) return;
      s.suggested = s.revisions[tone];
      s.user_edited_text = null;
      s.status = 'pending';
      renderOnboarding();
      announceToScreenReader(`Revised suggestion ${idx + 1} to ${tone} style. Review and decide whether to accept, edit, or reject.`);
      if (window.toast) window.toast(`Revised #${idx + 1} to "${tone}" style — review before accepting!`, 'info');
    },

    resetAllControlSuggestions() {
      OB.controlSuggestions = getInitialControlSuggestions(OB.persona);
      OB.editingIndex = null;
      OB.appliedPreviewText = null;
      renderOnboarding();
      announceToScreenReader('All suggestions reset to original pending state.');
      if (window.toast) window.toast('All decisions undone — restored original wording.', 'info');
    },

    async applyControlledChangesToBackend() {
      const suggestions = OB.controlSuggestions || [];
      const originalText = suggestions.map(s => s.original).join('\n\n');
      try {
        const resp = await fetch('/api/optimize/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            original_cv_text: originalText,
            suggestions: suggestions.map(s => ({
              section: s.section,
              original: s.original,
              suggested: s.suggested,
              user_edited_text: s.user_edited_text,
              status: s.status
            }))
          })
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
          OB.appliedPreviewText = data.revised_cv_text;
          renderOnboarding();
          announceToScreenReader(`Applied ${data.applied_count} approved changes while preserving original text.`);
          if (window.toast) window.toast(`Applied ${data.applied_count} approved change(s) via /api/optimize/apply!`, 'success');
        }
      } catch (e) {
        OB.appliedPreviewText = 'Applied locally.';
        renderOnboarding();
      }
    },

    // ── Step 7: Feedback Action ──
    saveFeedback(rating) {
      OB.feedbackRating = rating;
      OnboardingStorage.set('cc_onboarding_feedback', rating);
      renderOnboarding();
      announceToScreenReader('Thank you for your feedback on the onboarding tutorial.');
    },

    // ── In-App 1-Click Synthetic Sample Loader for Any Service Page ──
    fillPageSample(pageId) {
      const p = PERSONAS[OB.persona] || PERSONAS.nour;
      if (pageId === 'chat') {
        const inp = document.getElementById('chatInput');
        if (inp) {
          inp.value = OB.persona === 'salma'
            ? `Please review this Junior Web Developer job offer and highlight any risks or questions I should ask HR:\n\n${PERSONAS.salma.sampleOfferText}`
            : `Please evaluate this synthetic CV for a ${p.targetRole} role:\n\n${p.sampleCvText}`;
          inp.focus();
        }
      } else if (pageId === 'cv-create') {
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
        if (OB.persona === 'mostafa') {
          setVal('cvName', 'Mostafa Mahmoud (Synthetic Sample)');
          setVal('cvTargetRole', 'Junior Cybersecurity Analyst / SOC Intern');
          setVal('cvEmail', 'mostafa.sample@example.com');
          setVal('cvPhone', '+20 101 000 0000');
          setVal('cvLocation', 'Alexandria, Egypt');
          setVal('cvSummary', 'Detail-oriented IT graduate with hands-on academic lab experience in Linux administration, Wireshark packet analysis, and firewall configuration.');
          setVal('cvSkills', 'Linux, Wireshark, TCP/IP Networking, Firewalls (iptables), Basic Python, OWASP Top 10');
          if (window.S) {
            window.S.educations = [{ degree: 'B.Sc. in Information Technology', institution: 'Alexandria University', date: '2021 – 2025', details: 'Graduation Project: Network Intrusion Detection Lab' }];
            window.S.projects = [{ name: 'Network Packet Analyzer & Firewall Lab', technologies: 'Wireshark, Linux iptables', link: '', description: 'Monitored virtual lab network traffic and configured firewall rules to block unauthorized port scans.' }];
            window.S.experiences = [];
          }
        } else {
          setVal('cvName', 'Nour Hassan (Synthetic Sample)');
          setVal('cvTargetRole', 'Junior Data Analyst');
          setVal('cvEmail', 'nour.sample@example.com');
          setVal('cvPhone', '+20 100 000 0000');
          setVal('cvLocation', 'Cairo, Egypt');
          setVal('cvSummary', 'Analytical Computer Science graduate (GPA 3.4/4.0) skilled in Python (Pandas), SQL querying, and Power BI dashboarding.');
          setVal('cvSkills', 'Python, SQL, Pandas, Power BI, Excel, Data Cleaning, Data Visualization');
          if (window.S) {
            window.S.experiences = [{ title: 'Data Intern', company: 'SmartRetail Analytics', date: 'Jul 2025 – Oct 2025', description: '• Cleaned retail sales datasets using Python (Pandas)\n• Extracted customer metrics via SQL and built weekly Power BI dashboards' }];
            window.S.educations = [{ degree: 'B.Sc. in Computer Science (GPA 3.4/4.0)', institution: 'Cairo University', date: '2021 – 2025', details: '' }];
            window.S.projects = [{ name: 'Customer Churn Analysis', technologies: 'Python, Pandas, Scikit-learn', link: '', description: 'Analyzed 5,000+ telecom records to identify key churn indicators.' }];
          }
        }
        if (typeof window.renderExpList === 'function') window.renderExpList();
        if (typeof window.renderEduList === 'function') window.renderEduList();
        if (typeof window.renderProjList === 'function') window.renderProjList();
        if (typeof window.livePreview === 'function') window.livePreview();
      } else if (pageId === 'cv-opt') {
        const el = document.getElementById('optCvText');
        const roleEl = document.getElementById('optTargetRole');
        if (el) el.value = p.sampleCvText;
        if (roleEl) roleEl.value = p.targetRole;
      } else if (pageId === 'cv-eval') {
        const el = document.getElementById('evalCvText');
        if (el) el.value = p.sampleCvText;
      } else if (pageId === 'job-match') {
        const cvEl = document.getElementById('matchCv');
        const jobEl = document.getElementById('matchJob');
        if (cvEl) cvEl.value = p.sampleCvText;
        if (jobEl) {
          jobEl.value = `[SYNTHETIC SAMPLE JOB DESCRIPTION — ${p.targetRole.toUpperCase()}]\nWe are seeking a ${p.targetRole} with strong fundamentals in SQL, Python (Pandas), data cleaning, and dashboard reporting (Power BI or Tableau). Candidates should have a degree in Computer Science or IT and experience working with structured datasets.`;
        }
      } else if (pageId === 'interview') {
        const roleEl = document.getElementById('intRole');
        const indEl = document.getElementById('intIndustry');
        if (roleEl) roleEl.value = p.targetRole;
        if (indEl) indEl.value = OB.persona === 'mostafa' ? 'Cybersecurity & IT' : 'Data & Analytics';
      } else if (pageId === 'rejection') {
        const jobEl = document.getElementById('rejJob');
        const compEl = document.getElementById('rejCompany');
        const detEl = document.getElementById('rejDetails');
        const fbEl = document.getElementById('rejFeedback');
        if (jobEl) jobEl.value = p.targetRole;
        if (compEl) compEl.value = 'TechNova Analytics (Synthetic)';
        if (detEl) detEl.value = 'Completed first-round HR screen and technical SQL/Python assessment; rejected after behavioral interview.';
        if (fbEl) fbEl.value = 'Recruiter mentioned other candidates gave more structured examples of project outcomes.';
      } else if (pageId === 'offer') {
        const roleEl = document.getElementById('offRole');
        const compEl = document.getElementById('offCompany');
        const detEl = document.getElementById('offDetails');
        const priEl = document.getElementById('offPriorities');
        if (roleEl) roleEl.value = 'Junior Web Developer';
        if (compEl) compEl.value = 'Horizon Digital Solutions (Synthetic)';
        if (detEl) detEl.value = PERSONAS.salma.sampleOfferText;
        if (priEl) priEl.value = PERSONAS.salma.samplePriorities;
      }
      if (window.toast) window.toast(`Filled synthetic sample data for ${p.name}! You can edit any field before submitting.`, 'success');
    },

    renderContextualHelpBar
  };

  // Expose globally
  window.CCOnboarding = Controller;

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. KEYBOARD NAVIGATION & INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  document.addEventListener('keydown', function (e) {
    if (!OB.isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      Controller.skipTutorial();
      return;
    }
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';
    if (!isTyping) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        Controller.nextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        Controller.prevStep();
      }
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    applyAccessibilityModes();
    updateHeaderStatusButton();
    renderContextualHelpBar();

    // Hook into showPage so contextual help bar updates on page navigation
    if (typeof window.showPage === 'function') {
      const origShowPage = window.showPage;
      window.showPage = function (page) {
        origShowPage(page);
        renderContextualHelpBar();
      };
    }

    // Automatically open onboarding for first-time users (when not completed and not skipped)
    if (OB.status !== 'completed' && OB.status !== 'skipped') {
      Controller.openTutorial(OB.currentStep || 0);
    }
  });
})();
