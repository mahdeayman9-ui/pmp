import { DatabaseService } from '../lib/database';
import { Task } from '../types';

export class TasksService {
  static async getAll() {
    const data = await DatabaseService.findMany('tasks');
    return data.map(task => this.transformTask(task));
  }

  static async getById(id: string) {
    const data = await DatabaseService.findById('tasks', id);
    return this.transformTask(data);
  }

  static async getByProject(projectId: string) {
    const data = await DatabaseService.findMany('tasks', {
      filters: { project_id: projectId }
    });
    return data.map(task => this.transformTask(task));
  }

  static async getByPhase(phaseId: string) {
    const data = await DatabaseService.findMany('tasks', {
      filters: { phase_id: phaseId }
    });
    return data.map(task => this.transformTask(task));
  }

  static async create(taskData: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    phaseId: string;
    projectId: string;
    assignedToTeamId?: string;
    priority?: 'low' | 'medium' | 'high';
  }) {
    const task = await DatabaseService.create('tasks', {
      title: taskData.title,
      description: taskData.description,
      start_date: taskData.startDate.toISOString().split('T')[0],
      end_date: taskData.endDate.toISOString().split('T')[0],
      status: 'todo',
      priority: taskData.priority || 'medium',
      assigned_to_team_id: taskData.assignedToTeamId,
      phase_id: taskData.phaseId,
      project_id: taskData.projectId,
      progress: 0,
      total_target: 100,
      planned_effort_hours: 40,
      actual_effort_hours: 0,
      risk_level: 'low',
      completion_rate: 0,
      time_spent: 0,
      is_overdue: false
    });

    return this.transformTask(task);
  }

  static async update(id: string, updates: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    progress: number;
    assignedToTeamId: string;
  }>) {
    const dbUpdates: any = {};

    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.priority) dbUpdates.priority = updates.priority;
    if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
    if (updates.assignedToTeamId) dbUpdates.assigned_to_team_id = updates.assignedToTeamId;

    const data = await DatabaseService.update('tasks', id, dbUpdates);
    return this.transformTask(data);
  }

  static async delete(id: string) {
    return await DatabaseService.delete('tasks', id);
  }

  static async logDailyAchievement(taskId: string, achievement: {
    date: string;
    value: number;
    workHours?: number;
    notes?: string;
    checkInTime?: string;
    checkInLocation?: any;
    checkOutTime?: string;
    checkOutLocation?: any;
    media?: any[];
    voiceNotes?: any[];
  }) {
    const { supabase } = await import('../lib/supabase');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    return await DatabaseService.create('daily_achievements', {
      task_id: taskId,
      user_id: user.id,
      date: achievement.date,
      value: achievement.value,
      work_hours: achievement.workHours || 0,
      notes: achievement.notes,
      check_in_time: achievement.checkInTime,
      check_in_location: achievement.checkInLocation,
      check_out_time: achievement.checkOutTime,
      check_out_location: achievement.checkOutLocation,
      media: achievement.media || [],
      voice_notes: achievement.voiceNotes || []
    });
  }

  static async getDailyAchievements(taskId: string) {
    const { supabase } = await import('../lib/supabase');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const data = await DatabaseService.findMany('daily_achievements', {
      filters: { task_id: taskId, user_id: user.id }
    });

    return data.map(achievement => this.transformDailyAchievement(achievement));
  }

  static async updateDailyAchievement(id: string, updates: Partial<{
    value: number;
    workHours: number;
    notes: string;
    checkInTime: string;
    checkInLocation: any;
    checkOutTime: string;
    checkOutLocation: any;
    media: any[];
    voiceNotes: any[];
  }>) {
    const dbUpdates: any = {};

    if (updates.value !== undefined) dbUpdates.value = updates.value;
    if (updates.workHours !== undefined) dbUpdates.work_hours = updates.workHours;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.checkInTime !== undefined) dbUpdates.check_in_time = updates.checkInTime;
    if (updates.checkInLocation !== undefined) dbUpdates.check_in_location = updates.checkInLocation;
    if (updates.checkOutTime !== undefined) dbUpdates.check_out_time = updates.checkOutTime;
    if (updates.checkOutLocation !== undefined) dbUpdates.check_out_location = updates.checkOutLocation;
    if (updates.media !== undefined) dbUpdates.media = updates.media;
    if (updates.voiceNotes !== undefined) dbUpdates.voice_notes = updates.voiceNotes;

    return await DatabaseService.update('daily_achievements', id, dbUpdates);
  }

  static async deleteDailyAchievement(id: string) {
    return await DatabaseService.delete('daily_achievements', id);
  }

  static async uploadFile(file: File, taskId: string, date: string): Promise<string> {
    const { supabase } = await import('../lib/supabase');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${taskId}/${date}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('task-files')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('task-files')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  static async uploadMedia(file: File, taskId: string, date: string): Promise<{ url: string; type: 'image' | 'video'; name: string; size: number }> {
    const url = await this.uploadFile(file, taskId, date);

    return {
      url,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      name: file.name,
      size: file.size
    };
  }

  static async uploadAudio(audioBlob: Blob, taskId: string, date: string): Promise<{ url: string; name: string; size: number }> {
    const { supabase } = await import('../lib/supabase');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const fileExt = 'webm'; // Default format for MediaRecorder
    const fileName = `${user.id}/${taskId}/${date}/audio_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('task-files')
      .upload(fileName, audioBlob);

    if (error) {
      console.error('Error uploading audio file:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('task-files')
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      name: `تسجيل_${Date.now()}`,
      size: audioBlob.size
    };
  }

  private static transformDailyAchievement(achievementData: any) {
    return {
      id: achievementData.id,
      taskId: achievementData.task_id,
      userId: achievementData.user_id,
      date: achievementData.date,
      value: achievementData.value || 0,
      workHours: achievementData.work_hours || 0,
      notes: achievementData.notes,
      checkInTime: achievementData.check_in_time,
      checkInLocation: achievementData.check_in_location,
      checkOutTime: achievementData.check_out_time,
      checkOutLocation: achievementData.check_out_location,
      media: achievementData.media || [],
      voiceNotes: achievementData.voice_notes || [],
      createdAt: new Date(achievementData.created_at)
    };
  }

  private static transformTask(taskData: any): Task {
    return {
      id: taskData.id,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status as any,
      priority: taskData.priority as any,
      assignedToTeamId: taskData.assigned_to_team_id,
      startDate: new Date(taskData.start_date),
      endDate: new Date(taskData.end_date),
      progress: taskData.progress || 0,
      phaseId: taskData.phase_id,
      projectId: taskData.project_id,
      createdAt: new Date(taskData.created_at),
      totalTarget: taskData.total_target || 100,
      plannedEffortHours: taskData.planned_effort_hours || 40,
      actualEffortHours: taskData.actual_effort_hours || 0,
      riskLevel: taskData.risk_level as any || 'low',
      completionRate: taskData.completion_rate || 0,
      timeSpent: taskData.time_spent || 0,
      isOverdue: taskData.is_overdue || false,
      lastActivity: taskData.last_activity ? new Date(taskData.last_activity) : new Date(),
      dailyAchievements: [] // Will be populated separately if needed
    };
  }
}