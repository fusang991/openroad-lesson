# 深入理解：逻辑划分与综合

> 对应《VLSI Physical Design》第 2 章：Partitioning

## 核心概念

### 什么是划分？

划分（Partitioning）是将一个大电路拆分成多个子电路的过程。目标是：

- **最小化子电路间的连线**（cut size）
- **平衡子电路的面积**

在物理设计中，划分出现在多个层次：
- 芯片被划分为多个模块（block）
- 每个模块被划分为标准单元行
- 逻辑综合中的技术映射也是一种划分

### 超图划分

电路可以表示为超图（Hypergraph）：
- **节点** = 标准单元（门、触发器）
- **超边** = 网络（net），连接多个节点

划分问题：将节点分成两组，使跨组的超边数最少。

```
最小割（Min-Cut）问题：
  minimize  |{e ∈ E : e 跨越两个分区}|
  subject to |P1| ≈ |P2|  (面积平衡)
```

这是 NP-hard 问题，实际使用启发式算法：
- **Fiduccia-Mattheyses (FM)** 算法：贪心移动 + 回溯
- **Kernighan-Lin (KL)** 算法：交换节点对

### 逻辑综合中的划分

Yosys 综合过程实际上包含了多层划分：

```
RTL 代码
  → 1. 构建内部图表示
  → 2. 逻辑优化（消除冗余）
  → 3. ABC 技术映射（映射到标准单元库）
```

ABC（UC Berkeley 的逻辑综合工具）在映射时需要：
- 将布尔网络划分为可映射的子图
- 每个子图映射到一个标准单元
- 目标：最小化面积或延迟

## 动手做

### 观察综合过程

```bash
cd ~/OpenROAD-flow-scripts/flow

# 查看综合日志中的 ABC 步骤
cat logs/nangate45/gcd/base/1_2_yosys.log | grep -E "ABC|OPT_|PROC_|FSM"
```

输出中的关键步骤：

```
10.1. Extracting gate netlist of module \gcd ...
10.1.1. Executed ABC.
10.1.2. Re-integrating ABC results.
```

ABC 接收原始门级网表，用 Nangate45 库进行技术映射。

### 统计综合后的单元分布

```bash
# 从综合后网表中统计单元类型
grep -oP '[A-Z][A-Z0-9_]+_X[0-9]+' \
    results/nangate45/gcd/base/1_2_yosys.v \
    | sort | uniq -c | sort -rn
```

GCD 综合结果（521 个单元）：

```
164 NAND2_X1       ← 最多，2输入与非门是基础逻辑
 72 INV_X1         ← 反相器
 38 OAI21_X1       ← 或与非门
 35 DFF_X1         ← D 触发器（GCD 有 35 个寄存器）
 28 NOR2_X1        ← 2输入或非门
 28 NAND4_X1       ← 4输入与非门
 28 NAND2_X2       ← 驱动能力更强的与非门
 19 NAND3_X1       ← 3输入与非门
 12 INV_X2         ← 反相器（驱动 x2）
 11 NOR2_X2
  9 OAI21_X2
  9 NAND3_X2
  8 NAND2_X4
  7 XNOR2_X1       ← 异或非门
  7 NOR2_X4
  5 BUF_X8         ← 缓冲器
  5 BUF_X1
  5 AOI21_X1       ← 与或非门
  4 NOR4_X1
  4 AND2_X1
  ... (其余均为少量)
```

### 观察关键数字

```bash
# 综合后的设计面积
cat logs/nangate45/gcd/base/1_synth.log | grep "Design area"
# 输出：Design area 663 um^2 100% utilization.

# 最终设计面积（布局后）
cat logs/nangate45/gcd/base/6_report.log | grep "Design area"
# 输出：Design area 884 um^2 76% utilization.
```

对比：
| 阶段 | 面积 | 利用率 |
|------|------|--------|
| 综合后（纯单元） | 663 μm² | 100% |
| 最终（含填充/缓冲） | 884 μm² | 76% |

面积增长 33%，来自：
- 时钟树缓冲器（6 个 CLKBUF + 110 个 timing repair buffer）
- 填充单元（316 个 filler）
- Tap 单元（48 个）

## 数学模型：单元面积计算

```
标准单元面积 = Σ (每个单元的宽度 × 高度)

Nangate45 单元高度固定 = 1.4 μm
NAND2_X1 宽度 = 0.94 μm → 面积 = 0.94 × 1.4 = 1.316 μm²
DFF_X1 宽度 = 3.58 μm → 面积 = 3.58 × 1.4 = 5.012 μm²
```

GCD 综合后面积 663 μm² ÷ 单元高度 1.4 μm ≈ 474 μm 的总单元宽度。

## 关键洞察

1. **NAND2 为主**：164 个 NAND2_X1 占总单元数的 31%。这符合经验——大多数布尔函数可以分解为与非门的组合。

2. **触发器数量 = 设计复杂度**：35 个 DFF 代表 GCD 的状态数。状态越多，CTS 和时序收敛越难。

3. **综合面积 vs 物理面积**：综合后 663 μm²，最终 884 μm²。物理设计的开销（布线通道、缓冲器、填充）约占 25%。

4. **ABC 的角色**：ABC 是划分和映射的核心。它将 RTL 逻辑分解为标准单元库中的单元，这本质上是一个带约束的图划分问题。
