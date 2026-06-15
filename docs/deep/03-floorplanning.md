# 深入理解：布局规划

> 对应《VLSI Physical Design》第 3 章：Floorplanning

## 核心概念

### 布局规划是什么？

布局规划确定芯片的物理框架：
- **核心区域大小**：能装下所有标准单元
- **IO 端口位置**：输入/输出在芯片边缘的位置
- **宏单元位置**：SRAM、IP 等大块的位置（GCD 没有宏单元）
- **电源网络**：供电骨架

### 面积计算

```
核心面积 = 标准单元总面积 / 目标利用率

GCD：663 μm² / 0.55 = 1205 μm²（理论值）
实际：884 μm²（利用率 76%，因为有填充和缓冲器）
```

利用率（Utilization）的权衡：
- **低利用率**（< 50%）：布线空间充裕，但浪费面积
- **高利用率**（> 85%）：面积紧凑，但布线困难、时序恶化
- **典型值**：60%-80%

### IO 摆放策略

```
           ┌──────────────────────┐
      clk→ │                      │ →resp_msg[15:0]
  req_msg→ │                      │ →req_rdy
   req_val→│       CORE           │ →resp_val
   reset→  │                      │
  resp_rdy→│                      │
           └──────────────────────┘
```

IO 摆放原则：
- 时钟端口放在中间或专用位置
- 总线信号放在一起（减少 skew）
- 输入和输出分开

### Tap 单元

标准单元库中的逻辑单元需要衬底偏置（body bias）。Tap 单元提供 VDD/VSS 到衬底的连接，防止**闩锁效应（latchup）**。

```
每隔一定距离必须插入 Tap 单元：

|--logic--|--logic--|--TAP--|--logic--|--logic--|--TAP--|
              ↑                                      ↑
        衬底连接                              衬底连接
```

## 动手做

### 运行布局规划

```bash
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell make do-floorplan DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

### 查看面积计算

```bash
# 综合后面积（纯单元）
cat logs/nangate45/gcd/base/1_synth.log | grep "Design area"
# Design area 663 um^2 100% utilization.

# 布局规划后面积
cat logs/nangate45/gcd/base/2_4_floorplan_pdn.log | grep "Design area"
```

### 交互式查看布局

```bash
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell bash
openroad -no_init
```

```tcl
# 加载布局规划后的设计
read_lef /OpenROAD-flow-scripts/flow/platforms/nangate45/lef/NangateOpenCellLibrary.macro.mod.lef
read_db /work/results/nangate45/gcd/base/2_floorplan.odb

# 查看核心区域
report_design_area

# 查看 IO 端口
report_io

# 查看标准单元行
report_row
```

### 实验：改变利用率

编辑 `config.mk`，尝试不同的利用率：

```makefile
# 实验 1：低利用率
export CORE_UTILIZATION ?= 30

# 实验 2：高利用率
export CORE_UTILIZATION ?= 80
```

重新运行，观察面积变化：

```bash
util/docker_shell make do-floorplan DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

预期结果：

| 利用率 | 核心面积 | 说明 |
|--------|----------|------|
| 30% | ~2200 μm² | 布线空间充裕 |
| 55% | ~1200 μm² | 默认值 |
| 80% | ~830 μm² | 紧凑，可能布线困难 |

## 数学模型：矩形打包

布局规划的核心问题是**矩形打包**（Rectangle Packing）：

```
给定 n 个矩形模块（面积 aᵢ, 宽高比 rᵢ），找到放置位置 (xᵢ, yᵢ)
使得包围矩形面积最小，且模块不重叠。

minimize: (x_max - x_min) × (y_max - y_min)
subject to:
  模块 i 和 j 不重叠：xᵢ + wᵢ ≤ xⱼ 或 xⱼ + wⱼ ≤ xᵢ 或 ...
  模块在边界内
```

对于 GCD（只有标准单元，无宏单元），这个问题简化为：
- 核心区域是一个矩形
- 标准单元按行排列
- 行的长度由利用率决定

## 关键洞察

1. **利用率不等于实际填充率**：设置 55% 利用率，最终是 76%。因为 CTS 和 timing repair 插入了额外的缓冲器。

2. **Tap 单元不能省**：48 个 Tap 单元面积虽小（12.77 μm²），但没有它们芯片无法正常工作。

3. **小设计的 PDN 问题**：GCD 面积小，默认 PDN 条带太宽。这在大设计中不会出现。

4. **布局规划决定了后续一切**：面积、IO 位置、PDN 质量直接影响 placement、CTS、routing 的难度。
