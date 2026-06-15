# 代码

本章汇总教程中涉及的所有源代码、配置文件和脚本。

---

## 一、RTL 源码 — gcd.v

GCD（最大公约数）模块，757 行 Verilog，由 PyMTL 自动生成。

包含以下子模块：
- `gcd` — 顶层模块，连接控制和数据通路
- `GcdUnitCtrlRTL` — 控制器，状态机（IDLE → CALC → DONE）
- `GcdUnitDpathRTL` — 数据通路，含寄存器、比较器、减法器、多路选择器
- `RegRst` — 带复位的寄存器
- `RegEn` — 带使能的寄存器
- `LtComparator` — 小于比较器
- `ZeroComparator` — 零比较器
- `Mux` — 多路选择器（3端口和2端口）
- `Subtractor` — 减法器

```verilog
// gcd.v — 完整 RTL 源码
// 来源：OpenROAD-flow-scripts/flow/designs/src/gcd/gcd.v

module gcd
(
  input  wire clk,
  input  wire [31:0] req_msg,
  output wire req_rdy,
  input  wire req_val,
  input  wire reset,
  output wire [15:0] resp_msg,
  input  wire resp_rdy,
  output wire resp_val
);

  // ctrl 信号
  wire ctrl$is_b_zero, ctrl$resp_rdy, ctrl$clk;
  wire ctrl$is_a_lt_b, ctrl$req_val, ctrl$reset;
  wire [1:0] ctrl$a_mux_sel;
  wire ctrl$resp_val, ctrl$b_mux_sel;
  wire ctrl$b_reg_en, ctrl$a_reg_en, ctrl$req_rdy;

  GcdUnitCtrlRTL ctrl (
    .is_b_zero (ctrl$is_b_zero),
    .resp_rdy  (ctrl$resp_rdy),
    .clk       (ctrl$clk),
    .is_a_lt_b (ctrl$is_a_lt_b),
    .req_val   (ctrl$req_val),
    .reset     (ctrl$reset),
    .a_mux_sel (ctrl$a_mux_sel),
    .resp_val  (ctrl$resp_val),
    .b_mux_sel (ctrl$b_mux_sel),
    .b_reg_en  (ctrl$b_reg_en),
    .a_reg_en  (ctrl$a_reg_en),
    .req_rdy   (ctrl$req_rdy)
  );

  // dpath 信号
  wire [1:0] dpath$a_mux_sel;
  wire dpath$clk, dpath$b_mux_sel, dpath$reset;
  wire dpath$b_reg_en, dpath$a_reg_en;
  wire [15:0] dpath$req_msg_b, dpath$req_msg_a;
  wire dpath$is_b_zero, dpath$is_a_lt_b;
  wire [15:0] dpath$resp_msg;

  GcdUnitDpathRTL dpath (
    .a_mux_sel (dpath$a_mux_sel),
    .clk       (dpath$clk),
    .req_msg_b (dpath$req_msg_b),
    .req_msg_a (dpath$req_msg_a),
    .b_mux_sel (dpath$b_mux_sel),
    .reset     (dpath$reset),
    .b_reg_en  (dpath$b_reg_en),
    .a_reg_en  (dpath$a_reg_en),
    .is_b_zero (dpath$is_b_zero),
    .resp_msg  (dpath$resp_msg),
    .is_a_lt_b (dpath$is_a_lt_b)
  );

  // 信号连接
  assign ctrl$clk        = clk;
  assign ctrl$is_a_lt_b  = dpath$is_a_lt_b;
  assign ctrl$is_b_zero  = dpath$is_b_zero;
  assign ctrl$req_val    = req_val;
  assign ctrl$reset      = reset;
  assign ctrl$resp_rdy   = resp_rdy;
  assign dpath$a_mux_sel = ctrl$a_mux_sel;
  assign dpath$a_reg_en  = ctrl$a_reg_en;
  assign dpath$b_mux_sel = ctrl$b_mux_sel;
  assign dpath$b_reg_en  = ctrl$b_reg_en;
  assign dpath$clk       = clk;
  assign dpath$req_msg_a = req_msg[31:16];
  assign dpath$req_msg_b = req_msg[15:0];
  assign dpath$reset     = reset;
  assign req_rdy         = ctrl$req_rdy;
  assign resp_msg        = dpath$resp_msg;
  assign resp_val        = ctrl$resp_val;
endmodule

// ---------- 控制器：状态机 ----------
module GcdUnitCtrlRTL (
  output reg [1:0] a_mux_sel,
  output reg       a_reg_en,
  output reg       b_mux_sel,
  output reg       b_reg_en,
  input  wire      clk,
  input  wire      is_a_lt_b,
  input  wire      is_b_zero,
  output reg       req_rdy,
  input  wire      req_val,
  input  wire      reset,
  input  wire      resp_rdy,
  output reg       resp_val
);
  localparam A_MUX_SEL_IN  = 0;
  localparam A_MUX_SEL_SUB = 1;
  localparam A_MUX_SEL_B   = 2;
  localparam B_MUX_SEL_A   = 0;
  localparam B_MUX_SEL_IN  = 1;
  localparam STATE_IDLE = 0;
  localparam STATE_CALC = 1;
  localparam STATE_DONE = 2;

  reg [1:0] state;

  // 状态转移
  always @(posedge clk) begin
    if (reset)
      state <= STATE_IDLE;
    else begin
      case (state)
        STATE_IDLE:
          if (req_val && req_rdy) state <= STATE_CALC;
        STATE_CALC:
          if (!is_a_lt_b && is_b_zero) state <= STATE_DONE;
        STATE_DONE:
          if (resp_val && resp_rdy) state <= STATE_IDLE;
      endcase
    end
  end

  // 输出逻辑
  always @(*) begin
    case (state)
      STATE_IDLE: begin
        req_rdy = 1; resp_val = 0;
        a_mux_sel = A_MUX_SEL_IN; a_reg_en = 1;
        b_mux_sel = B_MUX_SEL_IN; b_reg_en = 1;
      end
      STATE_CALC: begin
        req_rdy = 0; resp_val = 0;
        a_mux_sel = is_a_lt_b ? A_MUX_SEL_B : A_MUX_SEL_SUB;
        a_reg_en = 1;
        b_mux_sel = B_MUX_SEL_A;
        b_reg_en = is_a_lt_b;
      end
      STATE_DONE: begin
        req_rdy = 0; resp_val = 1;
        a_mux_sel = 0; a_reg_en = 0;
        b_mux_sel = 0; b_reg_en = 0;
      end
      default: begin
        req_rdy = 0; resp_val = 0;
        a_mux_sel = 0; a_reg_en = 0;
        b_mux_sel = 0; b_reg_en = 0;
      end
    endcase
  end
endmodule

// ---------- 数据通路 ----------
module GcdUnitDpathRTL (
  input  wire [1:0]  a_mux_sel,
  input  wire        a_reg_en, b_mux_sel, b_reg_en, clk, reset,
  output wire        is_a_lt_b, is_b_zero,
  input  wire [15:0] req_msg_a, req_msg_b,
  output wire [15:0] resp_msg
);
  wire [15:0] a_reg_out, b_reg_out, sub_out;

  // a 寄存器 + 3选1 Mux
  reg [15:0] a_mux_out;
  always @(*) begin
    case (a_mux_sel)
      2'd0: a_mux_out = req_msg_a;
      2'd1: a_mux_out = sub_out;
      2'd2: a_mux_out = b_reg_out;
      default: a_mux_out = req_msg_a;
    endcase
  end
  always @(posedge clk)
    if (a_reg_en) a_reg_out <= a_mux_out;
  assign a_reg_out = a_reg_out;

  // b 寄存器 + 2选1 Mux
  reg [15:0] b_mux_out;
  always @(*) begin
    b_mux_out = b_mux_sel ? req_msg_b : a_reg_out;
  end
  always @(posedge clk)
    if (b_reg_en) b_reg_out <= b_mux_out;
  assign b_reg_out = b_reg_out;

  // 比较器 + 减法器
  assign is_a_lt_b = (a_reg_out < b_reg_out);
  assign is_b_zero = (b_reg_out == 0);
  assign sub_out   = a_reg_out - b_reg_out;
  assign resp_msg  = sub_out;
endmodule
```

