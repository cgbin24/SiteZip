const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

// 定义路径
const EXT_SRC = path.resolve(__dirname, "../../extension");
const OUTPUT_ZIP = path.resolve(__dirname, "../build/sitezip-extension.zip");

// 预校验源目录
if (!fs.existsSync(EXT_SRC)) {
  console.error(`错误：外部extension目录不存在，路径为 ${EXT_SRC}`);
  process.exit(1);
}

// 递归添加文件到zip
const zip = new JSZip();
const addFiles = (dir, zipFolder) => {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    stat.isDirectory() 
      ? addFiles(fullPath, zipFolder.folder(file)) 
      : zipFolder.file(file, fs.readFileSync(fullPath));
  });
};
addFiles(EXT_SRC, zip);

// 把await包裹在合法的自执行异步函数里，彻底解决语法错误
(async () => {
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE"
  });
  fs.writeFileSync(OUTPUT_ZIP, zipBuffer);
  console.log("✅ 打包完成，extension目录内容已完整输出到build/sitezip-extension.zip");
})();
