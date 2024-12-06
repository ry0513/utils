个人使用的小工具箱

## 安装

```shell
npm i @ry0513/utils
# 或者
pnpm i @ry0513/utils
```

## 方法

- [extName](#extName)
- [baseName](#baseName)

## 类

- [Worker](#Worker)

### extName

用于获取文件扩展名

类型

```
extName(path: string, withDot?: boolean): string
```

例子

```js
import { extName } from "@ry0513/utils";
console.log(extName("/path/AAA00.jpg")); // jpg
console.log(extName("/path/AAA00.jpg", true)); // .jpg
```

### baseName

用于获取文件名

类型

```
baseName(path: string, ext?: boolean): string
```

例子

```js
import { baseName } from "@ry0513/utils";
console.log(baseName("/path/AAA00.jpg")); // AAA00
console.log(baseName("/path/AAA00.jpg", true)); // AAA00.jpg
```

### Worker

用于 Web Worker 的连接池，创建实例时不会创建线程；当有新任务加入时会检测存在的线程数，若线程数不超过最大时则会创建新的线程并执行该任务，否则会加入任务队列等待执行；当一个线程完成任务时会检测任务队列，若队列不为空时会按顺序取出下一个任务继续执行（复用该线程），若队列为空则会自动终止

类型

```
new Worker(path: string | URL, options?:WorkerPoolsOptions)

type WorkerPoolsOptions = {
    maxWorkers?: number;
    credentials?: WorkerOptions["credentials"];
    type?: WorkerOptions["type"];
};
```

例子

```js
import { Worker } from "@ry0513/utils";
// 假设 worker.js 计算文件MD5的并返回
const pools = new Worker("./worker.js", {
  maxWorkers: 8,
  type: "module",
});
// vite 需要 new URL() 导入
// https://cn.vitejs.dev/guide/features.html#web-workers
// const pools = new Worker(new URL("./worker", import.meta.url), {
//  maxWorkers: 8,
//  type: "module"
//});
// 假设 fileList 等待计算的文件列表
fileList.map(async (file) => {
  try {
    file.MD5 = await pools.addTask(file);
  } catch (error) {
    file.MD5 = null;
    console.error(error);
  }
});

// pools.terminateAll(); // 若有需要，可以直接终止全部线程
```
