/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import { DEFAULT_RALLY_CONTEXT } from '@customagile/widget-ai/types/rally-context';
import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import type { Blocker, BlockedWorkDataProvider, BlockedWorkFetchParams, BlockedWorkPage } from './types';

// ── Mock blocker data ──────────────────────────────────────────────────

const MOCK_BLOCKERS: Blocker[] = [
  {
    ObjectID: 2001,
    WorkProduct: {
      _ref: '/hierarchicalrequirement/10001',
      _refObjectName: 'US10001',
      ObjectID: 10001,
      FormattedID: 'US10001',
      Name: 'User can reset password via email link',
      Iteration: { _ref: '/iteration/5001', Name: 'Sprint 24.3', _refObjectName: 'Sprint 24.3' },
      Release: { _ref: '/release/6001', Name: 'Q3 2026', _refObjectName: 'Q3 2026' },
      Milestones: null,
    },
    Project: { _ref: '/project/9001', _refObjectName: 'Platform Team', ObjectID: 9001 },
    BlockedBy: {
      _ref: '/user/101',
      _refObjectName: 'Alice Smith',
      ObjectID: 101,
      EmailAddress: 'alice@example.com',
      Disabled: false,
    },
    BlockedReason: 'Waiting on security review from the infosec team before we can proceed with the implementation.',
    CreationDate: '2026-04-28T14:23:00.000Z',
    Disabled: false,
  },
  {
    ObjectID: 2002,
    WorkProduct: {
      _ref: '/defect/10002',
      _refObjectName: 'DE10002',
      ObjectID: 10002,
      FormattedID: 'DE10002',
      Name: 'Login page crashes on Safari 17 when autofill is triggered',
      Iteration: { _ref: '/iteration/5001', Name: 'Sprint 24.3', _refObjectName: 'Sprint 24.3' },
      Release: { _ref: '/release/6001', Name: 'Q3 2026', _refObjectName: 'Q3 2026' },
      Milestones: null,
    },
    Project: { _ref: '/project/9001', _refObjectName: 'Platform Team', ObjectID: 9001 },
    BlockedBy: {
      _ref: '/user/102',
      _refObjectName: 'Bob Jones',
      ObjectID: 102,
      EmailAddress: 'bob@example.com',
      Disabled: false,
    },
    BlockedReason: 'Reproduction environment not yet available — Dev Ops is provisioning a macOS runner.',
    CreationDate: '2026-04-27T09:11:00.000Z',
    Disabled: false,
  },
  {
    ObjectID: 2003,
    WorkProduct: {
      _ref: '/hierarchicalrequirement/10003',
      _refObjectName: 'US10003',
      ObjectID: 10003,
      FormattedID: 'US10003',
      Name: 'Export dashboard data to Excel',
      Iteration: null,
      Release: { _ref: '/release/6002', Name: 'Q4 2026', _refObjectName: 'Q4 2026' },
      Milestones: null,
    },
    Project: { _ref: '/project/9002', _refObjectName: 'Reporting Squad', ObjectID: 9002 },
    BlockedBy: {
      _ref: '/user/103',
      _refObjectName: 'Carol Lee',
      ObjectID: 103,
      EmailAddress: 'carol@example.com',
      Disabled: false,
    },
    BlockedReason: null,
    CreationDate: '2026-04-26T16:45:00.000Z',
    Disabled: false,
  },
  {
    ObjectID: 2004,
    WorkProduct: {
      _ref: '/hierarchicalrequirement/10004',
      _refObjectName: 'US10004',
      ObjectID: 10004,
      FormattedID: 'US10004',
      Name: 'Implement GDPR data deletion workflow',
      Iteration: { _ref: '/iteration/5002', Name: 'Sprint 24.4', _refObjectName: 'Sprint 24.4' },
      Release: { _ref: '/release/6001', Name: 'Q3 2026', _refObjectName: 'Q3 2026' },
      Milestones: { Count: 1, _tagsNameArray: [{ _ref: '/milestone/7001', Name: 'GDPR Compliance Gate' }] },
    },
    Project: { _ref: '/project/9001', _refObjectName: 'Platform Team', ObjectID: 9001 },
    BlockedBy: {
      _ref: '/user/104',
      _refObjectName: 'Dan Xu',
      ObjectID: 104,
      EmailAddress: 'danx@example.com',
      Disabled: true,  // disabled user — greyed out
    },
    BlockedReason: 'Legal sign-off on data deletion policy is pending.',
    CreationDate: '2026-04-25T11:30:00.000Z',
    Disabled: false,
  },
  {
    ObjectID: 2005,
    WorkProduct: {
      _ref: '/defect/10005',
      _refObjectName: 'DE10005',
      ObjectID: 10005,
      FormattedID: 'DE10005',
      Name: 'API rate limiter rejects valid webhook callbacks',
      Iteration: { _ref: '/iteration/5001', Name: 'Sprint 24.3', _refObjectName: 'Sprint 24.3' },
      Release: null,
      Milestones: null,
    },
    Project: { _ref: '/project/9003', _refObjectName: 'Integrations Team', ObjectID: 9003 },
    BlockedBy: {
      _ref: '/user/105',
      _refObjectName: 'Eva Martinez',
      ObjectID: 105,
      EmailAddress: 'eva@example.com',
      Disabled: false,
    },
    BlockedReason: 'Need to confirm rate-limit thresholds with the vendor before adjusting config.',
    CreationDate: '2026-04-24T08:00:00.000Z',
    Disabled: false,
  },
  {
    ObjectID: 2006,
    WorkProduct: {
      _ref: '/hierarchicalrequirement/10006',
      _refObjectName: 'US10006',
      ObjectID: 10006,
      FormattedID: 'US10006',
      Name: 'Add dark mode to the admin console',
      Iteration: { _ref: '/iteration/5002', Name: 'Sprint 24.4', _refObjectName: 'Sprint 24.4' },
      Release: { _ref: '/release/6002', Name: 'Q4 2026', _refObjectName: 'Q4 2026' },
      Milestones: null,
    },
    Project: { _ref: '/project/9004', _refObjectName: 'UX & Accessibility', ObjectID: 9004 },
    BlockedBy: {
      _ref: '/user/106',
      _refObjectName: 'Frank O\'Brien',
      ObjectID: 106,
      EmailAddress: 'frank@example.com',
      Disabled: false,
    },
    BlockedReason: null,
    CreationDate: '2026-04-23T13:55:00.000Z',
    Disabled: false,
  },
  {
    ObjectID: 2007,
    WorkProduct: {
      _ref: '/defect/10007',
      _refObjectName: 'DE10007',
      ObjectID: 10007,
      FormattedID: 'DE10007',
      Name: 'Notification emails sent twice on retry',
      Iteration: null,
      Release: null,
      Milestones: null,
    },
    Project: { _ref: '/project/9003', _refObjectName: 'Integrations Team', ObjectID: 9003 },
    BlockedBy: {
      _ref: '/user/107',
      _refObjectName: 'Grace Kim',
      ObjectID: 107,
      EmailAddress: 'grace@example.com',
      Disabled: true,  // another disabled user
    },
    BlockedReason: 'Waiting on email service provider to confirm idempotency key support.',
    CreationDate: '2026-04-22T17:20:00.000Z',
    Disabled: false,
  },
  {
    ObjectID: 2008,
    WorkProduct: {
      _ref: '/hierarchicalrequirement/10008',
      _refObjectName: 'US10008',
      ObjectID: 10008,
      FormattedID: 'US10008',
      Name: 'Migrate CI/CD pipeline to GitHub Actions',
      Iteration: { _ref: '/iteration/5001', Name: 'Sprint 24.3', _refObjectName: 'Sprint 24.3' },
      Release: { _ref: '/release/6001', Name: 'Q3 2026', _refObjectName: 'Q3 2026' },
      Milestones: null,
    },
    Project: { _ref: '/project/9001', _refObjectName: 'Platform Team', ObjectID: 9001 },
    BlockedBy: {
      _ref: '/user/101',
      _refObjectName: 'Alice Smith',
      ObjectID: 101,
      EmailAddress: 'alice@example.com',
      Disabled: false,
    },
    BlockedReason: 'Access to self-hosted runner pool not yet granted by IT.',
    CreationDate: '2026-04-21T10:10:00.000Z',
    Disabled: false,
  },
];

