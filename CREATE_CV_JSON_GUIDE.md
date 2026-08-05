# Guide: How to Create a CV with JSON in CvFy

This guide explains how to construct a valid `.json` file that can be uploaded into **CvFy** to automatically populate a complete CV, including personal details, work experience, education, projects, skills, and formatting options.

---

## 1. Overview of JSON Structure

CvFy expects a JSON file with a top-level `"formSettings"` object containing all CV fields:

```json
{
  "formSettings": {
    "layout": "two-column",
    "name": "First Name",
    "lastName": "Last Name",
    "jobTitle": "Job Title",
    "email": "email@example.com",
    "location": "City, Country",
    "phoneNumber": "Phone Number",
    "aboutme": "Markdown summary text...",
    "jobSkills": ["Skill 1", "Skill 2"],
    "softSkills": ["Soft Skill 1", "Soft Skill 2"],
    "languages": [
      { "lang": "English", "level": "full-professional" }
    ],
    "interests": ["Interest 1"],
    "linkedin": "linkedin-username",
    "github": "github-username",
    "twitter": "",
    "website": "example.com",
    "work": [ ... ],
    "education": [ ... ],
    "projects": [ ... ],
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
    "sectionOrder": ["about", "skills", "work", "education", "projects", "social"],
    "activeColor": "#5B21B6"
  }
}
```

---

## 2. Field Specifications

### 2.1 Basic Personal Information
| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | First name |
| `lastName` | `string` | Last / Family name |
| `jobTitle` | `string` | Current position or target job title |
| `email` | `string` | Email address |
| `location` | `string` | City and country / region |
| `phoneNumber` | `string` | Contact phone number |
| `aboutme` | `string` | Summary or Objective paragraph (Markdown supported) |
| `profileImageDataUri` | `string \| null` | Base64 Data URI or image path |

### 2.2 Social Links
| Field | Type | Example Value |
| :--- | :--- | :--- |
| `linkedin` | `string` | `truongthanhquan` |
| `github` | `string` | `Xio-Cloud` |
| `twitter` | `string` | `username` |
| `website` | `string` | `cv.xio.vn` |

### 2.3 Skills & Languages
| Field | Type | Allowed Level Values |
| :--- | :--- | :--- |
| `jobSkills` | `string[]` | Technical / professional skills |
| `softSkills` | `string[]` | Personal & leadership skills |
| `languages` | `Array<{lang: string, level: Level}>` | Level: `'elementary'`, `'limited-working'`, `'professional-working'`, `'full-professional'`, `'native-bilingual'` |
| `interests` | `string[]` | Personal interests & hobbies |

### 2.4 Event Entries (`work`, `education`, `projects`)
Each item in `work`, `education`, or `projects` array is an object with:

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier (e.g. `"work-1"`, `"edu-1"`) |
| `title` | `string` | Role title, degree name, or project title |
| `location` | `string` | Company name, school name, or project link |
| `from` | `string` | Start date (ISO format string: `"YYYY-MM-DDTHH:mm:ss.sssZ"`) |
| `to` | `string` | End date (ISO format string: `"YYYY-MM-DDTHH:mm:ss.sssZ"`) |
| `current` | `boolean` | `true` if currently working / studying here |
| `displayDate` | `boolean` | `true` to display dates on the CV |
| `summary` | `string` | Markdown formatted text for details / bullet points |

### 2.5 Display Toggles & Settings
| Field | Type | Options / Values |
| :--- | :--- | :--- |
| `layout` | `string` | `"two-column"` or `"one-column"` |
| `activeColor` | `string` | Hex color code (e.g. `"#5B21B6"`) |
| `sectionOrder` | `string[]` | Order of sections: `["about", "skills", "work", "education", "projects", "social"]` |
| `displayAbout` | `boolean` | Toggle About Me section |
| `displayWork` | `boolean` | Toggle Experience section |
| `displayEducation` | `boolean` | Toggle Education section |
| `displayProjects` | `boolean` | Toggle Projects section |
| `displaySocial` | `boolean` | Toggle Social section |

---

## 3. Concrete Example: Converting Markdown CV to JSON

Below is the complete, full-featured JSON representation of **Quan Truong's CV**, ready to be imported into CvFy:

