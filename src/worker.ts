type WorkerPoolsOptions = {
    maxWorkers?: number;
    credentials?: WorkerOptions["credentials"];
    type?: WorkerOptions["type"];
};

/**
 * Web Worker 线程池
 * @param path 文件地址
 * @param maxWorkers 允许最大的线程数量，默认 4
 */
export class WorkerPools {
    private path: string | URL;
    private maxWorkers: number;
    private workers: Worker[] = [];
    private taskQueue: any[] = [];
    private WorkerPoolsOptions: WorkerPoolsOptions;

    constructor(path: string | URL, WorkerPoolsOptions: WorkerPoolsOptions = {}) {
        this.path = path;
        this.maxWorkers = WorkerPoolsOptions.maxWorkers || 4;
        this.WorkerPoolsOptions = WorkerPoolsOptions;
    }

    private runTask(worker?: Worker) {
        if (worker || this.workers.length < this.maxWorkers) {
            worker = worker || this.initialize();
            if (this.taskQueue.length > 0) {
                const nextTask = this.taskQueue.shift()!;
                const listenMessage = (e: MessageEvent) => {
                    nextTask.resolve(e.data);
                    this.runTask(worker);
                    worker!.removeEventListener("message", listenMessage);
                    worker!.removeEventListener("error", listenError);
                };
                const listenError = (e: ErrorEvent) => {
                    nextTask.reject(e);
                    this.runTask(worker);
                    worker!.removeEventListener("message", listenMessage);
                    worker!.removeEventListener("error", listenError);
                };
                worker.addEventListener("error", listenError);
                worker.addEventListener("message", listenMessage);
                worker.postMessage(nextTask.data);
            } else {
                this.workers = this.workers.filter((t) => t !== worker);
                worker.terminate();
            }
        }
    }

    private initialize(): Worker {
        const worker = new Worker(this.path, {
            type: this.WorkerPoolsOptions.type,
            credentials: this.WorkerPoolsOptions.credentials
        });
        this.workers.push(worker);
        return worker;
    }

    /**
     * 终止全部线程
     */
    public terminateAll(): void {
        this.workers.forEach((worker) => worker.terminate());
        this.workers = [];
        this.taskQueue = [];
    }

    /**
     * 添加任务
     * @param data
     * @returns
     */
    public addTask(data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.taskQueue.push({ data, resolve, reject });
            this.runTask();
        });
    }
}
