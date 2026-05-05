/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import type { WidgetSettings } from '@customagile/widget-ai/components/settings';

// ── Blocker API shape ──────────────────────────────────────────────────

/**
 * Ref-like object returned inline within a Blocker record.
 * The Rally /blocker endpoint embeds lightweight refs rather than full objects.
 */
export interface BlockerRef {
  _ref: string;
  _refObjectName?: string;
  ObjectID?: number;
  Name?: string;
  FormattedID?: string;
}

/** A user ref with disabled status */
export interface BlockerUser {
  _ref: string;
  _refObjectName: string;
  ObjectID?: number;
  EmailAddress?: string;
  Disabled?: boolean;
}

/** Timebox ref (Iteration or Release) */
export interface TimeboxRef {
  _ref: string;
  Name?: string;
  _refObjectName?: string;
}

/** Milestone ref */
export interface MilestoneRef {
  _ref: string;
  Name?: string;
  _refObjectName?: string;
}

/** Milestones collection embedded on a WorkProduct */
export interface MilestonesCollection {
  Count: number;
  _tagsNameArray?: MilestoneRef[];
  _ref?: string;
}

/** The WorkProduct embedded in a Blocker record */
export interface BlockerWorkProduct {
  _ref: string;
  _refObjectName?: string;
  ObjectID?: number;
  FormattedID?: string;
  Name?: string;
  Iteration?: TimeboxRef | null;
  Release?: TimeboxRef | null;
  Milestones?: MilestonesCollection | null;
}

/**
 * A single row from /slm/webservice/v2.x/blocker.
 * The endpoint returns Blocker objects, not artifact collections.
 */
export interface Blocker {
  ObjectID: number;
  /** The blocked artifact (Story, Defect, etc.) */
  WorkProduct: BlockerWorkProduct;
  /** The project the block belongs to */
  Project: BlockerRef | null;
  /** The user who created the block */
  BlockedBy: BlockerUser;
  /** Optional text reason for the block */
  BlockedReason: string | null;
  /** ISO date string when the block was created */
  CreationDate: string;
  /** Whether the blocking user is disabled */
  Disabled: boolean;
}

// ── View-filter shape (from RallyContext.ViewFilter) ───────────────────

export type ViewFilterType = 'iteration' | 'release' | 'milestone' | 'none';

export interface ParsedViewFilter {
  type: ViewFilterType;
  /** For iteration/release: the name to match */
  name?: string;
  /** For milestone: the _ref to match */
  ref?: string;
}

// ── App settings ───────────────────────────────────────────────────────

export interface BlockedWorkSettings extends WidgetSettings {
  /**
   * When true (or "true"), the widget ignores any active view filter and shows
   * all blocked work in the current project scope.
   * Default: false (view filter is respected)
   *
   * Typed as boolean | string because Rally stores widget settings as strings
   * when they come back from the API — the value may be "true" or "false".
   */
  ignoreViewFilter: boolean | string;
  [key: string]: unknown;
}

// ── DataProvider interface ─────────────────────────────────────────────

export interface BlockedWorkFetchParams {
  /** WSAPI workspace ref, e.g. "/workspace/12345" */
  workspace?: string;
  /** WSAPI project ref, e.g. "/project/12345" */
  project?: string;
  /** Whether to include child projects */
  projectScopeDown?: boolean;
  /** Whether to include parent projects */
  projectScopeUp?: boolean;
  /** Starting index for paging (1-based) */
  start?: number;
  /** Page size — Broadcom spec uses 200 */
  pageSize?: number;
}

export interface BlockedWorkPage {
  items: Blocker[];
  totalCount: number;
  startIndex: number;
}

export interface BlockedWorkDataProvider {
  /**
   * Fetch a page of blockers from /slm/webservice/v2.x/blocker,
   * sorted by CreationDate DESC.
   */
  fetchBlockers(params: BlockedWorkFetchParams): Promise<BlockedWorkPage>;
}
