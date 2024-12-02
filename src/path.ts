/**
 * 返回路径的扩展名，从最后一个 "." 到路径最后一部分的字符串结尾
 * @param path 路径
 * @param withDot 是否带 "."
 * @returns 
 */
export const extname = (path: string, withDot = false): string => {
    if (typeof path !== "string") {
        throw new Error("path must be a string");
    }
    const lastDotIndex = path.lastIndexOf(".");
    const lastSlashIndex = Math.max(
        path.lastIndexOf("/"),
        path.lastIndexOf("\\")
    );
    if (lastDotIndex === -1 || lastDotIndex < lastSlashIndex + 2) {
        return "";
    }
    return withDot ? path.slice(lastDotIndex) : path.slice(lastDotIndex + 1);
};


/**
 * 返回路径文件名
 * @param path 路径
 * @param ext 是否带后缀名
 * @returns 
 */
export const basename = (path: string, ext = false): string => {
    if (typeof path !== "string") {
        throw new Error("path must be a string");
    }
    // 找到最后一个路径分隔符的位置，支持正斜杠 (/) 和反斜杠 (\)
    const lastSlashIndex = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
    const fileName = lastSlashIndex === -1 ? path : path.slice(lastSlashIndex + 1);
    // console.log(fileName);
    if (!ext) {
        const lastDotIndex = fileName.lastIndexOf(".");
        if (lastDotIndex > 0) {
            return fileName.slice(0, lastDotIndex); // 去掉扩展名
        }
    }
    return fileName
};
