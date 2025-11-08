import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 设置工作目录为当前脚本所在目录
const cwd = __dirname;
console.log(`Working directory: ${cwd}`);

try {
    // 执行git add命令
    console.log('执行 git add . ...');
    execSync('git add .', { cwd, stdio: 'inherit' });
    console.log('git add 完成');

    // 执行git commit命令
    console.log('执行 git commit -m "简化应用标题为英语魔法书" ...');
    execSync('git commit -m "简化应用标题为英语魔法书"', { cwd, stdio: 'inherit' });
    console.log('git commit 完成');

    // 执行git push命令
    console.log('执行 git push origin master ...');
    execSync('git push origin master', { cwd, stdio: 'inherit' });
    console.log('git push 完成');

    console.log('\n✅ 成功将修改上传到GitHub仓库！');
} catch (error) {
    console.error(`\n❌ 执行命令时出错: ${error.message}`);
    process.exit(1);
}