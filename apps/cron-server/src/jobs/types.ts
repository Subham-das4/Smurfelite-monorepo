export type JobResult = {
  job: string;
  processed: number;
  skipped?: number;
  skippedJob?: boolean;
};
