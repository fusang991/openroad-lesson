# 深入理解：布局算法

> 对应《VLSI Physical Design》第 4 章：Placement

## 核心概念

### 布局的目标

布局将网表中的每个标准单元放置到芯片上的物理位置。优化目标：

1. **最小化线长**（wirelength）
2. **满足时序**（timing）
3. **避免拥塞**（congestion）
4. **合法化**（legalization）：单元对齐到行、不重叠

### 半周线长 HPWL

**Half-Perimeter Wire Length** 是衡量布局质量的核心指标。

```
给定一个 net 连接的所有单元位置，HPWL 计算方式：

   ┌───────────────────────┐
   │                       │
   │  ●───────────────●    │  ← 包围矩形
   │  │               │    │
   │  │    ●          │    │
   │  │               │    │
   │  ●───────────────●    │
   │                       │
   └───────────────────────┘

HPWL = (x_max - x_min) + (y_max - y_min)
```

总线长 = 所有 net 的 HPWL 之和。

### 两阶段布局

**全局布局（Global Placement）**：
- 允许单元重叠
- 使用数学优化（二次规划/力导向）最小化 HPWL
- 目标：找到"大致正确"的位置

**详细布局（Detail Placement / Legalization）**：
- 消除重叠
- 将单元对齐到标准单元行
- 局部优化（交换相邻单元）

### 力导向布局

最常见的全局布局算法。将每个单元看作一个点，受两种力：

```
弹簧力（连线）：  两个相连的单元互相吸引
排斥力（重叠）：  两个重叠的单元互相排斥

F_spring = k × (distance - ideal_length)
F_repulse = k / distance²
```

迭代求解直到平衡。

## 动手做

### 运行布局

```bash
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell make do-place DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

### 交互式查看布局结果

```bash
util/docker_shell bash
openroad -no_init
```

```tcl
# 加载布局后的设计
read_liberty /OpenROAD-flow-scripts/flow/platforms/nangate45/lib/NangateOpenCellLibrary_typical.lib
read_lef /OpenROAD-flow-scripts/flow/platforms/nangate45/lef/NangateOpenCellLibrary.macro.mod.lef
read_db /work/results/nangate45/gcd/base/3_place.odb
read_sdc /work/results/nangate45/gcd/base/3_place.sdc

# 查看设计信息
report_design_area
report_cell_usage

# 查看时序（布局后）
estimate_parasitics -placement
report_tns
report_wns
```

### 实验：利用率对布局的影响

分别用 40%、60%、80% 利用率跑布局，记录结果：

```bash
# 修改 config.mk 中的 CORE_UTILIZATION
# 然后运行
util/docker_shell make do-floorplan do-place DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

观察指标变化：

| 利用率 | 面积 | 布局质量 | 时序 |
|--------|------|----------|------|
| 40% | 大 | 单元分散，线长长 | 可能更好 |
| 60% | 中 | 均匀 | 平衡 |
| 80% | 小 | 拥塞高 | 可能恶化 |

### 实验：PLACE_DENSITY_LB_ADDON

```makefile
export PLACE_DENSITY_LB_ADDON = 0.20  # 默认值
# 改为 0.05 → 更紧凑
# 改为 0.40 → 更松散
```

这个参数控制布局密度的下限偏移，影响单元的紧凑程度。

## 数学模型：二次规划

全局布局的核心数学模型：

```
minimize: Σ (xᵢ - xⱼ)² + (yᵢ - yⱼ)²
          对所有 net (i, j)

subject to:
  核心区域边界约束
  禁区约束（宏单元区域）
```

这是一个二次规划（QP）问题，可以通过迭代求解：
1. 构建拉普拉斯矩阵 L
2. 求解 Lx = bx, Ly = by
3. 得到每个单元的 (x, y) 坐标

## 关键洞察

1. **布局是整个流程中最关键的步骤**：布局质量直接决定 CTS 和 routing 的难度。一个差的布局无法通过后续优化完全修复。

2. **HPWL 不是唯一目标**：实际布局器同时优化线长、时序、拥塞、功耗。有时为了时序，会牺牲一些线长。

3. **合法化不简单**：将重叠的单元移到合法位置，同时保持布局质量，本身就是一个优化问题。

4. **GCD 的布局相对容易**：只有 521 个单元，没有宏单元。复杂设计（如 RISC-V 核心）的布局可能需要数小时。
