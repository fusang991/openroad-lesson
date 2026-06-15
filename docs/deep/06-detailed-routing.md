# 深入理解：详细布线

> 对应《VLSI Physical Design》第 6 章：Detailed Routing

## 核心概念

### 详细布线做什么？

全局布线规划了路径，详细布线则**实际画出导线**：

```
全局布线：net1 经过 GCell(1,1) → GCell(1,2) → GCell(2,2)
详细布线：net1 在 M3 层，从 (x1,y1) 到 (x2,y2)，走 track #5
```

### 金属层分配（Track Assignment）

芯片有多层金属，每层有固定方向：

| 层 | 方向 | 用途 |
|------|------|------|
| M1 | 水平 | 单元内部 |
| M2 | 垂直 | 局部信号 |
| M3 | 水平 | 信号布线 |
| M4 | 垂直 | 信号/电源 |
| M5 | 水平 | 长距离 |
| M6 | 垂直 | 电源 |
| M7 | 水平 | 电源 |

方向交替是为了减少层间串扰。

### 设计规则检查（DRC）

详细布线必须满足制造工艺的设计规则：

```
1. 最小间距（Min Spacing）：
   ──────  ← 导线 A
      ↕ ≥ S_min
   ──────  ← 导线 B

2. 最小宽度（Min Width）：
   ──────  ← 宽度 ≥ W_min

3. 天线规则（Antenna Rule）：
   长导线在制造过程中会积累电荷
   如果只连接到栅极（gate），可能击穿氧化层
   解决：插入天线保护二极管

4. 通孔规则（Via Rule）：
   层间连接需要通孔（via）
   通孔有最小尺寸和间距要求
```

### 天线效应

```
问题：
  M3 长线 ─────────────────┐
                           │
                       ┌───┴───┐
                       │ Gate  │  ← 电荷积累可能击穿栅氧
                       └───────┘

解决：
  M3 长线 ─────────────────┐
                           │
                       ┌───┴───┐     ┌──────┐
                       │ Gate  │     │ Diode│ ← 天线保护二极管
                       └───────┘     └──────┘
```

## 动手做

### 运行详细布线

```bash
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell make do-route DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

### 查看布线日志

```bash
# 详细布线日志
cat logs/nangate45/gcd/base/5_2_route.log | tail -30
```

关键输出：

```
[INFO DRT-0199]   M1   usage:   623(  0.12%)  capacity:  531944
[INFO DRT-0199]   M2   usage:  1180(  0.22%)  capacity:  531944
[INFO DRT-0199]   M3   usage:  2548(  0.48%)  capacity:  531944
[INFO DRT-0199]   M4   usage:  1340(  0.25%)  capacity:  531944
[INFO DRT-0199]   M5   usage:   252(  0.05%)  capacity:  531944
[INFO DRT-0199]   M6   usage:     0(  0.00%)  capacity:  531944
[INFO DRT-0199]   M7   usage:     0(  0.00%)  capacity:  531944
```

GCD 布线使用率很低（< 1%），因为设计太小。

### 查看 DRC 报告

```bash
cat reports/nangate45/gcd/base/5_route_drc.rpt
```

GCD 的 DRC 违例数：**0**

### 查看天线报告

```bash
# 如果有天线违例
cat logs/nangate45/gcd/base/5_2_route.log | grep -i "antenna"
```

### 交互式布线分析

```bash
util/docker_shell bash
openroad -no_init
```

```tcl
read_lef /OpenROAD-flow-scripts/flow/platforms/nangate45/lef/NangateOpenCellLibrary.macro.mod.lef
read_db /work/results/nangate45/gcd/base/4_cts.odb

# 运行详细布线
set route_guide /work/results/nangate45/gcd/base/route.guide
global_route -guide_file $route_guide
detailed_route -output_drc /work/results/nangate45/gcd/base/5_route_drc.rpt \
               -output_maze /work/results/nangate45/gcd/base/maze.log

# 查看布线结果
report_design_area
```

## 数学模型：DRC 违例代价

详细布线中的优化可以建模为：

```
minimize: wirelength + λ × DRC_violations

其中：
  wirelength = 所有导线的总长度
  DRC_violations = 违反设计规则的数量
  λ = 违例的惩罚权重
```

如果 λ 太小，布线器会为了缩短线长而违反 DRC；太大则线长变长但 DRC 为零。

## 关键洞察

1. **详细布线是最耗时的步骤**：GCD 花了 12 秒，是整个流程中最长的。大设计可能需要数小时。

2. **DRC 零违例是底线**：任何 DRC 违例都意味着芯片无法制造。布线器会反复迭代直到 DRC 为零。

3. **天线修复是自动的**：OpenROAD 的 `repair_antennas` 命令自动插入保护二极管。

4. **布线层利用率**：GCD 各层使用率 < 1%（数据来自 `logs/nangate45/gcd/base/5_2_route.log` 中的 `[INFO DRT-0199]` 行），说明这个设计对布线完全没有压力。实际芯片中，M2-M4 的使用率通常在 60%-80%。

5. **布线后不能再改布局**：一旦布线完成，如果发现时序问题，需要回到 placement 阶段重新优化。这就是为什么流程是迭代的。
