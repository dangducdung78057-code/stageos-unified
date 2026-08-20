# 素材协议速查（StageOS 商用红线）

## 结论

商用分发的精灵库只接受两类来源：**自产**（AI 生成 + 人工校验，版权归 StageOS）或 **CC0**。SA/GPL 素材禁止入库。

## 协议判定表

| 协议 | 商用 | 署名 | 改编同协议义务 | 入库判定 |
| --- | --- | --- | --- | --- |
| CC0 | ✅ | 无 | 无 | ✅ 直接入库 |
| CC-BY | ✅ | 必须署名 | 无 | ⚠️ 入库 + CREDITS.csv + 应用内署名入口 |
| CC-BY-SA | ⚠️ | 必须署名 | **改编件须同协议发布（含改色图）** | ❌ 禁止 |
| GPL（任意版本） | ⚠️ | 必须 | **传染性** | ❌ 禁止 |
| OGA-BY | ✅ | 必须署名（禁署名附加条款） | 无 | ⚠️ 同 CC-BY 处理 |

## 已知资源站判定

- **Kenney**：全系 CC0 → 可直接用
- **Quaternius**（3D 低模）：CC0 → 可直接用，可渲染转 2D 帧
- **Dungeon Crawl Stone Soup tiles**：CC0 → 可用
- **Universal LPC Spritesheet**：GPL3 + CC-BY-SA 双授权且逐文件混合 → **整体禁止入库**；仅其中单独标注 CC0 的文件可用，且须逐文件核对 CREDITS.csv
- **OpenGameArt 综合站**：逐素材混合协议，必须逐件确认，禁止默认可用
- **DawnLike**：CC-BY 4.0 → 可用但须署名 DragonDePlatino 与 DawnBringer

## 操作规则

1. 入库前对每件素材完成协议判定，结果写入 meta.json 的 `license` 字段；
2. 拿不准协议的素材一律视为禁止；
3. CI 卡点：扫描 sprites/ 目录，发现声明为 SA/GPL 的条目即构建失败；
4. 自产素材在 meta.json 标 `license: self-produced`，`source: ai-generated+human-verified`。
