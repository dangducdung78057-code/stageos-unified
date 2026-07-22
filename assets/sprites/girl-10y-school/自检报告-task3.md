# 自检报告 · 任务3：girl-10y-school 低模建模+骨骼蒙皮（试点）

日期：2026-07-23 ｜ 分支：assets/v2-task3-girl10y-lowpoly ｜ 工具链：Blender 4.1.1 headless（便携版，沙箱自装）

## 1. 工单验收项对照

| 验收项 | 结果 |
| --- | --- |
| 顶点 < 2800 | ✅ 468 |
| 全四边面 | ✅ 432 quads / 0 triangles（源 .blend；glTF 导出按标准三角化，属格式固有行为） |
| 关节环形边 | ✅ 每关节两侧端部环形边 + 中部支撑环（肘/膝/腕/踝/肩/髋） |
| Mixamo 命名兼容骨架 | ✅ 22 根 `mixamorig:*`（Hips→Spine→Spine1→Spine2→Neck→Head + 四肢） |
| 蒙皮修重 | ✅ 逐顶点手工权重，关节重叠区 50/50 过渡 |
| 3 动画剪辑 | ✅ idle(48f) / walk(24f) / formation_hold(48f)，24fps 循环，NLA 三轨道导出 |
| glTF 导出 | ✅ GLB 165,176B，含 skin(22 joints) + JOINTS_0/WEIGHTS_0 + 3 animations |
| 2.5D 烘焙 walk 4帧×3方向 | ✅ 12 张 128×192 RGBA，validate_sprite 12/12 PASS |

## 2. Blender 构建统计（脚本输出原文）

```json
TASK3_STATS {"vertices": 468, "quads": 432, "triangles": 0, "vertex_budget_ok": true, "all_quads": true, "bones": 22, "bone_names": ["mixamorig:Head", "mixamorig:Hips", "mixamorig:LeftArm", "mixamorig:LeftFoot", "mixamorig:LeftForeArm", "mixamorig:LeftHand", "mixamorig:LeftLeg", "mixamorig:LeftShoulder", "mixamorig:LeftToeBase", "mixamorig:LeftUpLeg", "mixamorig:Neck", "mixamorig:RightArm", "mixamorig:RightFoot", "mixamorig:RightForeArm", "mixamorig:RightHand", "mixamorig:RightLeg", "mixamorig:RightShoulder", "mixamorig:RightToeBase", "mixamorig:RightUpLeg", "mixamorig:Spine", "mixamorig:Spine1", "mixamorig:Spine2"], "animations": ["idle", "walk", "formation_hold"], "glb": ".../lowpoly/girl-10y-school.glb", "glb_bytes": 165176, "calibration": {"iters": 3, "ortho_scale": 6.857, "bbox_px": [48, 79, 10, 173], "height_px": 164}, "baked": 12}
```

## 3. GLB 结构解析（独立校验，非 Blender 自报）

```
animations: ['idle', 'walk', 'formation_hold']
skins: 1 | joints: 22（mixamorig:Hips ... mixamorig:RightToeBase）
attributes: JOINTS_0 ✅ WEIGHTS_0 ✅ POSITION ✅
materials: ['skin', 'hair', 'top_white', 'white']
```

## 4. 烘焙帧质量门（脚本输出原文）

头身比（measure_head_ratio.py，realistic-child 区间 6.2–6.8）：

```
front:       {"total_px": 165, "head_px": 26, "ratio": 6.35}
front_left:  {"total_px": 163, "head_px": 26, "ratio": 6.27}
front_right: {"total_px": 162, "head_px": 26, "ratio": 6.23}
```

validate_sprite.py：**12/12 ALL_PASS**（透明底 ✅ / 128×192 ✅ / 锚点 ✅ / 命名 ✅）

```
body/girl-10y-school-walk_front_0.png ALL_PASS
body/girl-10y-school-walk_front_1.png ALL_PASS
body/girl-10y-school-walk_front_2.png ALL_PASS
body/girl-10y-school-walk_front_3.png ALL_PASS
body/girl-10y-school-walk_front_left_0.png ALL_PASS
body/girl-10y-school-walk_front_left_1.png ALL_PASS
body/girl-10y-school-walk_front_left_2.png ALL_PASS
body/girl-10y-school-walk_front_left_3.png ALL_PASS
body/girl-10y-school-walk_front_right_0.png ALL_PASS
body/girl-10y-school-walk_front_right_1.png ALL_PASS
body/girl-10y-school-walk_front_right_2.png ALL_PASS
body/girl-10y-school-walk_front_right_3.png ALL_PASS
```

## 5. 生产与修偏记录（如实申报）

1. **烘焙参数**：正交相机，俯角 30°（对齐地板 0.5 压扁比的 2:1 dimetric），方位角 0/±45°；front_left = 角色绕 Z +45°（脸朝画面右，与精灵库标注约定一致），front_right = −45°。帧取 walk 循环第 4/10/16/22 帧（两个触地相 + 两个过渡相）。
2. **锚点对齐**：行走帧最低脚天然侧偏（最大 28px），逐帧整数平移对齐脚底中心锚点（shift −26~+28px，边缘补透明，无环绕）。平移表留存于构建日志。
3. **头身比迭代**：首版剪影实测 5.47（头发体积计入头高），经 4 轮头部构件调整（发型上移/头高 0.95→0.78/颈加宽 0.24→0.30）落回 6.23–6.35。模型构造头身比恒为 6.5，剪影实测含发量。
4. **命名校验调用约定**：validate_sprite.py 需以 `{slot}/{file}` 相对路径调用（从角色目录执行），直接传裸文件名会因解析不到 slot 段误报 naming FAIL——首批 12 张 FAIL 全属此调用方式问题，非文件问题。
5. **正面 walk 帧步态含蓄**：正面视角步幅沿视深方向，30° 俯角下主要表现为双脚高差（≈14px），横向摆动不可见，属 2.5D 正面行走固有表现；步态可读性由 front_left/front_right 承担。
6. **面部为贴图相位**：低模无五官几何（与低模拓扑工作流一致，五官走后续贴图/烘焙阶段）。
7. **配色对齐 2D 精灵**：黑发 #372F25 系、肤色晒痕系、白背心/白短裤/白鞋，白底服装保证运行时 multiply 重着色前提。
8. **glTF 三角化说明**：GLB 内 864 triangles 为 glTF 标准导出三角化结果；四边面拓扑以 .blend 源文件为准（432 quads / 0 tris）。

## 6. 交付清单

```
05_任务3_girl10y低模绑骨_20260723/
├── lowpoly/girl-10y-school.glb      # glTF 2.0 二进制（165KB，3动画+蒙皮）
├── lowpoly/girl-10y-school.blend    # 源文件（全四边面拓扑，468v/432q）
├── body/girl-10y-school-walk_{front,front_left,front_right}_{0..3}.png  # 12张烘焙帧
├── meta.json                        # v3：frames.walk=4 + lowpoly 段
└── 自检报告-task3.md（本文件）
```

## 7. 待确认

- 烘焙俯角取 30°（理论 2:1 dimetric），如渲染管线实际相机俯角不同，告知后重烘；
- formation_hold 目前为近似静止持队形（微呼吸 0.8%），如需特定队形手势请给参考；
- 试点验收通过后，同管线铺 boy-10y / girl-14y / boy-14y。
