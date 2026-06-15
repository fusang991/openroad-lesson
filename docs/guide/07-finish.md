# 7. 收尾与 GDSII 生成

## 原理

收尾阶段完成以下工作：
1. **密度填充**：插入填充单元满足制造密度要求
2. **寄生参数提取**：使用 OpenRCX 提取导线的 RC 参数
3. **时序签核**：使用 SPEF 进行精确的时序分析
4. **GDSII 生成**：使用 KLayout 将 DEF 转换为 GDSII 格式

## 输入文件

| 文件 | 来源 |
|------|------|
| `5_route.odb` | 布线数据库 |
| `5_route.sdc` | 时序约束 |

## 运行命令

```bash
util/docker_shell make do-finish DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

## 子步骤详解

### 6_1_fill — 密度填充

- 在空白区域插入额外的填充单元
- 满足制造工艺的最小密度要求

### 6_1_merge — GDSII 合并

使用 KLayout 将 DEF 转换为 GDSII：

```bash
klayout -zz -rd design_name=gcd \
    -rd in_def=6_final.def \
    -rd in_files="NangateOpenCellLibrary.gds" \
    -rd out_file=6_final.gds \
    -r def2stream.py
```

::: warning KLayout 警告
运行时可能出现：
```
Warning: DEF UNITS does not match reader DBU
```
这是一个非致命警告，不影响最终结果。
:::

### 6_report — 最终报告

生成完整的时序、面积、功耗报告。

## 最终输出文件

| 文件 | 说明 |
|------|------|
| `6_final.gds` | **GDSII 版图文件** — 最终交付物 |
| `6_final.def` | DEF 物理设计 |
| `6_final.v` | 后布线 Verilog 网表 |
| `6_final.sdc` | 时序约束 |
| `6_final.spef` | 寄生参数提取 |
| `6_final.odb` | OpenROAD 数据库 |

## 最终指标

### 时序

```
WNS (Worst Negative Slack): -0.04 ns
TNS (Total Negative Slack): -0.33 ns
时钟周期: 0.46 ns
最大频率: 2015.46 MHz
```

### 面积

```
Design area: 884 um^2
Utilization: 76%
```

### 功耗

```
Total Power: 3.48 mW
├── Internal (内部功耗):  1.82 mW (52.4%)
├── Switching (翻转功耗): 1.63 mW (46.9%)
└── Leakage (漏电流):    0.023 mW (0.7%)
```

### 单元统计

```
Sequential cells:           35  (触发器)
Combinational cells:       382  (逻辑门)
Clock buffer:                6  (时钟缓冲器)
Timing Repair Buffer:      110  (时序修复缓冲器)
Inverter:                   87  (反相器)
Clock inverter:              2  (时钟反相器)
Fill cells:                316  (填充单元)
Tap cells:                  48  (衬底连接)
─────────────────────────────
Total:                     986
```

### DRC

```
DRC violations: 0
Hold violations: 0
Setup violations: 12 (WNS = -0.04 ns, 接近满足)
```

## 查看 GDSII

使用 KLayout 打开生成的 GDSII 文件：

```bash
# 如果本地安装了 KLayout
klayout results/nangate45/gcd/base/6_final.gds
```

## 流程总结

恭喜！你已经完成了从 RTL 到 GDSII 的完整物理设计流程。

```
RTL (gcd.v, 757 行)
  → 综合 (Yosys)
  → 布局规划 (OpenROAD)
  → 电源网络 (OpenROAD)
  → 布局 (OpenROAD)
  → 时钟树 (OpenROAD)
  → 布线 (OpenROAD)
  → GDSII (KLayout)
最终版图: 6_final.gds (578 KB)
```
