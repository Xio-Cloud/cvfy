# AI Agent Prompt & Skill Guide for CvFy

Use this document to instruct any AI agent (ChatGPT, Claude, Gemini, or custom LLMs) to convert any resume or Markdown CV into a valid **CvFy JSON** file, allowing you to instantly visualize and edit it on **[cv.xio.vn/create](http://cv.xio.vn/create)**.

---

## 📋 Copy-Paste Prompt for Other AI Agents

Copy and paste the text block below into any AI chat (ChatGPT, Claude, Gemini, etc.) along with your raw resume or Markdown text:

```text
You are an expert Resume Converter AI. Your task is to take my resume text provided below and convert it into a strictly valid CvFy JSON structure wrapped inside a top-level "formSettings" object.

Output ONLY valid, raw JSON (no explanations, no surrounding text outside the JSON code block).

JSON Schema Requirements:
1. Top-Level Structure:
{
  "formSettings": {
    "layout": "two-column",
    "profileImageDataUri": null,
    "name": "First Name",
    "lastName": "Last Name",
    "jobTitle": "Target Job Title",
    "email": "email@example.com",
    "location": "City, Country",
    "phoneNumber": "Phone Number",
    "aboutme": "Summary/Objective paragraph in Markdown",
    "jobSkills": ["Skill 1", "Skill 2"],
    "displayJobSkills": true,
    "softSkills": ["Soft Skill 1", "Soft Skill 2"],
    "displaySoftSkills": true,
    "languages": [
      { "lang": "English", "level": "full-professional" }
    ],
    "displayLanguages": true,
    "interests": ["Interest 1"],
    "displayInterests": true,
    "linkedin": "linkedin-username",
    "github": "github-username",
    "twitter": "",
    "website": "example.com",
    "work": [
      {
        "id": "work-1",
        "title": "Role Title",
        "location": "Company Name",
        "from": "YYYY-MM-DDTHH:mm:ss.sssZ",
        "to": "YYYY-MM-DDTHH:mm:ss.sssZ",
        "current": false,
        "displayDate": true,
        "summary": "Markdown text with bullet points (- ...)"
      }
    ],
    "education": [
      {
        "id": "edu-1",
        "title": "Degree / Field of Study",
        "location": "University Name",
        "from": "YYYY-MM-DDTHH:mm:ss.sssZ",
        "to": "YYYY-MM-DDTHH:mm:ss.sssZ",
        "current": false,
        "displayDate": true,
        "summary": ""
      }
    ],
    "projects": [],
    "displaySocial": true,
    "displayAbout": true,
    "displaySkills": true,
    "displayWork": true,
    "displayEducation": true,
    "displayProjects": true,
    "sectionOrder": ["about", "skills", "work", "education", "projects", "social"],
    "activeColor": "#5B21B6"
  }
}

Field Rules:
- "from" and "to" MUST be valid ISO 8601 strings (e.g. "2020-01-01T00:00:00.000Z"). If currently working, set "current": true and "to" to current UTC ISO date.
- "languages" level MUST be one of: "elementary", "limited-working", "professional-working", "full-professional", "native-bilingual".
- "summary" strings in work, education, and projects MUST use Markdown lists (- Item) and bold headers (**Header**).

Here is my resume text to convert:
[PASTE YOUR RESUME / CV TEXT HERE]
```

---

## 🚀 How to Visualize Your CV in 3 Easy Steps

1. **Generate JSON**: Paste the prompt above along with your resume text into any AI agent.
2. **Save File**: Copy the returned JSON output and save it as `my_cv.json`.
3. **Visualize**: Open **[cv.xio.vn/create](http://cv.xio.vn/create)**, scroll to the bottom of the left sidebar, click **Upload CV settings (JSON)**, and select `my_cv.json`. Your CV will immediately render live in the interactive preview!
