import { DatabaseService } from '../lib/database';
import { Project } from '../types';

export class ProjectsService {
  static async getAll() {
    const data = await DatabaseService.findMany('projects');
    return data.map(project => this.transformProject(project));
  }

  static async getById(id: string) {
    const data = await DatabaseService.findById('projects', id);
    return this.transformProject(data);
  }

  static async getByTeam(teamId: string) {
    const data = await DatabaseService.findMany('projects', {
      filters: { team_id: teamId }
    });
    return data.map(project => this.transformProject(project));
  }

  static async create(projectData: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    teamId: string;
  }) {
    const project = await DatabaseService.create('projects', {
      name: projectData.name,
      description: projectData.description,
      start_date: projectData.startDate.toISOString().split('T')[0],
      end_date: projectData.endDate.toISOString().split('T')[0],
      status: 'planning',
      progress: 0,
      team_id: projectData.teamId
    });

    return this.transformProject(project);
  }

  static async update(id: string, updates: Partial<{
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    status: string;
    progress: number;
  }>) {
    const dbUpdates: any = {};

    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.startDate) dbUpdates.start_date = updates.startDate.toISOString().split('T')[0];
    if (updates.endDate) dbUpdates.end_date = updates.endDate.toISOString().split('T')[0];
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.progress !== undefined) dbUpdates.progress = updates.progress;

    const data = await DatabaseService.update('projects', id, dbUpdates);
    return this.transformProject(data);
  }

  static async delete(id: string) {
    return await DatabaseService.delete('projects', id);
  }

  private static transformProject(projectData: any): Project {
    return {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description || '',
      startDate: new Date(projectData.start_date),
      endDate: new Date(projectData.end_date),
      status: projectData.status as any,
      progress: projectData.progress || 0,
      teamId: projectData.team_id || '',
      phases: [], // Will be populated separately if needed
      createdAt: new Date(projectData.created_at)
    };
  }
}