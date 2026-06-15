# 完整代码与脚本

本章汇总教程中用到的所有命令和配置文件，方便复制粘贴。

## 1. 环境搭建

### 克隆 ORFS + 拉取镜像

```bash
cd ~
git clone --depth 1 https://github.com/The-OpenROAD-Project/OpenROAD-flow-scripts.git
cd OpenROAD-flow-scripts/flow
docker pull openroad/orfs:latest
```

### 验证 Docker

```bash
docker --version
docker ps
```

## 2. 一键运行完整流程

```bash
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell make DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

## 3. 单步运行

```bash
cd ~/OpenROAD-flow-scripts/flow

# 综合
util/docker_shell make do-synth DESIGN_CONFIG=designs/nangate45/gcd/config.mk

# 布局规划（含 PDN）
util/docker_shell make do-floorplan DESIGN_CONFIG=designs/nangate45/gcd/config.mk

# 布局
util/docker_shell make do-place DESIGN_CONFIG=designs/nangate45/gcd/config.mk

# 时钟树综合
util/docker_shell make do-cts DESIGN_CONFIG=designs/nangate45/gcd/config.mk

# 布线
util/docker_shell make do-route DESIGN_CONFIG=designs/nangate45/gcd/config.mk

# 收尾 + GDSII
util/docker_shell make do-finish DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

## 4. 设计配置文件

### config.mk

```makefile
export DESIGN_NAME = gcd
export PLATFORM    = nangate45

export VERILOG_FILES = $(DESIGN_HOME)/src/$(DESIGN_NAME)/gcd.v
export SDC_FILE      = $(DESIGN_HOME)/$(PLATFORM)/$(DESIGN_NAME)/constraint.sdc
export ABC_AREA      = 1

# Adders degrade GCD
export ADDER_MAP_FILE :=

export CORE_UTILIZATION ?= 55
export PLACE_DENSITY_LB_ADDON = 0.20
export TNS_END_PERCENT        = 100
export SYNTH_REPEATABLE_BUILD ?= 1

# This needs a smaller pitch to accomodate a small block
export PDN_TCL ?= $(DESIGN_HOME)/$(PLATFORM)/$(DESIGN_NAME)/grid_strategy-M1-M4-M7.tcl
```

### constraint.sdc

```tcl
current_design gcd

set clk_name core_clock
set clk_port_name clk
set clk_period 0.46
set clk_io_pct 0.2

set clk_port [get_ports $clk_port_name]

create_clock -name $clk_name -period $clk_period $clk_port

set non_clock_inputs [all_inputs -no_clocks]

set_input_delay [expr $clk_period * $clk_io_pct] -clock $clk_name $non_clock_inputs
set_output_delay [expr $clk_period * $clk_io_pct] -clock $clk_name [all_outputs]
```

### grid_strategy-M1-M4-M7.tcl（PDN 策略）

```tcl
# GCD 专用 PDN — 小设计需要较窄的条带宽度
define_pdn_grid -name grid -pins {metal4}
add_pdn_stripe -grid grid -layer metal4 -width 0.24 -pitch 14.0 -offset 1
add_pdn_stripe -grid grid -layer metal7 -width 0.70 -pitch 8.0 -offset 1
add_pdn_connect -grid grid -layers {metal4 metal7}
```

## 5. 查看结果

```bash
# 查看最终文件
ls ~/OpenROAD-flow-scripts/flow/results/nangate45/gcd/base/

# 查看时序报告
cat ~/OpenROAD-flow-scripts/flow/reports/nangate45/gcd/base/6_finish.rpt

# 查看 DRC 报告
cat ~/OpenROAD-flow-scripts/flow/reports/nangate45/gcd/base/5_route_drc.rpt

# 查看运行日志
cat ~/OpenROAD-flow-scripts/flow/logs/nangate45/gcd/base/6_report.log
```

## 6. OpenROAD 交互模式

```bash
# 进入容器
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell bash

# 启动 OpenROAD Tcl Shell
openroad -no_init
```

```tcl
# 加载时序库（必须先于 read_db）
read_liberty /OpenROAD-flow-scripts/flow/platforms/nangate45/lib/NangateOpenCellLibrary_typical.lib

# 加载设计
read_db /work/results/nangate45/gcd/base/5_route.odb
read_sdc /work/results/nangate45/gcd/base/5_route.sdc

# 设置 RC 模型
source /OpenROAD-flow-scripts/flow/platforms/nangate45/setRC.tcl

# 估算寄生参数
estimate_parasitics -global_routing

# 时序分析命令
report_tns
report_wns
report_checks -path_delay max -slack_max 0 -endpoint_path_count 20
report_timing -path_type full_clock_expanded
report_power
report_design_area
report_check_types -max_slew -max_cap -max_fanout
```

## 7. GDSII 生成（KLayout 命令）

```bash
# ORFS 自动调用，以下为等效手动命令
klayout -zz -rd design_name=gcd \
    -rd in_def=results/nangate45/gcd/base/6_final.def \
    -rd in_files="platforms/nangate45/gds/NangateOpenCellLibrary.gds" \
    -rd out_file=results/nangate45/gcd/base/6_final.gds \
    -rd tech_file=objects/nangate45/gcd/base/klayout.lyt \
    -r util/def2stream.py
```

## 8. VitePress 文档站点

### 初始化

```bash
mkdir openroad-tutorial && cd openroad-tutorial
npm init -y
npm install -D vitepress
```

### 构建与预览

```bash
# 本地开发预览
npm run docs:dev

# 构建静态文件
npm run docs:build

# 预览构建结果
npm run docs:preview
```

## 9. 清理

```bash
# 清理某个设计的运行结果
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell make clean DESIGN_CONFIG=designs/nangate45/gcd/config.mk

# 清理 Docker
docker system prune
```
