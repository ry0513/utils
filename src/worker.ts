type WorkerPoolsOptions = {
  maxWorkers?: number;
  credentials?: WorkerOptions["credentials"];
  type?: WorkerOptions["type"];
};

type workerType = import("worker_threads").Worker | globalThis.Worker;

/**
 * Web Worker 线程池
 * @param path 文件地址
 * @param maxWorkers 允许最大的线程数量，默认 4
 */
export class Worker {
  private path: string | URL;
  private maxWorkers: number;
  private workers: workerType[] = [];
  private taskQueue: any[] = [];
  private WorkerPoolsOptions: WorkerPoolsOptions;
  private isBrowser: boolean;
  constructor(path: string | URL, WorkerPoolsOptions: WorkerPoolsOptions = {}) {
    this.path = path;
    this.maxWorkers = WorkerPoolsOptions.maxWorkers || 4;
    this.WorkerPoolsOptions = WorkerPoolsOptions;
    this.isBrowser = typeof window !== "undefined";
  }

  private async initialize(): Promise<workerType> {
    let worker: workerType;
    if (this.isBrowser) {
      worker = new window.Worker(this.path, {
        type: this.WorkerPoolsOptions.type,
        credentials: this.WorkerPoolsOptions.credentials,
      });
    } else {
      const { Worker } = await import("worker_threads");
      worker = new Worker(this.path);
    }

    this.workers.push(worker);
    return worker;
  }

  private async runTask(worker?: workerType) {
    if (worker || this.workers.length < this.maxWorkers) {
      if (!worker) {
        worker = await this.initialize();
      }
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift()!;
        if ("removeEventListener" in worker) {
          const listenMessage = (e: MessageEvent) => {
            nextTask.resolve(e.data);
            this.runTask(worker);
            (worker as globalThis.Worker).removeEventListener(
              "message",
              listenMessage
            );
            (worker as globalThis.Worker).removeEventListener(
              "error",
              listenError
            );
          };
          const listenError = (e: ErrorEvent) => {
            nextTask.reject(e);
            this.runTask(worker);
            (worker as globalThis.Worker).removeEventListener(
              "message",
              listenMessage
            );
            (worker as globalThis.Worker).removeEventListener(
              "error",
              listenError
            );
          };
          worker.addEventListener("error", listenError);
          worker.addEventListener("message", listenMessage);
        } else {
          const listenMessage = (data: any) => {
            nextTask.resolve(data);
            this.runTask(worker);
            (worker as import("worker_threads").Worker).removeListener(
              "message",
              listenMessage
            );
            (worker as import("worker_threads").Worker).removeListener(
              "error",
              listenError
            );
          };
          const listenError = (e: ErrorEvent) => {
            nextTask.reject(e);
            this.runTask(worker);
            (worker as import("worker_threads").Worker).removeListener(
              "message",
              listenMessage
            );
            (worker as import("worker_threads").Worker).removeListener(
              "error",
              listenError
            );
          };
          worker.addListener("error", listenError);
          worker.addListener("message", listenMessage);
        }

        worker.postMessage(nextTask.data);
      } else {
        this.workers = this.workers.filter((t) => t !== worker);
        worker.terminate();
      }
    }
  }

  /**
   * 添加任务
   * @param data
   * @returns
   */
  public addTask(data: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.taskQueue.push({ data, resolve, reject });
      await this.runTask();
    });
  }

  /**
   * 终止全部线程
   */
  public terminateAll(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
  }
}
