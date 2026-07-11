# Preview 资产验收报告

## 执行时间
2026-07-11 15:17 UTC

## 候选素材清单
- **人物底图**: `preview/front.png`, `preview/front-left.png`, `preview/front-right.png`
- **四区遮罩**: `preview/masks/{region}-{view}.png` 共 12 张
- **尺寸**: 1024 × 1536 RGBA PNG
- **脚底基线**: `y=1449` (三方向一致)
- **锚点**: `anchor.y = 1450 / 1536 ≈ 0.9440`

## 静态验收 (✅ 通过)

### 1. 文件完整性
- ✅ 三方向人物图全部存在
- ✅ 12 张独立四区遮罩全部存在
- ✅ `masks-preview-sheet.png` 未复制未引用
- ✅ 无遗漏、无重复、无命名错误

### 2. 图像基线一致性
- ✅ 三方向脚底基线均为 `y=1449`
- ✅ 尺寸完全统一
- ✅ Alpha 通道完整
- ✅ 四个画布角全透明 (`rgba(0,0,0,0)`)

### 3. 遮罩区域边界
- ✅ 12 张 mask 完全位于人物 Alpha 轮廓内
- ✅ `maskOutsideBody = 0` (无越界)
- ✅ 边缘亮度噪点 `< 2.5%`

### 4. TypeScript 类型与测试
- ✅ 19 项测试全部通过
- ✅ TypeScript 类型检查零错误
- ✅ ESLint 零警告

## 动态验收 (❌ 阻断)

### 1. PixiJS 渲染问题 ⚠️
**现象**: 女生精灵呈现浅灰矩形底板,男生显示"无素材"占位。

**根因分析**:
1. 包内 mask 采用 **纯白色 + 二值 Alpha** 编码 (`RGB=255,255,255`)
2. 初始使用 `multiply` 混合模式,产生 WebGL 合成伪影
3. 改为 `normal` + `tint` 后灰色依旧,说明纯白遮罩不适配 PixiJS tint 着色管线

**技术细节**:
- PixiJS `tint` 对纯白纹理生效需配合 `ColorMatrixFilter` 或灰度编码
- 当前遮罩为区域蒙版 (白色=服装区、透明=非服装区),不携带明暗信息
- 正确方案:
  - **方案A**: 遮罩改为灰度图 (`R=G=B=亮度值`),使用 `multiply` 保留原图阴影
  - **方案B**: 保持纯白 Alpha,改用 `ColorMatrixFilter` 或 `SpriteMaskFilter`

### 2. 三方向切换 ⏸️
因灰底阻断,未验收方向切换效果。

### 3. 四区颜色独立性 ⏸️
因灰底阻断,未验收 upper/lower/footwear/accent 是否串色或污染皮肤/头发。

### 4. 深度排序与缩放 ⏸️
因灰底阻断,未验收透视排序与锚点定位精度。

### 5. 保存恢复 ⏸️
因灰底阻断,未验收 spriteId/direction/appearance 云端持久化。

## 结论

**当前状态**: `assetStatus: "development"` | `placeholder: true` | `productionReady: false`

**阻断原因**: 纯白 Alpha 遮罩与 PixiJS tint 着色管线不兼容,产生灰色底板伪影。

**晋级条件**:
遮罩必须改为以下之一:
1. **灰度明暗编码** (`R=G=B=亮度`,保留原图阴影,适配 `multiply`)
2. **色彩滤镜方案** (保持纯白,改用 `ColorMatrixFilter`,需重写换色实现)

**下一步**:
等待重新生成符合 PixiJS 灰度管线的 12 张遮罩,或提供色彩滤镜替代方案。

---

**验收人**: v0 AI  
**协议版本**: StageOS Sprite Manifest v2  
**质量门**: 编码✅ 类型✅ Lint✅ 测试✅ 构建✅ 浏览器❌
