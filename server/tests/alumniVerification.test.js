import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProfileFingerprint,
  VERIFICATION_FIELDS
} from '../services/alumniVerification.js';
import { buildTrustScore, resolveVerificationDecision } from '../services/alumniTrustEngine.js';

test('buildProfileFingerprint is stable for same alumni profile', () => {
  const user = {
    collegeName: 'ABC Institute of Technology',
    course: 'B.Tech',
    branch: 'Computer Science & Engineering (CSE)',
    graduationYear: '2024',
    linkedin: 'https://linkedin.com/in/john-doe',
    company: 'Google',
    jobRole: 'Software Engineer',
    resumeUrl: 'https://example.com/resume.pdf'
  };

  const first = buildProfileFingerprint(user);
  const second = buildProfileFingerprint({ ...user, collegeName: 'abc institute of technology' });
  assert.equal(first, second);
});

test('verification fields require resume and exclude linkedin as mandatory', () => {
  assert.ok(VERIFICATION_FIELDS.includes('collegeName'));
  assert.ok(VERIFICATION_FIELDS.includes('resumeUrl'));
  assert.equal(VERIFICATION_FIELDS.includes('linkedin'), false);
  assert.equal(VERIFICATION_FIELDS.includes('enrollment'), false);
});

test('buildTrustScore awards high score for consistent profile and resume', () => {
  const formProfile = {
    name: 'Jane Alumni',
    collegeName: 'National Institute of Technology',
    course: 'B.Tech',
    branch: 'Computer Science & Engineering (CSE)',
    graduationYear: '2022',
    company: 'Google',
    jobRole: 'Software Engineer',
    linkedin: 'https://linkedin.com/in/jane-alumni'
  };
  const resumeExtracted = {
    name: 'Jane Alumni',
    college: 'National Institute of Technology',
    degree: 'B.Tech',
    branch: 'Computer Science & Engineering (CSE)',
    graduation_year: '2022',
    company: 'Google',
    job_title: 'Software Engineer'
  };

  const trust = buildTrustScore(formProfile, resumeExtracted);
  assert.ok(trust.total >= 90);
  assert.equal(resolveVerificationDecision(trust.total).status, 'verified');
});

test('resolveVerificationDecision maps score bands correctly', () => {
  assert.equal(resolveVerificationDecision(92).status, 'verified');
  assert.equal(resolveVerificationDecision(80).status, 'pending');
  assert.equal(resolveVerificationDecision(65).status, 'rejected');
});

test('custom company and role names pass validation while placeholder Other does not', async () => {
  const { isValidCompany, isValidJobRole } = await import('../data/academicOptions.js');

  assert.equal(isValidCompany('Other'), false);
  assert.equal(isValidCompany('Acme Labs Pvt Ltd'), true);
  assert.equal(isValidJobRole('Other'), false);
  assert.equal(isValidJobRole('Principal Architect'), true);
});

test('buildTrustScore supports custom company names from resume extraction', () => {
  const formProfile = {
    name: 'Ravi Kumar',
    collegeName: 'National Institute of Technology',
    course: 'B.Tech',
    branch: 'Computer Science & Engineering (CSE)',
    graduationYear: '2020',
    company: 'Acme Labs Pvt Ltd',
    jobRole: 'Principal Architect',
    linkedin: 'https://linkedin.com/in/ravi-kumar'
  };
  const resumeExtracted = {
    name: 'Ravi Kumar',
    college: 'National Institute of Technology',
    degree: 'B.Tech',
    branch: 'Computer Science & Engineering (CSE)',
    graduation_year: '2020',
    company: 'Acme Labs Pvt Ltd',
    job_title: 'Principal Architect'
  };

  const trust = buildTrustScore(formProfile, resumeExtracted);
  assert.ok(trust.breakdown.company.score >= 6);
  assert.ok(trust.total >= 90);
});