::: tip
以上为简化重写版，便于理解算法逻辑。完整自动生成的源码见 ORFS 仓库 `flow/designs/src/gcd/gcd.v`（757 行）。
:::

---

## 二、综合后网表 — 1_2_yosys.v（摘录）

Yosys 综合输出，3313 行。所有行为级代码被映射为 Nangate45 标准单元。

```verilog
/* Generated by Yosys 0.53+71 (git sha1 6d0e3a400, clang++ 18.1.3 -fPIC -Os) */
module gcd(clk, req_msg, req_rdy, req_val, reset, resp_msg, resp_rdy, resp_val);
  input clk;
  wire clk;
  input [31:0] req_msg;
  wire [31:0] req_msg;
  output req_rdy;
  wire req_rdy;
  input req_val;
  wire req_val;
  input reset;
  wire reset;
  output [15:0] resp_msg;
  wire [15:0] resp_msg;
  input resp_rdy;
  wire resp_rdy;
  output resp_val;
  wire resp_val;

  // 内部信号
  wire [1:0] ctrl$a_mux_sel;
  wire ctrl$a_reg_en;
  wire ctrl$b_mux_sel;
  // ... 省略 ...

  // 标准单元实例化示例
  DFF_X1 \ctrl.state.out[0]$_DFF_P_ (
    .CK(clk),
    .D(_016_),
    .Q(\ctrl.state.out [0])
  );

  NAND2_X1 _965_ (
    .A1(\ctrl.state.out [0]),
    .A2(_463_),
    .ZN(_016_)
  );

  // ... 共 3313 行，包含约 800 个标准单元实例 ...
endmodule
```

