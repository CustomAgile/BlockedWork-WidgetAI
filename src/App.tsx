/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '@customagile/widget-ai/styles/rally-app-tokens.css';

import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import { AppHeader } from '@customagile/widget-ai/components/AppHeader';
import { EditModePanel, SettingRow } from '@customagile/widget-ai/components/EditModePanel';
import { Checkbox } from '@customagile/widget-ai/components/Checkbox';
import { useWidgetSettings, defineWidgetSettings } from '@customagile/widget-ai/components/settings';

import type {
  BlockedWorkDataProvider,
  BlockedWorkSettings,
  Blocker,
  ParsedViewFilter,
} from './types';

// ── Constants ──────────────────────────────────────────────────────────

const PAGE_SIZE = 200;

const SETTINGS_DEFAULTS = defineWidgetSettings<BlockedWorkSettings>({
  ignoreViewFilter: false,
});

declare const __USE_MOCK__: boolean | undefined;
const IS_MOCK = typeof __USE_MOCK__ !== 'undefined' ? __USE_MOCK__ : true;

// ── View filter parsing ────────────────────────────────────────────────

/**
 * Parse the RallyContext ViewFilter into a structured shape we can use for
 * client-side filtering. The ViewFilter.filters array contains objects with
 * a _type (Iteration, Release, Milestone) and name/_ref fields.
 */
function parseViewFilter(ctx: RallyContext): ParsedViewFilter {
  const filters = ctx.ViewFilter?.filters;
  if (!filters || !Array.isArray(filters) || filters.length === 0) {
    return { type: 'none' };
  }

  // Find the first recognized timebox filter
  for (const f of filters) {
    const filter = f as Record<string, unknown>;
    const ftype = (filter._type as string | undefined)?.toLowerCase();

    if (ftype === 'iteration') {
      const name = (filter.name ?? filter._refObjectName) as string | undefined;
      if (name) return { type: 'iteration', name };
    }

    if (ftype === 'release') {
      const name = (filter.name ?? filter._refObjectName) as string | undefined;
      if (name) return { type: 'release', name };
    }

    if (ftype === 'milestone') {
      const ref = (filter._ref) as string | undefined;
      if (ref) return { type: 'milestone', ref };
    }
  }

  return { type: 'none' };
}

/**
 * Decide whether a blocker's WorkProduct passes the active view filter.
 * Returns true if the item should be shown.
 */
function passesViewFilter(blocker: Blocker, vf: ParsedViewFilter): boolean {
  if (vf.type === 'none') return true;
  const wp = blocker.WorkProduct;

  if (vf.type === 'iteration') {
    const iterName = wp.Iteration?._refObjectName ?? wp.Iteration?.Name;
    return iterName === vf.name;
  }

  if (vf.type === 'release') {
    const relName = wp.Release?._refObjectName ?? wp.Release?.Name;
    return relName === vf.name;
  }

  if (vf.type === 'milestone') {
    const milestones = wp.Milestones?._tagsNameArray ?? [];
    return milestones.some((m) => m._ref === vf.ref);
  }

  return true;
}

// ── Date formatter ─────────────────────────────────────────────────────

/** Format an ISO date string as a locale date string, e.g. "4/28/2026". */
function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ── Rally URL builder ──────────────────────────────────────────────────

