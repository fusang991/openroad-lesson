# 2. 布局规划 (Floorplan)

## 原理

布局规划是物理设计的第一步，确定芯片的基本框架：
- **核心面积**：根据标准单元总面积和利用率计算
- **IO 端口位置**：输入/输出引脚在芯片边缘的排列
- **标准单元行**：定义放置单元的行结构
- **Tap 单元**：为衬底供电的特殊单元

## 输入文件

| 文件 | 来源 |
|------|------|
| `1_synth.odb` | 综合阶段输出 |
| `1_synth.sdc` | 综合阶段输出 |
| `platforms/nangate45/lef/*.lef` | 工艺库 LEF 文件 |

## 关键参数

```makefile
export CORE_UTILIZATION ?= 55      # 核心利用率 55%
export PLACE_DENSITY_LB_ADDON = 0.20  # 布局密度下限偏移
```

利用率计算：
```
核心面积 = 标准单元总面积 / 利用率
```

## 运行命令

```bash
util/docker_shell make do-floorplan DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

## 子步骤详解

### 2_1_floorplan — 初始化

- 根据利用率计算核心面积
- 创建核心区域和 IO 端口
- 定义标准单元行（row）

### 2_2_floorplan_macro — 宏单元布局

- GCD 设计没有宏单元（SRAM 等），此步为空操作
- 复杂设计中需要手动放置宏单元

### 2_3_floorplan_tapcell — 插入 Tap 单元

- 在标准单元行中均匀插入 Tap 单元
- Tap 单元连接衬底和电源，防止闩锁效应
- GCD 设计插入 48 个 Tap 单元

### 2_4_floorplan_pdn — 电源网络

- 生成电源分配网络（PDN）
- 包含金属网格和电源环
- 详见下一章

## 输出文件

| 文件 | 说明 |
|------|------|
| `2_floorplan.odb` | 布局规划数据库 |
| `2_floorplan.sdc` | 约束文件 |

## 验证要点

- 利用率在合理范围（50%-80%）
- IO 端口位置正确
- 标准单元行覆盖整个核心区域
- Tap 单元间距符合设计规则
