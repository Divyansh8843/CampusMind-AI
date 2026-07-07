import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrustScore, TRUST_WEIGHTS } from '../services/alumniTrustEngine.js';

test('trust weights sum to 100', () => {
  const total = Object.values(TRUST_WEIGHTS).reduce((sum, value) => sum + value, 0);
  assert.equal(total, 100);
});

test('linkedin score stays zero when not provided', () => {
  const trust = buildTrustScore(
    {
      name: 'Alex',
      collegeName: 'Delhi Technological University',
      course: 'B.Tech',
      branch: 'Computer Science & Engineering (CSE)',
      graduationYear: '2021',
      company: 'Microsoft',
      jobRole: 'Software Engineer'
    },
    {
      name: 'Alex',
      college: 'Delhi Technological University',
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering (CSE)',
      graduation_year: '2021',
      company: 'Microsoft',
      job_title: 'Software Engineer'
    }
  );

  assert.equal(trust.breakdown.linkedin.score, 0);
  assert.ok(trust.total >= 80);
});
