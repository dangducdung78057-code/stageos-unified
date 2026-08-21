# 任务2 自检报告：boy-14y-school 头身比补偿重出

## 方法
提示词按「目标+1」报 8 头身（抵消幼态偏置），以 v1 选定 raw 为参考图锁一致性；
正面经两轮收敛（7.86 → 7.46），侧前视角以 7.86 版为参考系生成以抬高基准。

## measure_head_ratio.py 输出原文
front（选定 boy-14y-school_front_v3_raw.png）:
{"total_px": 1463, "head_px": 196, "ratio": 7.46}

front_left（选定 boy-14y-school_front_left_v3_raw.png）:
{"total_px": 1459, "head_px": 203, "ratio": 7.19}

front_right（选定 boy-14y-school_front_right_v3_raw.png）:
{"total_px": 1459, "head_px": 201, "ratio": 7.26}

## 验收对照
- 三视角均 ≥6.9：7.46 / 7.19 / 7.26 ✅
- 极差 ≤0.35：7.46-7.19 = 0.27 ✅
- 一致性：三视角同脸/同发型/同服装（同参考系生成）✅
- 朝向：左前=脸朝画面右，右前=脸朝画面左 ✅

## 成品精灵复验（128×192 / 透明 / 锚点≤8px）
boy-14y-school_front_0.png (128, 192) 透明像素: True 锚点偏差:1.5px PASS
boy-14y-school_front_left_0.png (128, 192) 透明像素: True 锚点偏差:1.5px PASS
boy-14y-school_front_right_0.png (128, 192) 透明像素: True 锚点偏差:4.0px PASS

## 处置
- v1 三件套源图已归档 assets/_rejected/（*_v1superseded.png），不删除
- meta.json 已更新 headRatioMeasured / sourceFiles / revisionNote
- 未通过候选（7.86正面、7.0/7.01侧前）留档工作区，不入库