/** Build a Rally detail-page URL for a work product ref. */
function buildDetailUrl(rallyOrigin: string, ref: string): string {
  if (!ref) return '#';
  // refs like /hierarchicalrequirement/12345 → detail/userstory/12345
  // refs like /defect/12345 → detail/defect/12345
  const parts = ref.replace(/^\//, '').split('/');
  if (parts.length < 2) return '#';
  const [type, oid] = parts;
  const typeMap: Record<string, string> = {
    hierarchicalrequirement: 'userstory',
    defect: 'defect',
    testcase: 'testcase',
    task: 'task',
    portfolioitem: 'portfolioitem',
  };
  const urlType = typeMap[type.toLowerCase()] ?? type.toLowerCase();
  const base = rallyOrigin || '';
  return `${base}/#/detail/${urlType}/${oid}`;
}

// ── Profile image URL ──────────────────────────────────────────────────

/** Build a Rally user profile image URL (40px). */
function profileImageUrl(rallyOrigin: string, userRef: string): string {
  if (!userRef) return '';
  const oid = userRef.split('/').pop() ?? '';
  const base = rallyOrigin || '';
  return `${base}/slm/profile/image/${oid}/40.sp`;
}

// ── Blocker row component ──────────────────────────────────────────────

interface BlockerRowProps {
  blocker: Blocker;
  rallyOrigin: string;
  showProject: boolean;
}

function BlockerRow({ blocker, rallyOrigin, showProject }: BlockerRowProps) {
  const wp = blocker.WorkProduct;
  const user = blocker.BlockedBy;

  const fid = wp.FormattedID ?? '';
  const name = wp.Name ?? wp._refObjectName ?? '';
  const detailUrl = buildDetailUrl(rallyOrigin, wp._ref);
  const imgUrl = profileImageUrl(rallyOrigin, user._ref);
  const userName = user._refObjectName ?? '';
  const isDisabled = user.Disabled ?? false;
  const reason = blocker.BlockedReason;
  const date = formatDate(blocker.CreationDate);
  const projectName = blocker.Project?._refObjectName ?? '';

  return (
    <li
      style={{
        display: 'flex',
        gap: 'var(--ca-space-3)',
        padding: 'var(--ca-space-3) 0',
        borderBottom: '1px solid var(--ca-border-subtle)',
        alignItems: 'flex-start',
      }}
    >
      {/* User avatar */}
      <div
        style={{
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: 'var(--ca-surface-raised)',
          border: '1px solid var(--ca-border-subtle)',
          opacity: isDisabled ? 0.45 : 1,
        }}
      >
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={userName}
            width={40}
            height={40}
            style={{ display: 'block' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--ca-font-size-base)',
              color: 'var(--ca-text-secondary)',
              fontWeight: 600,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Artifact link + name */}
        <div style={{ marginBottom: 'var(--ca-space-1)' }}>
          <a
            href={detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontWeight: 600,
              color: 'var(--ca-text-link)',
              textDecoration: 'none',
              marginRight: 'var(--ca-space-1)',
              fontSize: 'var(--ca-font-size-sm)',
            }}
          >
            {fid}
          </a>
          <span
            style={{
              color: 'var(--ca-text-primary)',
              fontSize: 'var(--ca-font-size-sm)',
            }}
          >
            {name}
          </span>
        </div>

        {/* Blocker info: user + date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ca-space-1)',
            flexWrap: 'wrap',
            marginBottom: reason ? 'var(--ca-space-1)' : 0,
            fontSize: 'var(--ca-font-size-sm)',
            color: 'var(--ca-text-secondary)',
          }}
        >
          <span
            title={
              isDisabled
                ? `${userName} (disabled user)`
                : user.EmailAddress ?? userName
            }
            style={{
              color: isDisabled ? 'var(--ca-text-disabled)' : 'var(--ca-text-primary)',
              fontStyle: isDisabled ? 'italic' : 'normal',
            }}
          >
            {isDisabled ? (
              <>
                <span aria-hidden="true">[disabled] </span>
                <span className="sr-only">Disabled user: </span>
                {userName}
              </>
            ) : (
              userName
            )}
          </span>
          <span aria-hidden="true">&bull;</span>
          <span>{date}</span>

          {/* Project — only shown when cross-project data is present */}
          {showProject && projectName && (
            <>
              <span aria-hidden="true">&bull;</span>
              <span>{projectName}</span>
            </>
          )}
        </div>

        {/* Blocked reason */}
        {reason && (
          <div
            style={{
              fontSize: 'var(--ca-font-size-sm)',
              color: 'var(--ca-text-secondary)',
              fontStyle: 'italic',
            }}
          >
            {reason}
          </div>
        )}
      </div>
    </li>
  );
}

// ── App props ──────────────────────────────────────────────────────────

interface AppProps {
  rallyContext: RallyContext;
  data: BlockedWorkDataProvider;
}

// ── App component ──────────────────────────────────────────────────────

