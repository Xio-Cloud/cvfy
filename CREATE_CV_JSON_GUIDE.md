# Guide: How to Convert a Markdown CV to CvFy JSON

This guide explains how to convert any standard Markdown-formatted CV into a valid `.json` file compatible with **CvFy** (which can be imported directly at [cv.xio.vn/create](http://cv.xio.vn/create)).

---

## 1. Markdown CV Format

A typical Markdown CV follows this clean structure:

```markdown
# **Jane Doe**

### ***Senior Software Engineer***

San Francisco, CA | 555-019-2834 | jane.doe@example.com | linkedin.com/in/janedoe | github.com/janedoe

## **OBJECTIVE**

Experienced Senior Software Engineer with 8+ years of expertise in building scalable cloud services, domain-driven microservices, and modern web applications. Passionate about system performance, clean architecture, and mentoring engineering teams.

## **WORK EXPERIENCE**

### ***Senior Software Engineer — TechCorp (2020 – Present)***

* Leading developer for core e-commerce backend services and infrastructure.
* **Platform: Core Checkout & Payment Pipeline**
* **Stack: Node.js, TypeScript, PostgreSQL, Redis, AWS (ECS, SQS).**
  * Architected and deployed microservices processing over 100k daily transactions.
  * Reduced P99 API latency by 40% through Redis caching and query optimization.
  * Mentored junior and mid-level engineers in TypeScript and system design best practices.

### ***Software Engineer — DataSystems (2017 – 2020)***

* **Platform: Data Analytics Dashboard**
* **Stack: Python, Django, React, PostgreSQL, Docker.**
  * Built real-time analytics dashboards for business intelligence monitoring.
  * Integrated third-party REST APIs and automated ETL data pipelines.

## **EDUCATION**

### ***Bachelor of Science in Computer Science***

State University | *2013 – 2017*

## **ADDITIONAL SKILLS**

* **Technical Skills:** Node.js, TypeScript, Python, React, Vue, PostgreSQL, Redis, Docker, AWS, GraphQL
* **Soft Skills:** System Architecture, Technical Leadership, Performance Tuning, Agile Operations
* **Languages:** English (Native), Spanish (Professional)
```

---

## 2. Mapping Markdown Sections to CvFy JSON Fields

| Markdown Section | CvFy JSON Field | Data Type | Notes |
| :--- | :--- | :--- | :--- |
| `# Name` | `name`, `lastName` | `string` | Split full name into `name` and `lastName` |
| `### Job Title` | `jobTitle` | `string` | e.g. `"Senior Software Engineer"` |
| Contact details | `email`, `location`, `phoneNumber` | `string` | Extracted from contact header line |
| Social links | `linkedin`, `github`, `twitter`, `website` | `string` | Usernames or full URLs |
| `## OBJECTIVE` | `aboutme` | `string` | Summary paragraph (Markdown supported) |
| `## WORK EXPERIENCE` | `work` | `CvEvent[]` | Array of work experience items |
| `## EDUCATION` | `education` | `CvEvent[]` | Array of education history items |
| `## PROJECTS` | `projects` | `CvEvent[]` | Array of project items |
| `## SKILLS` | `jobSkills`, `softSkills` | `string[]` | Technical & soft skill arrays |
| Languages | `languages` | `Array<{lang, level}>` | `level`: `'elementary'`, `'limited-working'`, `'professional-working'`, `'full-professional'`, `'native-bilingual'` |

---

## 3. `CvEvent` Entry Structure (`work`, `education`, `projects`)

Each item inside `work`, `education`, or `projects` arrays uses this JSON object structure:

```json
{
  "id": "unique-id-1",
  "title": "Role Title / Degree / Project Name",
  "location": "Company Name / School / Link",
  "from": "2020-01-01T00:00:00.000Z",
  "to": "2026-08-01T00:00:00.000Z",
  "current": true,
  "displayDate": true,
  "summary": "Markdown text with bullet points (- ...)"
}
```

* **`from` & `to`**: ISO date format string (`"YYYY-MM-DDTHH:mm:ss.sssZ"`).
* **`current`**: Set to `true` if the position or study is ongoing.
* **`summary`**: Supports Markdown formatting, headers (`**Header**`), and bullet points (`- Item`).

---

## 4. Complete Generic JSON Example

Here is the exact JSON conversion of the sample Markdown CV above, ready for import into **CvFy**:

```json
{
  "formSettings": {
    "layout": "two-column",
    "profileImageDataUri": null,
    "name": "Jane",
    "lastName": "Doe",
    "jobTitle": "Senior Software Engineer",
    "email": "jane.doe@example.com",
    "location": "San Francisco, CA",
    "phoneNumber": "555-019-2834",
    "aboutme": "Experienced Senior Software Engineer with 8+ years of expertise in building scalable cloud services, domain-driven microservices, and modern web applications. Passionate about system performance, clean architecture, and mentoring engineering teams.",
    "jobSkills": [
      "Node.js",
      "TypeScript",
      "Python",
      "React",
      "Vue.js",
      "PostgreSQL",
      "Redis",
      "Docker",
      "AWS",
      "GraphQL"
    ],
    "displayJobSkills": true,
    "softSkills": [
      "System Architecture",
      "Technical Leadership",
      "Performance Tuning",
      "Agile Operations"
    ],
    "displaySoftSkills": true,
    "languages": [
      {
        "lang": "English",
        "level": "native-bilingual"
      },
      {
        "lang": "Spanish",
        "level": "professional-working"
      }
    ],
    "displayLanguages": true,
    "interests": [
      "Cloud Infrastructure",
      "System Performance"
    ],
    "displayInterests": true,
    "linkedin": "janedoe",
    "github": "janedoe",
    "twitter": "",
    "website": "example.com",
    "work": [
      {
        "id": "work-1",
        "title": "Senior Software Engineer",
        "location": "TechCorp",
        "from": "2020-01-01T00:00:00.000Z",
        "to": "2026-08-01T00:00:00.000Z",
        "current": true,
        "displayDate": true,
        "summary": "Leading developer for core e-commerce backend services and infrastructure.\n\n**Platform: Core Checkout & Payment Pipeline**\n*Stack: Node.js, TypeScript, PostgreSQL, Redis, AWS (ECS, SQS).*\n- Architected and deployed microservices processing over 100k daily transactions.\n- Reduced P99 API latency by 40% through Redis caching and query optimization.\n- Mentored junior and mid-level engineers in TypeScript and system design best practices."
      },
      {
        "id": "work-2",
        "title": "Software Engineer",
        "location": "DataSystems",
        "from": "2017-01-01T00:00:00.000Z",
        "to": "2020-01-01T00:00:00.000Z",
        "current": false,
        "displayDate": true,
        "summary": "**Platform: Data Analytics Dashboard**\n*Stack: Python, Django, React, PostgreSQL, Docker.*\n- Built real-time analytics dashboards for business intelligence monitoring.\n- Integrated third-party REST APIs and automated ETL data pipelines."
      }
    ],
    "education": [
      {
        "id": "edu-1",
        "title": "Bachelor of Science in Computer Science",
        "location": "State University",
        "from": "2013-09-01T00:00:00.000Z",
        "to": "2017-06-01T00:00:00.000Z",
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
    "displayProjects": false,
    "sectionOrder": [
      "about",
      "skills",
      "work",
      "education",
      "projects",
      "social"
    ],
    "activeColor": "#5B21B6"
  }
}
```

---

## 5. How to Import the JSON File

1. Open **[CvFy](http://cv.xio.vn/create)** (or `http://localhost:3000/create`).
2. Scroll to the bottom of the left sidebar (**CV Settings**).
3. Click **Upload CV settings (JSON)** and select your `.json` file.
4. All sections, experience entries, and formatting settings will instantly load into the live CV preview!
