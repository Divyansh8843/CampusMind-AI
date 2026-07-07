import React from 'react';
import { FileText } from 'lucide-react';
import LegalPageLayout from '../components/LegalPageLayout';
import { TERMS_OF_SERVICE } from '../content/legalContent';

const TermsOfService = () => (
  <LegalPageLayout
    title={TERMS_OF_SERVICE.title}
    lastUpdated={TERMS_OF_SERVICE.lastUpdated}
    sections={TERMS_OF_SERVICE.sections}
    icon={FileText}
  />
);

export default TermsOfService;
