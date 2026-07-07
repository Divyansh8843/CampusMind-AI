export const PRIVACY_POLICY = {
  title: 'Privacy Policy',
  lastUpdated: 'June 2026',
  sections: [
    {
      heading: '1. Introduction',
      body: 'CampusMind AI ("we", "our", "us") is an India-wide intelligent academic platform for students and verified alumni. This Privacy Policy explains how we collect, use, store, and protect your information when you use our website, applications, and AI services.'
    },
    {
      heading: '2. Information We Collect',
      body: 'We collect information you provide directly: Google account name, email, profile picture, academic details (enrollment, branch, college), professional details for alumni, uploaded documents, chat messages, resume files, and optional live location coordinates when you enable the India network map. We also collect usage data such as login timestamps, feature usage, and device/browser metadata required for security.'
    },
    {
      heading: '3. How We Use Your Information',
      body: 'Your data powers core platform features: AI study chat on your uploaded documents, resume analysis, mock interviews, academic planning, alumni verification, mentorship networking, and live map presence. We do not sell personal data. AI processing is scoped to your account and authorized platform features only.'
    },
    {
      heading: '4. Document & Chat Data',
      body: 'Uploaded study documents are indexed for your personal RAG study assistant. Chat history is stored to improve continuity and support. Guest support chats may be stored locally in your browser. Authenticated chats are stored securely on our servers and linked to your account.'
    },
    {
      heading: '5. AI Alumni Verification & Location',
      body: 'Alumni accounts undergo AI-powered verification using resume intelligence, profile consistency checks, and a trust score engine. Resume upload is required. LinkedIn is recommended for identity consistency. Verified alumni receive a Verified Alumni badge and full network access. Live map location is collected only when you grant browser permission and is used solely for the India alumni/student network map.'
    },
    {
      heading: '6. Data Storage & Security',
      body: 'We use industry-standard safeguards including encrypted transport (HTTPS), authenticated API access, rate limiting, prompt safety guardrails, and role-based access control. Documents may be stored via secure cloud storage providers. Access to admin functions is restricted to authorized administrators.'
    },
    {
      heading: '7. Data Retention',
      body: 'We retain account and academic data while your account is active. You may request account deletion or data correction by contacting support. Some records may be retained where required for security, fraud prevention, or legal compliance.'
    },
    {
      heading: '8. Third-Party Services',
      body: 'We use Google Sign-In for authentication, and may use AI inference providers or cloud storage as configured in our deployment. These providers process data only as needed to deliver the service and under applicable agreements.'
    },
    {
      heading: '9. Your Rights',
      body: 'You may access and update profile information in your account settings, control map visibility, request support regarding your data, and withdraw location permission via your browser at any time.'
    },
    {
      heading: '10. Contact',
      body: 'For privacy questions or requests, contact CampusMind AI Support at campusmindofficial@gmail.com.'
    }
  ]
};

export const TERMS_OF_SERVICE = {
  title: 'Terms of Service',
  lastUpdated: 'June 2026',
  sections: [
    {
      heading: '1. Acceptance of Terms',
      body: 'By accessing or using CampusMind AI, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the platform.'
    },
    {
      heading: '2. Eligibility & Accounts',
      body: 'Students must sign in with authorized academic email domains (.ac.in, .edu.in, .edu). Alumni may sign in with approved personal email providers and must pass AI alumni verification (trust score ≥ 90) before accessing alumni-only features. You are responsible for maintaining the confidentiality of your account.'
    },
    {
      heading: '3. Acceptable Use',
      body: 'You agree to use CampusMind AI only for lawful academic, career, and platform-related purposes. You must not upload malicious files, attempt to bypass security, scrape data, impersonate others, harass users, or misuse AI chat for unrelated or harmful content.'
    },
    {
      heading: '4. AI Services Disclaimer',
      body: 'AI responses are assistive and may contain errors. Study answers should be verified against official course materials. Resume, interview, and career guidance does not guarantee employment outcomes. Do not treat AI output as legal, medical, or financial advice.'
    },
    {
      heading: '5. User Content',
      body: 'You retain ownership of documents and content you upload. You grant CampusMind AI a limited license to process, store, and index your content solely to provide platform features such as study chat, resume analysis, and analytics.'
    },
    {
      heading: '6. Alumni Network & Community',
      body: 'Verified alumni may connect with students through mentorship and community features. Misrepresentation during verification may result in account suspension. Connection requests must remain professional and respectful.'
    },
    {
      heading: '7. Subscriptions & Pricing',
      body: 'Some features may require a paid plan. Pricing, billing cycles, and plan limits are displayed on the Pricing page. Fees are non-refundable except where required by applicable law.'
    },
    {
      heading: '8. Intellectual Property',
      body: 'CampusMind AI branding, software, UI, and proprietary systems are owned by the CampusMind team. You may not copy, reverse engineer, or redistribute platform code or assets without permission.'
    },
    {
      heading: '9. Termination',
      body: 'We may suspend or terminate accounts that violate these terms, fail verification checks, or pose security risks. You may stop using the service at any time.'
    },
    {
      heading: '10. Limitation of Liability',
      body: 'CampusMind AI is provided "as is" to the maximum extent permitted by law. We are not liable for indirect, incidental, or consequential damages arising from platform use.'
    },
    {
      heading: '11. Changes to Terms',
      body: 'We may update these Terms periodically. Continued use after updates constitutes acceptance of the revised Terms.'
    },
    {
      heading: '12. Contact',
      body: 'For terms-related questions, contact campusmindofficial@gmail.com.'
    }
  ]
};

export const buildLegalContextForSupport = () => {
  const privacyText = PRIVACY_POLICY.sections
    .map((s) => `${s.heading}: ${s.body}`)
    .join('\n');
  const termsText = TERMS_OF_SERVICE.sections
    .map((s) => `${s.heading}: ${s.body}`)
    .join('\n');
  return { privacyText, termsText };
};
