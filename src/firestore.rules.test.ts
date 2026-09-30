/**
 * Firestore Security Rules Threat Model & Verification Suite
 * Verifies that the Dirty Dozen threat vectors are rejected by firestore.rules.
 */

export interface TestPayloadFailure {
  description: string;
  expectedResult: 'PERMISSION_DENIED';
  path: string;
  payload: Record<string, unknown>;
}

export const DIRTY_DOZEN_TESTS: TestPayloadFailure[] = [
  {
    description: 'Anonymous write to /events',
    expectedResult: 'PERMISSION_DENIED',
    path: '/events/unauth-1',
    payload: { title: 'Hack Event', targetDate: '2027-01-01T00:00:00.000Z' },
  },
  {
    description: 'Write by non-allowlisted authenticated user',
    expectedResult: 'PERMISSION_DENIED',
    path: '/events/non-allowlisted',
    payload: {
      title: 'Spam Event',
      targetDate: '2027-01-01T00:00:00.000Z',
      alarmSound: 'chime',
      createdByUid: 'stranger-uid',
      createdByEmail: 'stranger@gmail.com',
      createdAt: '2026-09-29T13:00:00.000Z',
    },
  },
  {
    description: 'Identity spoofing UID mismatch',
    expectedResult: 'PERMISSION_DENIED',
    path: '/events/spoof-uid',
    payload: {
      title: 'Spoofed UID Event',
      targetDate: '2027-01-01T00:00:00.000Z',
      alarmSound: 'chime',
      createdByUid: 'different-uid',
      createdByEmail: 'pete.teoh@gmail.com',
      createdAt: '2026-09-29T13:00:00.000Z',
    },
  },
  {
    description: 'Email spoofing mismatch',
    expectedResult: 'PERMISSION_DENIED',
    path: '/events/spoof-email',
    payload: {
      title: 'Spoofed Email',
      targetDate: '2027-01-01T00:00:00.000Z',
      alarmSound: 'chime',
      createdByUid: 'real-uid',
      createdByEmail: 'pete.teoh@gmail.com',
      createdAt: '2026-09-29T13:00:00.000Z',
    },
  },
  {
    description: 'Denial of wallet oversize title',
    expectedResult: 'PERMISSION_DENIED',
    path: '/events/oversize-title',
    payload: {
      title: 'A'.repeat(5000),
      targetDate: '2027-01-01T00:00:00.000Z',
      alarmSound: 'chime',
      createdByUid: 'real-uid',
      createdByEmail: 'pete.teoh@gmail.com',
      createdAt: '2026-09-29T13:00:00.000Z',
    },
  },
  {
    description: 'Invalid alarm enum injection',
    expectedResult: 'PERMISSION_DENIED',
    path: '/events/bad-sound',
    payload: {
      title: 'Bad Sound Event',
      targetDate: '2027-01-01T00:00:00.000Z',
      alarmSound: '<script>alert(1)</script>',
      createdByUid: 'real-uid',
      createdByEmail: 'pete.teoh@gmail.com',
      createdAt: '2026-09-29T13:00:00.000Z',
    },
  },
  {
    description: 'Ghost field injection in update',
    expectedResult: 'PERMISSION_DENIED',
    path: '/events/ghost-field',
    payload: {
      title: 'Modified Title',
      ghostField: 'unauthorized',
    },
  },
  {
    description: 'Attempting to change immutable createdByUid',
    expectedResult: 'PERMISSION_DENIED',
    path: '/events/change-owner',
    payload: {
      createdByUid: 'new-owner-uid',
    },
  },
  {
    description: 'Unverified email attempt',
    expectedResult: 'PERMISSION_DENIED',
    path: '/events/unverified',
    payload: {
      title: 'Unverified Event',
      targetDate: '2027-01-01T00:00:00.000Z',
      alarmSound: 'chime',
      createdByUid: 'unverified-uid',
      createdByEmail: 'unverified@gmail.com',
      createdAt: '2026-09-29T13:00:00.000Z',
    },
  },
  {
    description: 'Path variable poisoning (oversized ID)',
    expectedResult: 'PERMISSION_DENIED',
    path: `/events/${'bad-id'.repeat(40)}`,
    payload: {
      title: 'Bad Path ID Event',
    },
  },
  {
    description: 'Unauthorized self-grant allowlist document creation',
    expectedResult: 'PERMISSION_DENIED',
    path: '/allowlist/hacker-uid',
    payload: {
      email: 'hacker@example.com',
      role: 'admin',
      addedAt: '2026-09-29T13:00:00.000Z',
    },
  },
  {
    description: 'Unauthorized deletion of someone else’s event',
    expectedResult: 'PERMISSION_DENIED',
    path: '/events/victim-event',
    payload: {},
  },
];
