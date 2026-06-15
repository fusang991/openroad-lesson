# 关键指标解读

## 时序指标

### WNS (Worst Negative Slack)

**最差负裕量** — 所有时序路径中最差的 slack 值。

- WNS < 0：存在时序违例
- WNS >= 0：时序满足
- GCD 结果：**-0.04 ns**（轻微违例）

```
slack = 数据要求时间 - 数据到达时间
```

### TNS (Total Negative Slack)

**总负裕量** — 所有违例路径 slack 之和。

- TNS = 0：无时序违例
- TNS 越小（负值越大），问题越严重
- GCD 结果：**-0.33 ns**

### Setup Time（建立时间）

数据必须在时钟沿到来之前稳定的最小时间。

```
数据到达时间 + Tsetup <= 时钟到达时间
```

### Hold Time（保持时间）

数据必须在时钟沿之后保持稳定的最小时间。

```
数据到达时间 >= 时钟到达时间 + Thold
```

### 时钟偏斜 (Clock Skew)

时钟信号到达不同触发器的时间差。

- GCD 结果：**0.00 ns**（完美平衡）

## 面积指标

### 设计面积

芯片核心区域的总面积。

- GCD 结果：**884 μm²**

### 利用率

标准单元面积占核心面积的比例。

```
利用率 = 标准单元总面积 / 核心面积 × 100%
```

- 过低（< 50%）：浪费面积
- 过高（> 90%）：布线困难，时序恶化
- GCD 结果：**76%**（合理范围）

## 功耗指标

### 总功耗

```
Total Power = Internal + Switching + Leakage
3.48 mW    = 1.82 mW + 1.63 mW + 0.023 mW
```

| 类型 | 占比 | 说明 |
|------|------|------|
| Internal (内部) | 52.4% | 单元内部翻转消耗 |
| Switching (翻转) | 46.9% | 负载电容充放电 |
| Leakage (漏电流) | 0.7% | 静态功耗 |

## DRC 指标

### 设计规则检查

DRC 检查制造可行性：
- 最小间距
- 最小宽度
- 天线规则
- 密度规则

GCD 结果：**0 violations**

## ERC 指标

### 电气规则检查

| 检查项 | Slack | 限值 | 状态 |
|--------|-------|------|------|
| Max Slew | 0.128 | 0.199 | 通过 (64%) |
| Max Capacitance | 6.94 | 10.47 | 通过 (66%) |
| Max Fanout | ∞ | ∞ | 通过 |

## 如何解读报告

### 查看最终报告

```bash
cat reports/nangate45/gcd/base/6_finish.rpt
```

### 查看 DRC 报告

```bash
cat reports/nangate45/gcd/base/5_route_drc.rpt
```

### 查看运行日志

```bash
cat logs/nangate45/gcd/base/6_report.log
```
