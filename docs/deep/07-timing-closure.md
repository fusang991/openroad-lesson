# 深入理解：时序收敛

> 对应《VLSI Physical Design》第 7 章：Timing Closure

## 核心概念

### 什么是时序分析？

时序分析（Static Timing Analysis, STA）检查所有信号路径是否满足时序约束，**不需要仿真**。

```
          时钟周期 T = 0.46 ns
    ┌─────────────────────────────┐
    │                             │
  ──┴──                     ──────┴──
  CLK↑                         CLK↑
    │                             │
    ├── 发射触发器 FF1 ───── 路径延迟 ───── 接收触发器 FF2 ─┤
    │                             │
    │    data_arrival = 0.40 ns   │
    │    data_required = 0.46 ns  │
    │    slack = 0.46 - 0.40      │
    │         = 0.06 ns (MET)     │
```

### 关键时序指标

```
Slack = Required Time - Arrival Time

  slack > 0  →  MET（满足）
  slack < 0  →  VIOLATED（违例）
  slack = 0  →  刚好满足
```

- **WNS (Worst Negative Slack)**：最差的 slack（最大的违例）
- **TNS (Total Negative Slack)**：所有违例 slack 之和

### Setup vs Hold

```
Setup 时间检查：

  Data   ────────┐         ┌────────
                 └─────────┘
  Clock  ──┐     ┌──┐     ┌──
           └─────┘  └─────┘
                     ↑
              数据必须在此时稳定
              Tsetup = 到达时间 < 时钟沿 - Tsetup_lib

Hold 时间检查：

  Data   ────────┐
                 └──────────────────
  Clock  ──┐     ┌──┐     ┌──
           └─────┘  └─────┘
                     ↑
              数据必须在此后保持稳定
              Thold = 到达时间 > 时钟沿 + Thold_lib
```

**Setup 违例**：数据太慢到达 → 需要加速路径（更快的单元、更短的线）
**Hold 违例**：数据太快到达 → 需要减速路径（插入延迟缓冲器）

### 时钟偏斜（Clock Skew）

```
         ┌──── CLK 源
         │
    ┌────┴────┐
    │         │
  FF1       FF2
  CK↑       CK↑
  t=0.00    t=0.07

  Skew = 0.07 - 0.00 = 0.07 ns
```

时钟偏斜影响所有触发器的时序分析。CTS 的目标就是最小化偏斜。

### Critical Path

**关键路径**是 slack 最差的路径，决定芯片的最高频率。

```
fmax = 1 / T_min
T_min = T_critical_path + Tsetup + Tskew
```

## 动手做

### 查看最终时序报告

```bash
cat reports/nangate45/gcd/base/6_finish.rpt
```

关键数据：

```
WNS: -0.04 ns   ← 最差违例 0.04 ns
TNS: -0.33 ns   ← 所有违例加起来 0.33 ns
Setup violations: 12
Hold violations: 0
```

### 解读关键路径

```bash
# 查看 setup 路径（最慢的路径）
cat reports/nangate45/gcd/base/6_finish.rpt | grep -A60 "report_checks -path_delay max reg to reg"
```

GCD 的关键路径（reg-to-reg）：

```
Startpoint: dpath.a_reg.out[9]$_DFFE_PP_
Endpoint:   dpath.a_reg.out[5]$_DFFE_PP_

  Delay    Time   Description
   0.00    0.00   clock core_clock (rise edge)
   0.03    0.03   clkbuf_0_clk/Z (CLKBUF_X3)
   0.04    0.07   clkbuf_2_2__f_clk/Z (CLKBUF_X3)
   0.00    0.07   FF CK
   0.11    0.18   FF Q                     ← FF 输出延迟
   0.02    0.19   NOR2 → NAND2 → NOR2      ← 组合逻辑
   0.04    0.23   NOR4
   0.02    0.26   NAND2
   0.03    0.28   NOR2
   0.02    0.31   BUF
   0.03    0.34   AND2
   0.02    0.36   NAND2
   0.04    0.40   AOI21
   0.03    0.43   BUF
   0.01    0.45   NAND2
   0.02    0.47   NAND3
   0.01    0.48   NAND2
   0.01    0.49   INV
   0.00    0.49   FF D                     ← 到达接收 FF
           0.49   data arrival time

           0.50   data required time
           0.01   slack (MET)              ← 这条路径刚好满足
```

