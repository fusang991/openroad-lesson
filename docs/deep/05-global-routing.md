# 深入理解：全局布线

> 对应《VLSI Physical Design》第 5 章：Global Routing

## 核心概念

### 布线的两阶段

```
全局布线 (Global Routing)
  │  将芯片划分为网格（GCell）
  │  为每条 net 规划经过哪些 GCell
  │  不关心具体的金属层和走线位置
  ▼
详细布线 (Detailed Routing)
  │  在每个 GCell 内部精确布线
  │  分配金属层（track assignment）
  │  满足 DRC（间距、宽度、天线规则）
  ▼
完成
```

### GCell 网格

全局布线将芯片划分为均匀的网格单元（GCell）：

```
┌────┬────┬────┬────┐
│ G00│ G01│ G02│ G03│
├────┼────┼────┼────┤
│ G10│ G11│ G12│ G13│
├────┼────┼────┼────┤
│ G20│ G21│ G22│ G23│
└────┴────┴────┴────┘
```

每个 GCell 有固定的布线容量（capacity），表示能通过多少条线。

### 迷宫路由

全局布线的核心算法是**迷宫路由**（Maze Routing / Lee's Algorithm）：

```
起点 S → 终点 T，找最短路径：

  0  1  2  3  4      0  1  2  3  4
  ┌──┬──┬──┬──┐      ┌──┬──┬──┬──┐
0 │  │  │  │  │    0 │ 1│ 2│ 3│ 4│
  ├──┼──┼──┼──┤      ├──┼──┼──┼──┤
1 │  │S │  │  │ →  1 │ 2│S │ 3│ 5│
  ├──┼──┼──┼──┤      ├──┼──┼──┼──┤
2 │  │  │█ │  │    2 │ 3│ 4│█ │ 6│  (█ = 障碍)
  ├──┼──┼──┼──┤      ├──┼──┼──┼──┤
3 │  │  │  │T │    3 │ 4│ 5│ 6│T │
  └──┴──┴──┴──┘      └──┴──┴──┴──┘

BFS 从 S 向外扩展，直到到达 T
回溯找到最短路径
```

### 拥塞

当某个 GCell 的需求超过容量时，就产生**拥塞**（congestion）。

```
拥塞率 = 需求 / 容量

拥塞率 > 1.0 → 无法在该区域完成布线
拥塞率 ≈ 0.8 → 健康
```

## 动手做

### 运行全局布线

```bash
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell make do-route DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

### 交互式查看拥塞

```bash
util/docker_shell bash
openroad -no_init
```

```tcl
# 加载 CTS 后的设计
read_lef /OpenROAD-flow-scripts/flow/platforms/nangate45/lef/NangateOpenCellLibrary.macro.mod.lef
read_db /work/results/nangate45/gcd/base/4_cts.odb

# 运行全局布线
global_route -guide_file /work/results/nangate45/gcd/base/route.guide

# 注意：OpenROAD 没有 report_congestion 命令
# 拥塞信息在全局布线日志中查看（见下方 bash 命令）
```

### 查看拥塞数据

```bash
# 全局布线日志中的拥塞信息
cat logs/nangate45/gcd/base/5_1_grt.log | grep -i "congest"
```

### 路由指引文件

```bash
# 查看路由指引（哪些 GCell 被使用）
head -20 results/nangate45/gcd/base/route.guide
```

## 数学模型：Steiner 树

全局布线需要将一个 net 的所有引脚连接起来。最优解是 **Steiner 最小树**：

```
给定 n 个点，找连接它们的最短树（可以引入额外的 Steiner 点）

     ●─────●                ●──┬──●
     │     │                │  │  │
     │     │         →      │  │  │
     │     │                │  │  │
     ●     ●                ●──┘  │
                                    │
                                    ●

左：最小生成树（MST）    右：Steiner 树（更短）
```

Steiner 树问题是 NP-hard，实际使用启发式：
- 先构建 MST
- 在拐角处引入 Steiner 点
- 优化局部结构

## 关键洞察

1. **GCell 粒度影响质量**：GCell 太大，路由不够精细；太小，计算量大。ORFS 自动选择合适的粒度。

2. **拥塞是布局的反馈**：如果某个区域拥塞严重，说明布局把太多单元放在了一起。理想情况下应该回到 placement 重新优化。

3. **全局布线是估算**：这一阶段不实际画线，只规划路径。真正的线在详细布线阶段画出。

4. **GCD 没有拥塞问题**：设计太小（521 单元），拥塞不是瓶颈。大设计中拥塞是最常见的问题之一。
