declare module 'node-cron' {
  export interface ScheduleOptions {
    scheduled?: boolean;
    timezone?: string;
  }

  export interface ScheduledTask {
    start(): void;
    stop(): void;
    destroy(): void;
    getStatus(): boolean;
  }

  export function schedule(
    cronExpression: string,
    func: () => void,
    options?: ScheduleOptions
  ): ScheduledTask;

  export function validate(cronExpression: string): boolean;
  export function getTasks(): Map<string, ScheduledTask>;
}
