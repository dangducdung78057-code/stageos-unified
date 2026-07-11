# Preview 资产验收报告

## 结论

`primary-girl-basic-white` 的三方向底图与 12 张纯白 RGBA mask 在 PixiJS 8.19.0 中工作正常。此前截图中的浅灰矩形不来自女生 mask，而来自交替排列的 `primary-boy-basic-white` 旧 RGB PNG：这些男生图片没有 Alpha 通道，灰色画布背景被正常绘制。

当前仍按要求保持：

- `assetStatus: "development"`
- `placeholder: true`
- `productionReady: false`

## 女生 Preview 素材

- 底图：`preview/front.png`、`preview/front-left.png`、`preview/front-right.png`
- Mask：`preview/masks/{upper|lower|footwear|accent}-{front|front-left|front-right}.png`
- 尺寸：全部为 1024 × 1536 RGBA PNG
- 脚底基线：三方向均为 `y=1449`
- 锚点：`1450 / 1536`
- `masks-preview-sheet.png`：未复制、未引用

## 单 Mask 隔离实测

测试环境：PixiJS 8.19.0、WebGL、纯黑背景，只加载一个 Sprite，不加载人物底图或其他 overlay。

强制配置：

- `blendMode = "normal"`
- `alpha = 1`
- `tint = 0xff0000`
- 容器默认 `alpha = 1`
- 无 filter、无 Graphics 背景、无 RenderTexture

四张正面 mask 均正确显示为红色区域，未出现矩形底板。`linear` 与 `nearest` 采样结果均正常；资源测试前调用 `PIXI.Assets.reset()` 并附加唯一查询参数，排除了旧纹理缓存。

### Alpha 直方图

| 文件 | Alpha=0 | Alpha=1–254 | Alpha=255 | 四角 RGBA | 包围框外非零 Alpha |
| --- | ---: | ---: | ---: | --- | ---: |
| upper-front.png | 1,505,798 | 0 | 67,066 | 全部 `(0,0,0,0)` | 0 |
| lower-front.png | 1,458,606 | 0 | 114,258 | 全部 `(0,0,0,0)` | 0 |
| footwear-front.png | 1,538,180 | 0 | 34,684 | 全部 `(0,0,0,0)` | 0 |
| accent-front.png | 1,571,991 | 0 | 873 | 全部 `(0,0,0,0)` | 0 |

Mask 已有大面积透明画布边距，因此额外增加 2–4px 透明 padding 不会改变结果，也不是修复矩形所需。

## 底图隔离实测

三张女生 preview 底图在相同黑底 Pixi 场景单独渲染，`linear` 和 `nearest` 均无矩形。四角全部为 `(0,0,0,0)`，不存在 Alpha 1–8 的背景噪点；局部 Alpha 10–254 为人物轮廓正常抗锯齿。

## 浅灰矩形真实来源

以下旧男生素材均为 1024 × 1024 RGB PNG，没有 Alpha 通道：

- `primary-boy/basic-white/front.png`
- `primary-boy/basic-white/front-left.png`
- `primary-boy/basic-white/front-right.png`

主编辑器男女交替排列。女生 preview 正常透明；男生 RGB 图片携带灰色整幅背景，因此形成交替出现的浅灰矩形。该问题与 `primary-girl-basic-white` 的 mask 编码、tint、混合模式、纹理采样或透明 padding 无关。

## 晋级建议

女生候选素材已通过本轮透明度和 Pixi 基础渲染诊断，但按产品要求暂不晋级。待最终 manifest 与产品侧正式验收完成后，再将状态切换为 production；男生旧 RGB 素材应另行替换为 RGBA 或明确回退为“无素材”占位，不应作为女生素材的阻断项。