```json
{
  "formSettings": {
    "layout": "two-column",
    "profileImageDataUri": null,
    "name": "Quan",
    "lastName": "Truong (Mr. Quan)",
    "jobTitle": "Full-stack Developer",
    "email": "truongthanhquan@gmail.com",
    "location": "Ho Chi Minh",
    "phoneNumber": "034-955-9995",
    "aboutme": "Accomplished Senior Fullstack Engineer with over a decade of experience designing, architecting, and scaling high-traffic web platforms. Expert in building resilient, domain-driven backend systems using PHP/Symfony and crafting high-performance, responsive interfaces with React and Vue. Proven track record in leading technical strategy, optimizing cloud-native infrastructure for 99.9% reliability, and mentoring engineering teams to deliver robust, scalable, and secure full-stack solutions.",
    "jobSkills": [
      "PHP 8.4",
      "Symfony",
      "Vue 3",
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "NestJS",
      "PostgreSQL",
      "Redis",
      "Elasticsearch",
      "Docker",
      "AWS",
      "Python",
      "Magento",
      "GraphQL",
      "RabbitMQ"
    ],
    "displayJobSkills": true,
    "softSkills": [
      "System Architecture",
      "Technical Strategy",
      "Performance Optimization",
      "Team Leadership",
      "Mentoring"
    ],
    "displaySoftSkills": true,
    "languages": [
      {
        "lang": "English",
        "level": "full-professional"
      },
      {
        "lang": "Vietnamese",
        "level": "native-bilingual"
      }
    ],
    "displayLanguages": true,
    "interests": [
      "System Architecture",
      "IoT Platforms",
      "Cloud Infrastructure"
    ],
    "displayInterests": true,
    "linkedin": "truongthanhquan",
    "github": "Xio-Cloud",
    "twitter": "",
    "website": "cv.xio.vn",
    "work": [
      {
        "id": "work-1",
        "title": "Senior Software Engineer",
        "location": "NFQ",
        "from": "2016-01-01T00:00:00.000Z",
        "to": "2026-08-01T00:00:00.000Z",
        "current": true,
        "displayDate": true,
        "summary": "Global digital services provider delivering scalable platforms and high-traffic applications for international clients across fintech, e-commerce, and media.\n\n**Platform: Shovel — Multi-Channel Sync Middleware (Gambio, Afterbuy, Shopify)**\n*Stack: PHP 8.4 (Symfony 7.4), Vue 3, TypeScript, Vite, PostgreSQL (Doctrine DBAL), Redis 7 Streams (Symfony Messenger), Docker Compose.*\n- Architected and led development of a multi-channel synchronization platform keeping products, stock, orders, and order statuses consistent across Gambio, Afterbuy, and Shopify for multiple enterprise customers.\n- Designed a domain-driven, partner-agnostic backend (Integration / Sync / Job layers) using Strategy and Transformer design patterns, allowing each sales channel to be integrated and maintained independently with zero impact on existing partners.\n- Delivered the Shopify channel integration — GraphQL API client, OAuth-based store authorization, and bidirectional product, order, stock, and category transformers — extending the platform to a third marketplace.\n- Built a Redis Streams-backed job queue (Symfony Messenger) with per-customer distributed locking, enabling safe, high-throughput concurrent processing across multiple worker replicas.\n- Implemented XML (Afterbuy), REST (Gambio v2/v3), and GraphQL (Shopify) API integration layers with structured, queryable sync logging for full operational observability.\n- Developed the Vue 3 + TypeScript admin UI for multi-channel credential management, job scheduling, and log monitoring.\n\n**Platform: German Recipe Portal (einfachbacken.de)**\n*Stack: PHP (Symfony), React, Next.js, TypeScript, Elasticsearch, Redis, Varnish, AWS (EC2, S3, SQS), Superset, Node.js (NestJS), Python.*\n- Architected and led end-to-end backend development for high-performance, scalable web applications.\n- Built a scalable design system fostering visual consistency and accelerating delivery.\n- Optimized Core Web Vitals (LCP, CLS) via next/image (WebP/AVIF) and Intersection Observer lazy loading.\n- Owned SEO infrastructure including JSON-LD structured data, dynamic Open Graph, and programmatic sitemaps.\n- Built an Elasticsearch-based full-text search system with debounced suggestions and keyboard navigation.\n- Built distributed systems leveraging queue-based architecture (AWS SQS) for asynchronous processing.\n- Integrated AI infrastructure with MCP + Vector DB and developed streaming chat assistants.\n- Improved API response time by 30% through advanced caching strategies (Redis, Varnish) and database optimization.\n\n**Platform: GLS Bank — Internal Loan Management Web App**\n*Stack: PHP (Symfony), Vue.js, Vuex, Vue Router, TypeScript, Vitest / Jest, Cypress / Playwright.*\n- Architected the frontend from scratch, establishing coding standards and Vuex state management.\n- Built complex multi-step loan flows with branching form logic and dynamic validation.\n- Implemented role-based access control (RBAC) integrated with backend authentication services.\n- Delivered loan dashboards and data-driven tables for financing lifecycle management.\n- Established a robust testing culture with unit, integration, and E2E coverage.\n\n**Key Responsibilities & Achievements:**\n- Ensured 99.9% uptime across production systems through performance tuning, monitoring, and scalable infrastructure design on both AWS and Docker-based deployments.\n- Owned end-to-end architecture for multiple concurrent platforms, from customer-facing e-commerce/fintech applications to backend sync middleware integrating third-party APIs.\n- Designed resilient, domain-driven backend structures that let independent projects evolve without cross-cutting regressions, reducing onboarding time for new contributors.\n- Led system improvements that significantly enhanced performance, maintainability, and SEO requirements.\n- Mentored team members and led backend technical decisions, architecture reviews, and code reviews across projects."
      },
      {
        "id": "work-2",
        "title": "Backend Developer",
        "location": "Chudu24",
        "from": "2016-01-01T00:00:00.000Z",
        "to": "2017-01-01T00:00:00.000Z",
        "current": false,
        "displayDate": true,
        "summary": "**Platform: Chudu24 Booking Platform Migration**\n*Stack: Node.js, PostgreSQL, SQL Server, Redis, Varnish, RabbitMQ, ElasticSearch.*\n- Led a team of six in migrating the platform to Node.js and PostgreSQL.\n- Optimized the system's performance, ensuring a seamless user experience during the transition.\n- Implemented Redis, Varnish, and RabbitMQ for enhanced caching and messaging functionalities.\n- Successfully migrated the core booking platform from ASP.NET and SQL Server to a scalable Node.js stack, improving system reliability and growth capacity.\n- Successfully migrated the system to a new tech stack, improving performance and scalability.\n- Enhanced user experience and system reliability, supporting the platform's growth."
      },
      {
        "id": "work-3",
        "title": "Senior Software Engineer",
        "location": "Galaxy Play",
        "from": "2015-01-01T00:00:00.000Z",
        "to": "2016-01-01T00:00:00.000Z",
        "current": false,
        "displayDate": true,
        "summary": "**Platform: Galaxy Play Movie Streaming Service**\n*Stack: Node.js, Angular, Elasticsearch, HAProxy, RabbitMQ, Tizen OS.*\n- Designed and implemented a microservice architecture for web, mobile, and set-top box platforms.\n- Developed a comprehensive CMS and a notification management system for Android and iOS devices.\n- Created APIs for third-party integrations and developed applications for Tizen OS.\n- Successfully developed a robust architecture that supported the platform's rapid growth.\n- Enhanced notification delivery systems, improving user engagement and satisfaction."
      },
      {
        "id": "work-4",
        "title": "Full Stack Developer",
        "location": "WiseRobot",
        "from": "2014-01-01T00:00:00.000Z",
        "to": "2015-01-01T00:00:00.000Z",
        "current": false,
        "displayDate": true,
        "summary": "**Platform: Magento E-commerce Optimization**\n*Stack: PHP, Magento, HTML, CSS, JavaScript.*\n- Optimized performance and integrated new features for a high-traffic e-commerce system based on the Magento platform."
      },
      {
        "id": "work-5",
        "title": "Developer and Networking Administrator",
        "location": "Khatech",
        "from": "2013-01-01T00:00:00.000Z",
        "to": "2014-01-01T00:00:00.000Z",
        "current": false,
        "displayDate": true,
        "summary": "**Platform: Corporate Infrastructure & Client Solutions**\n*Stack: WordPress, PHP, MCSA Networking protocols.*\n- Managed corporate network infrastructure and developed various WordPress-based client solutions."
      }
    ],
    "education": [
      {
        "id": "edu-1",
        "title": "Bachelor of Information Technology",
        "location": "Nha Trang University",
        "from": "2010-09-01T00:00:00.000Z",
        "to": "2014-06-01T00:00:00.000Z",
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

## 4. How to Import the JSON into CvFy

1. Open **[CvFy](http://cv.xio.vn/create)** (or your local instance at `http://localhost:3000/create`).
2. On the left sidebar (**CV Settings**), scroll down to the bottom CTA section.
3. Click **Upload CV settings (JSON)** and select your saved `.json` file.
4. All fields, work experiences, education records, and skills will immediately populate into the editor and render live in the CV preview!
