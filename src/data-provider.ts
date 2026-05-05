/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import type {
  BlockedWorkDataProvider,
  BlockedWorkFetchParams,
  BlockedWorkPage,
  Blocker,
} from './types';

// ── Constants ──────────────────────────────────────────────────────────

const BLOCKER_ENDPOINT = '/slm/webservice/v2.x/blocker';

const FETCH_FIELDS = [
  'WorkProduct',
  'Project',
  'Name',
  'Description',
  'FormattedID',
  'CreationDate',
  'BlockedBy',
  'BlockedReason',
  'Disabled',
  'ObjectID',
  'EmailAddress',
  'Iteration',
  'Release',
  'Milestones',
].join(',');

// ── Raw blocker response shape ─────────────────────────────────────────

interface RawBlockerResponse {
  QueryResult: {
    Results: Record<string, unknown>[];
    TotalResultCount: number;
    StartIndex: number;
    PageSize: number;
    Errors?: string[];
  };
}

// ── Mapper ─────────────────────────────────────────────────────────────

function mapBlocker(raw: Record<string, unknown>): Blocker {
  const wp = raw.WorkProduct as Record<string, unknown> | null;
  const blockedBy = raw.BlockedBy as Record<string, unknown> | null;
  const project = raw.Project as Record<string, unknown> | null;

  return {
    ObjectID: raw.ObjectID as number,
    WorkProduct: wp
      ? {
          _ref: (wp._ref as string) ?? '',
          _refObjectName: wp._refObjectName as string | undefined,
          ObjectID: wp.ObjectID as number | undefined,
          FormattedID: wp.FormattedID as string | undefined,
          Name: wp.Name as string | undefined,
          Iteration: wp.Iteration as { _ref: string; Name?: string; _refObjectName?: string } | null ?? null,
          Release: wp.Release as { _ref: string; Name?: string; _refObjectName?: string } | null ?? null,
          Milestones: wp.Milestones as {
            Count: number;
            _tagsNameArray?: { _ref: string; Name?: string }[];
            _ref?: string;
          } | null ?? null,
        }
      : {
          _ref: '',
        },
    Project: project
      ? {
          _ref: (project._ref as string) ?? '',
          _refObjectName: project._refObjectName as string | undefined,
          ObjectID: project.ObjectID as number | undefined,
        }
      : null,
    BlockedBy: blockedBy
      ? {
          _ref: (blockedBy._ref as string) ?? '',
          _refObjectName: (blockedBy._refObjectName as string) ?? '',
          ObjectID: blockedBy.ObjectID as number | undefined,
          EmailAddress: blockedBy.EmailAddress as string | undefined,
          Disabled: (blockedBy.Disabled as boolean) ?? false,
        }
      : {
          _ref: '',
          _refObjectName: 'Unknown',
          Disabled: false,
        },
    BlockedReason: (raw.BlockedReason as string | null) ?? null,
    CreationDate: (raw.CreationDate as string) ?? '',
    Disabled: (raw.Disabled as boolean) ?? false,
  };
}

// ── Provider factory ───────────────────────────────────────────────────

export function createRallyProvider(ctx: RallyContext): BlockedWorkDataProvider {
  const rallyOrigin = ctx.Url?.origin ?? '';

  return {
    async fetchBlockers(params: BlockedWorkFetchParams): Promise<BlockedWorkPage> {
      const workspaceRef =
        typeof ctx.GlobalScope.Workspace === 'string'
          ? ctx.GlobalScope.Workspace
          : ctx.GlobalScope.Workspace._ref;

      const projectRef =
        typeof ctx.GlobalScope.Project === 'string'
          ? ctx.GlobalScope.Project
          : ctx.GlobalScope.Project._ref;

      const pageSize = params.pageSize ?? 200;
      const start = params.start ?? 1;

      const queryParams: Record<string, string | number | boolean> = {
        fetch: FETCH_FIELDS,
        order: 'CreationDate DESC',
        pagesize: pageSize,
        start,
      };

      if (workspaceRef) queryParams.workspace = workspaceRef;
      if (projectRef) queryParams.project = projectRef;

      const scopeDown = params.projectScopeDown ?? ctx.GlobalScope.ProjectScopeDown;
      const scopeUp = params.projectScopeUp ?? ctx.GlobalScope.ProjectScopeUp;
      if (scopeDown !== undefined) queryParams.projectScopeDown = scopeDown;
      if (scopeUp !== undefined) queryParams.projectScopeUp = scopeUp;

      const qs = Object.entries(queryParams)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');

      // Use relative URL when in Rally context (same-origin), or prefix with origin for dev
      const baseUrl = rallyOrigin ? `${rallyOrigin}${BLOCKER_ENDPOINT}` : BLOCKER_ENDPOINT;
      const url = `${baseUrl}?${qs}`;

      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Blocker API error: ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as RawBlockerResponse;
      const qr = data.QueryResult;

      if (qr.Errors && qr.Errors.length > 0) {
        throw new Error(`Blocker query error: ${qr.Errors.join('; ')}`);
      }

      return {
        items: qr.Results.map((r) => mapBlocker(r)),
        totalCount: qr.TotalResultCount,
        startIndex: qr.StartIndex,
      };
    },
  };
}
