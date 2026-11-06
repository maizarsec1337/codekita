import type { PathInput } from "./academy";

// Original, opt-in starter curriculum. These are content definitions, never user activity.
export const starterPaths: PathInput[] = [
  {
    slug: "web-development-fundamentals", title: "Web Development Fundamentals",
    description: "Understand the web, write semantic HTML, and build your first accessible interface.",
    academy: "programming", difficulty: "Beginner", estimatedMinutes: 120,
    skills: ["HTTP", "Semantic HTML", "CSS layout", "Accessibility"], prerequisites: [], isPublished: true,
    modules: [
      { slug: "how-the-web-works", title: "How the web works", lessons: [
        { slug: "request-and-response", title: "The request–response cycle", objectives: ["Describe an HTTP request", "Distinguish client and server responsibilities"], content: "## A conversation between systems\n\nA browser is a client. It sends an HTTP request to a server, which returns a response containing a status, headers, and often a body. HTML describes the document; CSS controls presentation; JavaScript adds behavior.\n\n## Inspect a request\n\nOpen the Network panel in your browser developer tools and reload a page you own. Select the document request and inspect its method, status, and content type.\n\n```http\nGET / HTTP/1.1\nHost: example.test\nAccept: text/html\n```\n\n## Status codes\n\n| Status | Meaning |\n| --- | --- |\n| 200 | Successful response |\n| 404 | Resource not found |\n| 500 | Server error |\n\nA response status describes the outcome, not whether the application is secure.", assessment: { question: "Which component sends the HTTP request when you open a web page?", options: ["The browser client", "The database", "The CSS stylesheet"], correctIndex: 0 } },
        { slug: "semantic-html", title: "Build with semantic HTML", objectives: ["Choose meaningful elements", "Associate labels with controls"], content: "## Structure before style\n\nSemantic HTML communicates purpose. Use a main element for primary content, nav for navigation, and button for actions. A link changes location; a button performs an action.\n\n```html\n<main>\n  <h1>Your learning journey</h1>\n  <label for=\"name\">Name</label>\n  <input id=\"name\" autocomplete=\"name\">\n  <button type=\"submit\">Save profile</button>\n</main>\n```\n\n## Practice\n\nCreate a profile form locally. Navigate it using only Tab, Shift+Tab, and Enter. Every control should have a visible focus indicator and a meaningful accessible name.", assessment: { question: "Which element is appropriate for saving a form without navigating to another page?", options: ["A div with a click handler", "A button", "A heading"], correctIndex: 1 } },
      ] },
      { slug: "responsive-foundations", title: "Responsive foundations", lessons: [
        { slug: "flexible-layouts", title: "Create flexible layouts", objectives: ["Use a flexible grid", "Avoid fixed-width mobile layouts"], content: "## Design for available space\n\nA responsive layout adapts to content and viewport size. Start with a single column, then add columns when there is enough space. Prefer relative widths and a maximum reading width.\n\n```css\n.cards {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));\n  gap: 1.5rem;\n}\n```\n\n## Verify your work\n\nTest at a narrow viewport and at 200% zoom. Content should remain readable without page-level horizontal scrolling. Code blocks and wide tables can have their own scroll containers.", assessment: { question: "What should a responsive card layout do on a narrow screen?", options: ["Keep a fixed desktop width", "Hide all text", "Adapt to a single readable column"], correctIndex: 2 } },
      ] },
    ],
  },
  {
    slug: "cybersecurity-fundamentals", title: "Cybersecurity Fundamentals",
    description: "Develop a defensive mindset with authorization, threat modeling, and secure authentication.",
    academy: "cybersecurity", difficulty: "Beginner", estimatedMinutes: 100,
    skills: ["Threat modeling", "Least privilege", "Authentication", "Defensive analysis"], prerequisites: [], isPublished: true,
    modules: [
      { slug: "security-mindset", title: "The security mindset", lessons: [
        { slug: "scope-and-authorization", title: "Scope, ethics, and authorization", objectives: ["Define an authorized scope", "Distinguish a training system from a real target"], content: "## Permission comes first\n\nSecurity testing requires explicit authorization. A public website is not an invitation to probe it. Define the systems, methods, time window, and reporting process before beginning any exercise.\n\n## Our learning boundary\n\nCodeKita defensive exercises use supplied fictional artifacts or an explicitly isolated training environment. Never apply an exercise to a third-party system.\n\n## Threat modeling\n\nIdentify an asset, the actors who use it, the trust boundaries they cross, and the controls that protect it. For a login form, consider account data, user identity, session cookies, and rate limits.", assessment: { question: "When is it appropriate to test a system for vulnerabilities?", options: ["Whenever it is publicly accessible", "Only with explicit authorization and an agreed scope", "When the URL is easy to guess"], correctIndex: 1 } },
      ] },
      { slug: "secure-authentication", title: "Secure authentication", lessons: [
        { slug: "sessions-and-least-privilege", title: "Sessions and least privilege", objectives: ["Explain server-side session validation", "Apply least privilege"], content: "## Authentication is not authorization\n\nAuthentication establishes identity. Authorization decides what that identity may do. Both must be enforced on the server. Hiding an admin link does not protect an admin API.\n\n## Session boundaries\n\nA session cookie identifies a server-side record with an expiry. HttpOnly prevents script access to a cookie; Secure restricts transport to HTTPS. State-changing requests also need CSRF protection.\n\n## Least privilege\n\nGrant only the access needed for a task. New learners must not receive administrator privileges, and learning progress must be associated with the authenticated session, not a submitted user ID.", assessment: { question: "Where must access to a restricted module be enforced?", options: ["Only in the navigation UI", "Only in local storage", "On the server for every protected request"], correctIndex: 2 } },
      ] },
    ],
  },
  {
    slug: "ai-fundamentals", title: "AI Engineering Fundamentals",
    description: "Learn data splits, model evaluation, and responsible engineering before building AI applications.",
    academy: "ai", difficulty: "Beginner", estimatedMinutes: 110,
    skills: ["Data splits", "Evaluation", "Precision and recall", "Responsible AI"], prerequisites: [], isPublished: true,
    modules: [
      { slug: "data-foundations", title: "Data foundations", lessons: [
        { slug: "train-validate-test", title: "Train, validate, and test", objectives: ["Explain the purpose of data splits", "Recognize data leakage"], content: "## Generalization is the goal\n\nA useful model performs well on examples it did not learn from. Split data into training, validation, and test sets. Fit model parameters on training data, choose settings using validation data, and reserve the test set for final evaluation.\n\n## Avoid leakage\n\nDo not calculate preprocessing statistics from the full dataset before splitting. Fit transformations on the training set and apply them unchanged to validation and test data.\n\n```python\n# Conceptual workflow; run only in an isolated configured environment.\ntrain, validation, test = split_dataset(data)\ntransform = fit_preprocessing(train)\nmodel = fit_model(transform(train))\n```", assessment: { question: "What is the main purpose of a held-out test set?", options: ["To fit the model parameters", "To estimate performance on unseen data", "To increase the training score"], correctIndex: 1 } },
      ] },
      { slug: "evaluate-responsibly", title: "Evaluate responsibly", lessons: [
        { slug: "precision-and-recall", title: "Precision, recall, and trade-offs", objectives: ["Calculate precision and recall", "Choose metrics for the problem"], content: "## Beyond accuracy\n\nAccuracy can hide poor performance on rare classes. Precision measures how many predicted positives were correct. Recall measures how many actual positives were found.\n\n```python\ntrue_positive = 32\nfalse_positive = 8\nfalse_negative = 16\nprecision = true_positive / (true_positive + false_positive)\nrecall = true_positive / (true_positive + false_negative)\n```\n\n## Engineering judgment\n\nA screening system may prioritize recall, while an expensive manual-review pipeline may require higher precision. Evaluate representative groups, document limitations, protect personal data, and monitor performance after deployment.", assessment: { question: "With 32 true positives and 8 false positives, what is precision?", options: ["0.80", "0.40", "1.00"], correctIndex: 0 } },
      ] },
    ],
  },
];