### 交互式 STA

```bash
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell bash
openroad -no_init
```

```tcl
# 加载设计
read_liberty /OpenROAD-flow-scripts/flow/platforms/nangate45/lib/NangateOpenCellLibrary_typical.lib
read_db /work/results/nangate45/gcd/base/6_final.odb
read_sdc /work/results/nangate45/gcd/base/6_final.sdc
source /OpenROAD-flow-scripts/flow/platforms/nangate45/setRC.tcl

# 用 SPEF 精确分析
read_spef /work/results/nangate45/gcd/base/6_final.spef

# === 时序报告 ===

# 1. 总览
report_tns              ;# -0.33 ns
report_wns              ;# -0.04 ns

# 2. Setup 路径（最慢的 20 条）
report_checks -path_delay max -slack_max 0 -endpoint_path_count 20

# 3. Hold 路径
report_checks -path_delay min -slack_max 0

# 4. 完整时钟路径
report_timing -path_type full_clock_expanded

# 5. 功耗
report_power

# 6. 电气规则检查
report_check_types -max_slew -max_cap -max_fanout

# 7. 设计面积
report_design_area

# 8. 时钟偏斜
report_clock_skew
```

### 实验：修复时序违例

```tcl
# 在交互模式下尝试修复

# 1. 修复 setup 违例
repair_timing -setup

# 2. 重新检查
report_tns
report_wns

# 3. 如果有 hold 违例
repair_timing -hold

# 4. 查看修复后的单元变化
report_cell_usage
```

### 实验：放宽时钟约束

修改 SDC，观察时序变化：

```tcl
# 放宽到 0.6 ns（约 1.67 GHz）
create_clock -name core_clock -period 0.60 [get_ports clk]
```

```bash
# 重新运行
util/docker_shell make DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

预期：时序违例消失或减少。

## 数学模型：时序分析公式

### 路径延迟

```
T_path = T_clk_to_q + T_combinational + T_routing + T_setup

其中：
  T_clk_to_q = 触发器 CK→Q 延迟（约 0.11 ns for DFF_X1）
  T_combinational = 组合逻辑延迟之和
  T_routing = 导线 RC 延迟
  T_setup = 接收触发器的 setup 时间（约 0.03 ns）
```

### Slack 计算

```
Setup Slack = (T_clk + T_skew) - T_data_arrival - T_setup_library
            = (0.46 + 0.00) - 0.49 - 0.03
            = -0.06 ns (实际值因路径而异)

Hold Slack = T_data_arrival - (T_clk + T_skew) + T_hold_library
```

### 时钟不确定性

::: warning 假设性示例
GCD 的实际 SDC 中没有 `set_clock_uncertainty`。以下仅为说明概念：

```tcl
# 假设添加时钟不确定性
set_clock_uncertainty 0.5 [get_clocks clk]
# 有效时钟周期 = 0.46 - 0.5 = -0.04 ns（太紧了！）
```

实际项目中，时钟不确定性通常为时钟周期的 5%-10%。
:::

## 关键洞察

1. **Setup 违例 vs Hold 违例**：Setup 违例可以通过降频解决，Hold 违例必须修复（插入缓冲器）。GCD 有 12 个 setup 违例但 0 个 hold 违例。

2. **WNS -0.04 ns 意味着什么**：最差路径比时钟周期慢 40 ps。可以通过降频 10%（0.50 ns → 2.0 GHz）完全消除。

3. **关键路径 = 最长组合逻辑**：GCD 的关键路径经过 14 个逻辑门。减少逻辑级数是优化时序的根本方法。

4. **CTS 的贡献**：时钟偏斜 0.00 ns，说明 CTS 做得很好。如果偏斜大，会影响所有路径的 slack。

5. **SPEF 的重要性**：布线阶段用估算的 RC 值，finish 阶段用 SPEF（实际提取的 RC 值）。SPEF 更准确，是签核（signoff）的依据。

6. **时序收敛是迭代过程**：一次运行通常无法满足所有时序要求。实际项目中需要反复调整布局、布线、缓冲器插入。
