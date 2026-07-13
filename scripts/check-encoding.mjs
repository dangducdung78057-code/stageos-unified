// 源码编码守卫:禁止仓库源码中出现 Unicode 替换字符 U+FFFD(乱码标记)
import fs from "node:fs"
import path from "node:path"

const DIRS = ["app", "components", "lib", "domain", "features", "hooks", "scripts"]
const EXT = /\.(ts|tsx|css|md|json|mjs)$/
const bad = []

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p)
    else if (EXT.test(entry)) {
      const text = fs.readFileSync(p, "utf8")
      text.split("\n").forEach((line, i) => {
        if (line.includes("\uFFFD")) bad.push(`${p}:${i + 1}`)
      })
    }
  }
}

DIRS.forEach(walk)

if (bad.length) {
  console.error("发现乱码字符 U+FFFD:")
  bad.forEach((b) => console.error("  " + b))
  process.exit(1)
}
console.log("encoding check passed: no U+FFFD in source files")
