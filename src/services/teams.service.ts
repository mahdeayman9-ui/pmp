import { DatabaseService } from '../lib/database';
import type { Team, TeamMember, CreateTeamData } from '../types/database';
import type { Database } from '../lib/database.types';

export class TeamsService {
  static async getAll() {
    const data = await DatabaseService.findMany('teams', {
      select: `
        *,
        team_members (
          id,
          role,
          joined_at,
          profiles (
            id,
            name,
            email
          )
        )
      `
    });

    return data.map(team => this.transformTeam(team));
  }

  static async getById(id: string) {
    const data = await DatabaseService.findById('teams', id, `
      *,
      team_members (
        id,
        role,
        joined_at,
        profiles (
          id,
          name,
          email
        )
      )
    `);

    return this.transformTeam(data);
  }

  static async create(teamData: CreateTeamData) {
    const team = await DatabaseService.create('teams', {
      name: teamData.name,
      description: teamData.description
    });

    // Add team members if provided
    if (teamData.members && teamData.members.length > 0) {
      const memberInserts: Database['public']['Tables']['team_members']['Insert'][] = teamData.members.map(member => ({
        team_id: team.id,
        user_id: member.userId,
        role: member.role
      }));

      for (const insert of memberInserts) {
        await DatabaseService.create('team_members', insert);
      }
    }

    return team;
  }

  static async update(id: string, updates: Partial<{ name: string; description: string }>) {
    return await DatabaseService.update('teams', id, updates);
  }

  static async delete(id: string) {
    return await DatabaseService.delete('teams', id);
  }

  static async addMember(teamId: string, userId: string, role: 'lead' | 'member' = 'member') {
    return await DatabaseService.create('team_members', {
      team_id: teamId,
      user_id: userId,
      role
    });
  }

  static async removeMember(teamId: string, userId: string) {
    // This would need a more complex query to delete specific team member
    // For now, we'll use a direct query
    const { supabase } = await import('../lib/supabase');
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  private static transformTeam(teamData: any): Team {
    return {
      id: teamData.id,
      name: teamData.name,
      description: teamData.description || '',
      members: teamData.team_members?.map((member: any): TeamMember => ({
        id: member.id,
        userId: member.profiles?.id || '',
        name: member.profiles?.name || '',
        email: member.profiles?.email || '',
        role: member.role === 'lead' ? 'lead' : 'member',
        joinedAt: new Date(member.joined_at)
      })) || [],
      createdAt: new Date(teamData.created_at)
    };
  }
}