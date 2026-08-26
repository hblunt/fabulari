// client/src/app/features/requests/request-labels.ts
// Shared copy for request rows so My requests and the queue stay in lockstep.

import type { AppRequest, RequestType } from '../../core/models';

export const TYPE_LABELS: Record<RequestType, string> = {
  GROUP_CREATE: 'Group creation',
  GROUP_JOIN: 'Join request',
  GROUP_DELETE: 'Group deletion',
  ROOM_CREATE: 'Room proposal',
  USER_REPORT: 'User report',
  SYSTEM_BAN: 'System ban',
};

const SUPER_ADMIN_TYPES: RequestType[] = ['GROUP_CREATE', 'GROUP_DELETE', 'SYSTEM_BAN'];

export function awaitingLabel(type: RequestType): string {
  return SUPER_ADMIN_TYPES.includes(type) ? 'Awaiting super admin' : 'Awaiting group admin';
}

export function relativeTime(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

export function queueDetail(request: AppRequest): string {
  if (request.type === 'GROUP_JOIN') {
    if (request.wasBanned) return 'Previously banned from this group';
    const age = request.submitterAge ?? '?';
    const limit = request.groupAgeLimit ?? 0;
    return `Age ${age} · meets the ${limit}+ limit`;
  }
  if (request.type === 'ROOM_CREATE') {
    const desc = (request.payload as { description?: string } | undefined)?.description;
    return desc ? `"${request.targetName}" — ${desc}` : `"${request.targetName}"`;
  }
  if (request.type === 'USER_REPORT') {
    return request.reason ?? '';
  }
  if (request.type === 'GROUP_CREATE') {
    const payload = request.payload as
      | { description?: string; ageLimit?: number; theme?: string }
      | undefined;
    const age = payload?.ageLimit === 0 ? 'All ages' : `${payload?.ageLimit}+`;
    return `"${request.targetName}" · ${payload?.description} · ${age} · ${payload?.theme} theme`;
  }
  if (request.type === 'GROUP_DELETE') {
    const members = request.memberCount ?? 0;
    const rooms = request.roomCount ?? 0;
    return `"${request.targetName}" · ${members} member${members === 1 ? '' : 's'} · ${rooms} room${rooms === 1 ? '' : 's'}`;
  }
  if (request.type === 'SYSTEM_BAN') {
    return request.reason ?? `${request.submitterName} requests removal of ${request.targetName}`;
  }
  return '';
}

export function queueTitle(request: AppRequest): string {
  if (request.type === 'USER_REPORT') {
    return `${request.submitterName} reported ${request.targetName}`;
  }
  if (request.type === 'SYSTEM_BAN') {
    return `${request.submitterName} requests removal of ${request.targetName}`;
  }
  return `${TYPE_LABELS[request.type]} · ${request.submitterName}`;
}