export default function App({ rallyContext, data }: AppProps) {
  // ── Settings ───────────────────────────────────────────────────────
  const { settings, updateSetting, updateSettings } = useWidgetSettings<BlockedWorkSettings>(
    rallyContext,
    SETTINGS_DEFAULTS,
  );

  // ── Data state ─────────────────────────────────────────────────────
  const [allItems, setAllItems] = useState<Blocker[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── View filter ────────────────────────────────────────────────────
  const viewFilter = useMemo(() => parseViewFilter(rallyContext), [rallyContext]);

  // ── Context scope ──────────────────────────────────────────────────
  const workspaceRef = useMemo(() => {
    const ws = rallyContext.GlobalScope.Workspace;
    return typeof ws === 'string' ? ws : ws._ref;
  }, [rallyContext]);

  const projectRef = useMemo(() => {
    const proj = rallyContext.GlobalScope.Project;
    return typeof proj === 'string' ? proj : proj._ref;
  }, [rallyContext]);

  const rallyOrigin = rallyContext.Url?.origin ?? '';

  // ── Initial load ───────────────────────────────────────────────────
  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAllItems([]);
    setTotalCount(0);
    setLoadedCount(0);

    try {
      const page = await data.fetchBlockers({
        workspace: workspaceRef || undefined,
        project: projectRef || undefined,
        projectScopeDown: rallyContext.GlobalScope.ProjectScopeDown,
        projectScopeUp: rallyContext.GlobalScope.ProjectScopeUp,
        start: 1,
        pageSize: PAGE_SIZE,
      });

      setAllItems(page.items);
      setTotalCount(page.totalCount);
      setLoadedCount(page.items.length + (page.startIndex - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blocked items');
    } finally {
      setLoading(false);
    }
  }, [data, workspaceRef, projectRef, rallyContext.GlobalScope]);

  useEffect(() => {
    if (!rallyContext.isEditMode) {
      loadInitial();
    }
  }, [loadInitial, rallyContext.isEditMode]);

  // ── Show More ──────────────────────────────────────────────────────
  const handleShowMore = useCallback(async () => {
    if (loadingMore || loadedCount >= totalCount) return;
    setLoadingMore(true);

    try {
      const page = await data.fetchBlockers({
        workspace: workspaceRef || undefined,
        project: projectRef || undefined,
        projectScopeDown: rallyContext.GlobalScope.ProjectScopeDown,
        projectScopeUp: rallyContext.GlobalScope.ProjectScopeUp,
        start: loadedCount + 1,
        pageSize: PAGE_SIZE,
      });

      setAllItems((prev) => [...prev, ...page.items]);
      setLoadedCount((prev) => prev + page.items.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loadedCount, totalCount, data, workspaceRef, projectRef, rallyContext.GlobalScope]);

  // ── Client-side view filter application ────────────────────────────
  const displayItems = useMemo(() => {
    const ignoreFilter = settings.ignoreViewFilter === true || settings.ignoreViewFilter === 'true';
    if (ignoreFilter || viewFilter.type === 'none') {
      return allItems;
    }
    return allItems.filter((b) => passesViewFilter(b, viewFilter));
  }, [allItems, viewFilter, settings.ignoreViewFilter]);

  // ── Cross-project detection ────────────────────────────────────────
  // Show the Project column when items come from more than one project.
  const showProject = useMemo(() => {
    const projects = new Set(displayItems.map((b) => b.Project?._ref).filter(Boolean));
    return projects.size > 1;
  }, [displayItems]);

  // ── EditMode ───────────────────────────────────────────────────────
  if (rallyContext.isEditMode) {
    return (
      <EditModePanel
        appName="Blocked Work"
        version="0.1.0"
        appSlug="blocked-work"
        settings={settings as unknown as Record<string, unknown>}
        onSave={(dirty: Partial<BlockedWorkSettings>) => updateSettings(dirty)}
        onClose={() => { /* Rally controls EditMode exit */ }}
      >
        <SettingRow label="Ignore View Filter" settingKey="ignoreViewFilter">
          <Checkbox
            checked={settings.ignoreViewFilter === true || settings.ignoreViewFilter === 'true'}
            onChange={(checked) => updateSetting('ignoreViewFilter', checked)}
            label="Ignore the current Iteration / Release / Milestone view filter and show all blocked items"
          />
        </SettingRow>
      </EditModePanel>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          fontFamily: 'var(--ca-font-family)',
          backgroundColor: 'var(--ca-surface-page)',
          color: 'var(--ca-text-primary)',
        }}
      >
        <AppHeader title="Blocked Work" />
        <div
          aria-live="polite"
          aria-busy="true"
          style={{
            padding: 'var(--ca-space-6)',
            textAlign: 'center',
            color: 'var(--ca-text-secondary)',
            fontSize: 'var(--ca-font-size-sm)',
          }}
        >
          Loading blocked items...
        </div>
      </div>
    );
  }

  // ── View filter indicator ──────────────────────────────────────────
  const ignoreFilter = settings.ignoreViewFilter === true || settings.ignoreViewFilter === 'true';
  const isFilterActive = viewFilter.type !== 'none' && !ignoreFilter;
  let filterLabel = '';
  if (isFilterActive) {
    if (viewFilter.type === 'iteration') filterLabel = `Iteration: ${viewFilter.name}`;
    else if (viewFilter.type === 'release') filterLabel = `Release: ${viewFilter.name}`;
    else if (viewFilter.type === 'milestone') filterLabel = 'Milestone filter active';
  }

  // ── Count display ──────────────────────────────────────────────────
  const shownCount = displayItems.length;
  const countLabel = isFilterActive
    ? `Showing ${shownCount} blocked item${shownCount !== 1 ? 's' : ''} (filtered)`
    : `${totalCount} blocked item${totalCount !== 1 ? 's' : ''} total`;

  // ── Normal view ────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'var(--ca-font-family)',
        backgroundColor: 'var(--ca-surface-page)',
        color: 'var(--ca-text-primary)',
        overflow: 'hidden',
      }}
    >
      <AppHeader
        title="Blocked Work"
        help={{
          content: (
            <>
              <p>
                This widget shows all blocked work items in your project scope, sorted by
                when they were blocked (newest first).
              </p>
              <p>
                Each row shows the blocked artifact (click the ID to open it), the user who
                blocked it, the date it was blocked, an optional reason, and the project.
                Disabled users are shown in italics.
              </p>
              <p>
                By default, the widget respects the active Iteration, Release, or Milestone
                view filter. Use <strong>Edit Mode</strong> to turn this off and see all
                blocked items regardless of the current view filter.
              </p>
              {IS_MOCK && (
                <p style={{ color: 'var(--ca-text-secondary)', fontSize: 'var(--ca-font-size-sm)' }}>
                  Running in mock mode — displaying sample data. Items 4 and 7 have disabled blockers.
                </p>
              )}
            </>
          ),
        }}
      />

      {/* Error */}
      {error && (
        <div
          role="alert"
          style={{
            margin: 'var(--ca-space-2)',
            padding: 'var(--ca-space-2) var(--ca-space-3)',
            backgroundColor: 'var(--ca-status-red-bg)',
            color: 'var(--ca-status-red)',
            borderRadius: 'var(--ca-radius-sm)',
            fontSize: 'var(--ca-font-size-sm)',
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Fixed paging bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--ca-space-2)',
          padding: 'var(--ca-space-2) var(--ca-space-3)',
          borderBottom: '1px solid var(--ca-border-default)',
          backgroundColor: 'var(--ca-surface-page)',
          fontSize: 'var(--ca-font-size-sm)',
          color: 'var(--ca-text-secondary)',
        }}
      >
        <span>{countLabel}</span>
        {isFilterActive && filterLabel && (
          <span
            style={{
              padding: '2px 8px',
              backgroundColor: 'var(--ca-surface-raised)',
              border: '1px solid var(--ca-border-default)',
              borderRadius: 'var(--ca-radius-xs)',
              fontSize: 'var(--ca-font-size-xs, 11px)',
              color: 'var(--ca-text-secondary)',
            }}
          >
            {filterLabel}
          </span>
        )}
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--ca-space-3)' }}>
        {displayItems.length === 0 ? (
          <div
            style={{
              padding: 'var(--ca-space-6)',
              textAlign: 'center',
              color: 'var(--ca-text-secondary)',
              fontSize: 'var(--ca-font-size-sm)',
            }}
          >
            {isFilterActive
              ? 'No blocked items match the current view filter.'
              : 'There are no blocked work items.'}
          </div>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
            aria-label="Blocked work items"
          >
            {displayItems.map((blocker) => (
              <BlockerRow
                key={blocker.ObjectID}
                blocker={blocker}
                rallyOrigin={rallyOrigin}
                showProject={showProject}
              />
            ))}
          </ul>
        )}

        {/* Show More */}
        {!isFilterActive && loadedCount < totalCount && (
          <div
            style={{
              padding: 'var(--ca-space-4)',
              textAlign: 'center',
            }}
          >
            <button
              onClick={handleShowMore}
              disabled={loadingMore}
              style={{
                padding: '6px 16px',
                fontSize: 'var(--ca-font-size-sm)',
                fontWeight: 600,
                color: loadingMore ? 'var(--ca-text-disabled)' : 'var(--ca-text-link)',
                backgroundColor: 'transparent',
                border: '1px solid var(--ca-border-default)',
                borderRadius: 'var(--ca-radius-sm)',
                cursor: loadingMore ? 'default' : 'pointer',
              }}
            >
              {loadingMore ? 'Loading...' : `Show More (${totalCount - loadedCount} remaining)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
