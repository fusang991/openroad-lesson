# 1. 逻辑综合 (Synthesis)

## 原理

逻辑综合是将 RTL（寄存器传输级）Verilog 代码转换为由标准单元组成的门级网表。这一步由 **Yosys** 完成。

综合过程包括：
1. **读入 RTL**：解析 Verilog，构建内部表示
2. **逻辑优化**：简化布尔表达式，消除冗余逻辑
3. **工艺映射**：将逻辑映射到 Nangate45 标准单元库

## 输入文件

| 文件 | 说明 |
|------|------|
| `designs/src/gcd/gcd.v` | RTL 源代码（757 行） |
| `designs/nangate45/gcd/constraint.sdc` | 时序约束 |
| `platforms/nangate45/lib/NangateOpenCellLibrary_typical.lib` | 标准单元库 |

## 关键配置

```makefile
# designs/nangate45/gcd/config.mk
export DESIGN_NAME = gcd
export PLATFORM    = nangate45
export VERILOG_FILES = $(DESIGN_HOME)/src/$(DESIGN_NAME)/gcd.v
export SDC_FILE      = $(DESIGN_HOME)/$(PLATFORM)/$(DESIGN_NAME)/constraint.sdc
export ABC_AREA      = 1          # 面积优先优化
export ADDER_MAP_FILE :=           # 禁用加法器映射（GCD 不需要）
```

## 时序约束 (SDC)

```tcl
# constraint.sdc
create_clock -name core_clock -period 0.46 [get_ports clk]
set_input_delay [expr 0.46 * 0.2] -clock core_clock [all_inputs -no_clocks]
set_output_delay [expr 0.46 * 0.2] -clock core_clock [all_outputs]
```

- 时钟周期：0.46 ns（约 2.015 GHz）
- 输入/输出延迟：时钟周期的 20%

## 运行命令

```bash
# 单独运行综合阶段
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell make do-synth DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

## 输出文件

| 文件 | 说明 |
|------|------|
| `results/.../1_2_yosys.v` | 综合后的门级网表 |
| `results/.../1_synth.odb` | OpenROAD 数据库 |
| `results/.../1_synth.sdc` | 综合后的约束文件 |
| `logs/.../1_2_yosys.log` | Yosys 运行日志 |

## 综合子步骤

| 子步骤 | 说明 |
|--------|------|
| `1_1_yosys_canonicalize` | RTL 规范化 |
| `1_2_yosys` | 综合 + 工艺映射 |
| `1_synth` | 转换为 ODB 格式 |

## 验证要点

综合完成后检查：
- 日志中无 ERROR
- 门级网表中的单元都在 Nangate45 库中
- 时序约束被正确传递
