# 任务1 自检报告：girl-10y-school 槽位拆分

## 方法（硬性要求1：同底图分层擦除）
以入库源图（raw10/raw2/raw）对齐到 128×192 后的同一张底图做 HSV 分割：肤色（H3-25,S>50）/ 黑发（V<90）/ 白服装，再按解剖带（上衣25-96、短裤88-97、鞋150-192）+ 连通域过滤得到服装掩码；body 衣区 +12 提亮（内衣白底，保留明暗过渡）。
修正记录：初版短裤被长背心遮盖导致按白色分割只剩细线，改为几何带+肤色剔除后得到完整短裤可见部。

## 叠合还原测试（body→bottom→shoes→top vs 原底图）
front:       avg 2.57, >60像素 0/5109
front_left:  avg 2.19, >60像素 0/5177
front_right: avg 2.23, >60像素 0/5055
（差异仅为半透明边缘二次抗锯齿，肉眼不可辨）

## validate_sprite.py（12/12 PASS，退出码0）
body/top/bottom/shoes × front/front_left/front_right 共 12 张，透明/128×192/锚点/命名四项全过。

## 硬性要求3自查
- 服装层绘制区域之外全透明 ✅
- 鞋图层不含脚踝以上皮肤 ✅（鞋掩码仅白色分类像素）

## meta.json 变更
slots 四项；新增 layerOrder [body,bottom,shoes,top]；slotsNote 删除“列入后续迭代”；version 1→2。

## 如实申报
1. 长背心遮住短裤大部分，bottom 层为短裤可见部+少量上延；换短上衣时髋部显示 body 内衣白底，符合设计。
2. layerOrder 取 body 最底。25d 文档 L2a→L2f 列举顺序与“body被服装遮挡”描述存在自相矛盾，按可还原整件的物理顺序定标，请渲染侧确认。