// ── Mock provider ──────────────────────────────────────────────────────

export const mockProvider: BlockedWorkDataProvider = {
  async fetchBlockers(params: BlockedWorkFetchParams): Promise<BlockedWorkPage> {
    const pageSize = params.pageSize ?? 200;
    const start = params.start ?? 1;
    const startIdx = start - 1;
    const items = MOCK_BLOCKERS.slice(startIdx, startIdx + pageSize);

    return {
      items,
      totalCount: MOCK_BLOCKERS.length,
      startIndex: start,
    };
  },
};

// ── Mock view filter (Sprint 24.3 — matches several items) ─────────────

// The mockContext uses an iteration view filter scoped to Sprint 24.3.
// With ignoreViewFilter: false (default), items not in Sprint 24.3
// (US10003, DE10005 without iteration, US10006 Sprint 24.4,
//  DE10007 no iteration, US10004 Sprint 24.4) are filtered client-side.

// ── Mock context ──────────────────────────────────────────────────────

export const mockContext: RallyContext = {
  ...DEFAULT_RALLY_CONTEXT,
  User: {
    _ref: '/user/999',
    DisplayName: 'Mock User',
    EmailAddress: 'mock@example.com',
    UserName: 'mockuser',
    ObjectID: 999,
  },
  GlobalScope: {
    Project: '/project/9001',
    ProjectScopeDown: true,
    ProjectScopeUp: false,
    Workspace: '/workspace/1',
  },
  ViewFilter: {
    // Simulates an active Iteration view filter on Sprint 24.3.
    // The app reads this to filter blockers client-side.
    query: '(Iteration.Name = "Sprint 24.3")',
    filters: [
      {
        _type: 'Iteration',
        name: 'Sprint 24.3',
        _ref: '/iteration/5001',
      },
    ],
  },
  WidgetName: 'Blocked Work',
  WidgetUUID: 'mock-blocked-work-uuid',
  isEditMode: false,
  Settings: {
    ignoreViewFilter: false,
  },
};