::: tip
综合后网表中的所有单元（如 `DFF_X1`, `NAND2_X1`, `NOR2_X2`）都来自 Nangate45 标准单元库。完整文件路径：`results/nangate45/gcd/base/1_2_yosys.v`
:::

---

## 三、最终网表 — 6_final.v（摘录）

经过布局、时钟树、布线后的最终网表。与综合网表相比，增加了时钟缓冲器。

```verilog
/* Generated by Yosys 0.53+71 */
module gcd(clk, req_msg, req_rdy, req_val, reset, resp_msg, resp_rdy, resp_val);
  input clk;
  wire clk;
  // ... 端口声明同上 ...

  // 时钟树缓冲器（CTS 插入）
  CLKBUF_X3 clkbuf_0_clk (
    .A(clk),
    .Z(clknet_0_clk)
  );

  CLKBUF_X3 clkbuf_2_0__f_clk (
    .A(clknet_0_clk),
    .Z(clknet_2_0__leaf_clk)
  );

  CLKBUF_X3 clkbuf_2_1__f_clk (
    .A(clknet_0_clk),
    .Z(clknet_2_1__leaf_clk)
  );

  CLKBUF_X3 clkbuf_2_2__f_clk (
    .A(clknet_0_clk),
    .Z(clknet_2_2__leaf_clk)
  );

  // 数据通路单元（与综合网表类似，但部分单元被 resize）
  DFF_X1 \ctrl.state.out[0]$_DFF_P_ (
    .CK(clknet_2_0__leaf_clk),  // 连接到时钟树叶子节点
    .D(_016_),
    .Q(\ctrl.state.out [0])
  );

  // ... 共 2498 行 ...
endmodule
```

::: tip
最终网表比综合网表短，因为 Yosys 在写最终网表时做了优化。完整文件路径：`results/nangate45/gcd/base/6_final.v`
:::

---

## 四、配置文件

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
define_pdn_grid -name grid -pins {metal4}
add_pdn_stripe -grid grid -layer metal4 -width 0.24 -pitch 14.0 -offset 1
add_pdn_stripe -grid grid -layer metal7 -width 0.70 -pitch 8.0 -offset 1
add_pdn_connect -grid grid -layers {metal4 metal7}
```

---

## 五、运行脚本

### 一键运行完整流程

```bash
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell make DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

### 单步运行

```bash
cd ~/OpenROAD-flow-scripts/flow
DC=DESIGN_CONFIG=designs/nangate45/gcd/config.mk

util/docker_shell make do-synth     $DC   # 1. 综合
util/docker_shell make do-floorplan $DC   # 2. 布局规划
util/docker_shell make do-place     $DC   # 3. 布局
util/docker_shell make do-cts       $DC   # 4. 时钟树
util/docker_shell make do-route     $DC   # 5. 布线
util/docker_shell make do-finish    $DC   # 6. 收尾+GDSII
```

### 清理

```bash
util/docker_shell make clean DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

---

## 六、OpenROAD 交互脚本

### 启动交互会话

```bash
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell bash
openroad -no_init
```

### Tcl 命令（时序分析）

```tcl
# 必须先加载 liberty
read_liberty /OpenROAD-flow-scripts/flow/platforms/nangate45/lib/NangateOpenCellLibrary_typical.lib

# 加载设计
read_db /work/results/nangate45/gcd/base/5_route.odb
read_sdc /work/results/nangate45/gcd/base/5_route.sdc

# 设置 RC 模型
source /OpenROAD-flow-scripts/flow/platforms/nangate45/setRC.tcl
estimate_parasitics -global_routing

# 时序报告
report_tns
report_wns
report_checks -path_delay max -slack_max 0 -endpoint_path_count 20
report_timing -path_type full_clock_expanded
report_power
report_design_area
report_check_types -max_slew -max_cap -max_fanout
```

---

## 七、KLayout GDSII 生成命令

```bash
klayout -zz -rd design_name=gcd \
    -rd in_def=results/nangate45/gcd/base/6_final.def \
    -rd in_files="platforms/nangate45/gds/NangateOpenCellLibrary.gds" \
    -rd out_file=results/nangate45/gcd/base/6_final.gds \
    -rd tech_file=objects/nangate45/gcd/base/klayout.lyt \
    -r util/def2stream.py
```

---

## 八、VitePress 文档站点

### 初始化

```bash
mkdir openroad-tutorial && cd openroad-tutorial
npm init -y
npm install -D vitepress
```

### 常用命令

```bash
npm run docs:dev      # 本地开发预览
npm run docs:build    # 构建静态文件
npm run docs:preview  # 预览构建结果
```
