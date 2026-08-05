---
name: cvfy-json-builder
description: Instructions and schema specifications for AI agents to convert Markdown CVs or raw resume text into valid CvFy JSON format suitable for direct import. Use when asked to convert resumes into CvFy JSON or build CvFy-compatible JSON files.
---

# CvFy JSON Builder Skill

This skill guides AI agents on how to parse Markdown CVs, resumes, or unformatted candidate profiles into a fully valid `CvFy` JSON structure that can be imported directly into the application at `/create` via **Upload CV settings (JSON)**.

---

## 1. Top-Level JSON Wrapper

All CV data MUST be wrapped inside a top-level `"formSettings"` key:

```json
{
  "formSettings": {
    ...
  }
}
```

---

## 2. Complete Schema Specification

### 2.1 Profile & Contact Fields
| Key | Type | Default / Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Required | First name of the candidate |
| `lastName` | `string` | Required | Last / Family name of the candidate |
| `jobTitle` | `string` | Required | Target position or current title |
| `email` | `string` | Required | Candidate's email address |
| `location` | `string` | Required | City, State/Country |
| `phoneNumber` | `string` | Required | Phone number |
| `aboutme` | `string` | Required | Summary/Objective paragraph (Markdown supported) |
| `profileImageDataUri` | `string \| null` | `null` | Base64 Data URI or image path |

### 2.2 Social Links
| Key | Type | Default | Example |
| :--- | :--- | :--- | :--- |
| `linkedin` | `string` | `""` | `truongthanhquan` |
| `github` | `string` | `""` | `Xio-Cloud` |
| `twitter` | `string` | `""` | `username` |
| `website` | `string` | `""` | `cv.xio.vn` |

### 2.3 Skills, Languages & Interests
| Key | Type | Details |
| :--- | :--- | :--- |
| `jobSkills` | `string[]` | Technical/Hard skills (e.g. `["PHP", "Vue 3", "TypeScript"]`) |
| `softSkills` | `string[]` | Personal/Leadership skills (e.g. `["Leadership", "Mentoring"]`) |
| `languages` | `Array<{lang: string, level: Level}>` | `level` MUST be one of: `elementary`, `limited-working`, `professional-working`, `full-professional`, `native-bilingual` |
| `interests` | `string[]` | Hobbies or areas of interest |

### 2.4 Event Entries (`work`, `education`, `projects`)
Arrays containing experience, education, or project objects with the following schema:

```typescript
interface CvEvent {
  id: string              // Unique ID (e.g., "work-1", "edu-1")
  title: string           // Role title, degree name, or project title
  location: string        // Company name, university name, or project link
  from: string            // ISO Date string ("YYYY-MM-DDTHH:mm:ss.sssZ")
  to: string              // ISO Date string ("YYYY-MM-DDTHH:mm:ss.sssZ")
  current: boolean        // true if currently active/ongoing
  displayDate: boolean    // true to show dates on CV (default: true)
  summary: string         // Markdown formatted description and bullet points
}
```

### 2.5 Display Controls & Layout Defaults
Always include these standard display toggles in `formSettings`:

```json
{
  "layout": "two-column",
  "activeColor": "#5B21B6",
  "displayAbout": true,
  "displaySkills": true,
  "displayJobSkills": true,
  "displaySoftSkills": true,
  "displayLanguages": true,
  "displayInterests": true,
  "displaySocial": true,
  "displayWork": true,
  "displayEducation": true,
  "displayProjects": true,
  "sectionOrder": ["about", "skills", "work", "education", "projects", "social"]
}
```

---

## 3. Conversion Instructions for AI Agents

When converting input text or Markdown to CvFy JSON:

1. **Date Parsing**:
   - Convert all dates to UTC ISO strings: `new Date("2020-01-01").toISOString()` -> `"2020-01-01T00:00:00.000Z"`.
   - If a position is ongoing ("Present" or "Current"), set `current: true` and set `to` to the current UTC ISO date.

2. **Bullet Points & Markdown**:
   - Format `summary` strings using Markdown lists (`- Bullet point`) and bold text (`**Header**`).
   - Use `\n` line breaks to separate paragraphs and bullet lists inside JSON strings.

3. **Language Levels Mapping**:
   - Native / Bilingual -> `"native-bilingual"`
   - Fluent / Full Professional -> `"full-professional"`
   - Advanced / Professional Working -> `"professional-working"`
   - Intermediate / Limited Working -> `"limited-working"`
   - Beginner / Elementary -> `"elementary"`

4. **Clean IDs**:
   - Assign unique string IDs to each item in `work`, `education`, and `projects` (e.g. `"work-1"`, `"work-2"`, `"edu-1"`).

---

## 4. Verification Check

Before outputting JSON, ensure:
- Root object has key `"formSettings"`.
- All `from` and `to` properties are valid ISO date strings.
- All language levels match one of the 5 allowed enum values.
- Array fields (`jobSkills`, `softSkills`, `work`, `education`, `projects`) are non-null arrays.
