import { Listr } from 'listr2';
import { logger } from '../utils/logger';

export interface Task {
  title: string;
  task: () => Promise<string | void | Listr>;
  enabled?: () => boolean;
}

export class TaskManager {
  private tasks: Task[] = [];

  addTask(task: Task): void {
    this.tasks.push(task);
  }

  addTasks(tasks: Task[]): void {
    this.tasks.push(...tasks);
  }

  async runTasks(): Promise<void> {
    const listrTasks = this.tasks.map(task => ({
      title: task.title,
      task: task.task,
      enabled: task.enabled
    }));

    const runner = new Listr(listrTasks, {
      concurrent: false,
      rendererOptions: { collapseErrors: false }
    });

    try {
      await runner.run();
      logger.success('All tasks completed successfully');
    } catch (error) {
      logger.error('Error running tasks:', error);
      throw error;
    }
  }
}