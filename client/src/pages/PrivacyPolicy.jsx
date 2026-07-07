import React from 'react';
import { Shield } from 'lucide-react';
import LegalPageLayout from '../components/LegalPageLayout';
import { PRIVACY_POLICY } from '../content/legalContent';

const PrivacyPolicy = () => (
  <LegalPageLayout
    title={PRIVACY_POLICY.title}
    lastUpdated={PRIVACY_POLICY.lastUpdated}
    sections={PRIVACY_POLICY.sections}
    icon={Shield}
  />
);

export default PrivacyPolicy;
