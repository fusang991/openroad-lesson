# 6. 布线 (Routing)

## 原理

布线是物理设计中计算量最大的步骤，负责用金属导线连接所有信号。分为两个阶段：

1. **全局布线 (Global Routing)**：将芯片划分为网格，规划每条线的大致路径
2. **详细布线 (Detail Routing)**：在金属层上精确绘制每条导线，确保满足设计规则

## 输入文件

| 文件 | 来源 |
|------|------|
| `4_cts.odb` | CTS 数据库 |
| `4_cts.sdc` | 时序约束 |

## 运行命令

```bash
util/docker_shell make do-route DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

## 子步骤详解

### 5_1_grt — 全局布线

- 将芯片划分为布线网格
- 为每条信号线规划路径
- 考虑拥塞、时序、DRC 约束
- 耗时约 7 秒，消耗 290 MB

### 5_2_route — 详细布线

- 在金属层上精确绘制导线
- 使用 TritonRoute 引擎
- 遵循设计规则（最小间距、最小宽度等）
- 耗时约 12 秒，消耗 1014 MB（峰值内存）

### 5_3_fillcell — 填充单元

- 在空白区域插入填充单元（filler cell）
- 确保标准单元行连续
- GCD 设计插入 316 个填充单元

## 布线层

Nangate45 工艺的金属层：

| 层 | 用途 |
|------|------|
| M1 | 局部布线（单元内部） |
| M2-M4 | 信号布线 |
| M5-M7 | 电源/时钟/长距离信号 |
| M8-M9 | 顶层金属（PDN） |

## 关键指标

### DRC 检查

```
5_route_drc.rpt: 0 violations
```

GCD 设计没有 DRC 违例。

### 时序

布线后的时序使用 `estimate_parasitics -global_routing` 估算：
- WNS: -0.04 ns
- TNS: -0.33 ns

::: tip
布线阶段的时序是估算值，最终结果以 finish 阶段的 SPEF 提取为准。
:::

## 输出文件

| 文件 | 说明 |
|------|------|
| `5_route.odb` | 布线完成的数据库 |
| `5_route.def` | 布线后的 DEF 文件 |
| `5_route.sdc` | 时序约束 |
| `route.guide` | 全局布线指引 |

## 验证要点

- DRC 违例数为 0
- 所有信号线已连接
- 时序满足或接近满足
- 无天线违例
