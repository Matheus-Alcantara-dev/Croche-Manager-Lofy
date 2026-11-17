import { workTotals } from '@/domain/work-time';
import { withWorkspace } from '@/local/database';
import { requireAdmin } from '@/local/identity';
import { today } from '@/utils/format';
import { editedAt } from './store';

export function getWork() {
  return withWorkspace((workspace) => {
    requireAdmin(workspace.access);
    const active = workspace.work?.active ?? null;
    const sessions = workspace.work?.sessions ?? [];
    const projects = workspace.projects.map((project) => ({
      id: project.id, name: project.name,
      canStart: !project.archived && !['finished', 'cancelled'].includes(project.status),
      ...workTotals(project.hours, sessions, project.id),
    }));
    return { active, projects, sessions };
  });
}

export function startWork(projectId: string) {
  return withWorkspace((workspace) => {
    requireAdmin(workspace.access);
    const work = workspace.work ??= { active: null, sessions: [] };
    if (work.active) throw new Error('Pause o cronômetro atual para trocar de projeto.');
    const project = workspace.projects.find((row) => row.id === projectId);
    if (!project || project.archived || project.status === 'finished' || project.status === 'cancelled') {
      throw new Error('Selecione um projeto disponível.');
    }
    work.active = { projectId, startedAt: Date.now() };
    project.updated_at = editedAt(project);
    project.status = 'active';
    project.start_date ??= today();
  }, true);
}

export function pauseWork(startedAt: number) {
  return withWorkspace((workspace) => {
    requireAdmin(workspace.access);
    const work = workspace.work;
    if (!work?.active || work.active.startedAt !== startedAt) {
      throw new Error('O cronômetro mudou. Atualize a tela.');
    }
    work.sessions.push({ ...work.active, endedAt: Math.max(work.active.startedAt, Date.now()) });
    work.active = null;
  }, true);
}
