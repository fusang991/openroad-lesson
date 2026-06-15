# 3. 电源网络 (PDN)

## 原理

电源分配网络（Power Distribution Network）为芯片上的所有单元提供稳定的 VDD 和 VSS 供电。PDN 由多层金属网格组成，从芯片边缘的电源焊盘一直延伸到每个标准单元。

## PDN 结构

```
        ┌──────────────────────────────┐
        │         电源环 (Ring)         │  ← 顶层金属
        │  ┌──────────────────────┐    │
        │  │    纵向 Strap (M4)   │    │
        │  │  ┌┐  ┌┐  ┌┐  ┌┐    │    │
        │  │  ││  ││  ││  ││    │    │  ← 金属网格
        │  │  └┘  └┘  └┘  └┘    │    │
        │  │    横向 Strap (M7)   │    │
        │  └──────────────────────┘    │
        └──────────────────────────────┘
```

## GCD 的 PDN 配置

GCD 是小设计，使用专门定制的 PDN 脚本：

```tcl
# grid_strategy-M1-M4-M7.tcl（完整内容）

# 全局连接：将所有单元的电源/地引脚连接到 VDD/VSS 网络
add_global_connection -net {VDD} -inst_pattern {.*} -pin_pattern {^VDD$} -power
add_global_connection -net {VDD} -inst_pattern {.*} -pin_pattern {^VDDPE$}
add_global_connection -net {VDD} -inst_pattern {.*} -pin_pattern {^VDDCE$}
add_global_connection -net {VSS} -inst_pattern {.*} -pin_pattern {^VSS$} -ground
add_global_connection -net {VSS} -inst_pattern {.*} -pin_pattern {^VSSE$}
global_connect

# 电压域定义
set_voltage_domain -name {CORE} -power {VDD} -ground {VSS}

# 标准单元电源网格
define_pdn_grid -name {grid} -voltage_domains {CORE}

# M1：跟随标准单元的电源轨（VDD/VSS stripe）
add_pdn_stripe -grid {grid} -layer {metal1} -width {0.17} -pitch {2.4} -offset {0} -followpins

# M4：纵向条带
add_pdn_stripe -grid {grid} -layer {metal4} -width {0.48} -pitch {28.0} -offset {2}

# M7：横向条带
add_pdn_stripe -grid {grid} -layer {metal7} -width {1.40} -pitch {15.0} -offset {2}

# 层间连接
add_pdn_connect -grid {grid} -layers {metal1 metal4}
add_pdn_connect -grid {grid} -layers {metal4 metal7}
```

PDN 结构：
- **M1**：紧贴标准单元的电源/地轨（followpins），宽度 0.17 μm
- **M4**：纵向电源条带，宽度 0.48 μm，间距 28.0 μm
- **M7**：横向电源条带，宽度 1.40 μm，间距 15.0 μm
- **连接**：M1↔M4 通过 via，M4↔M7 通过 via

::: warning 小设计陷阱
默认 PDN 配置的条带宽度对小设计来说太宽，会导致 `[ERROR PDN-0185] Insufficient width`。GCD 使用了专门缩小的条带宽度。
:::

## 输入文件

| 文件 | 来源 |
|------|------|
| `2_3_floorplan_tapcell.odb` | 布局规划阶段（Tap 单元后） |
| `grid_strategy-M1-M4-M7.tcl` | PDN 策略脚本 |

## 运行命令

PDN 作为布局规划的子步骤自动运行：

```bash
util/docker_shell make do-floorplan DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

## 输出文件

| 文件 | 说明 |
|------|------|
| `2_4_floorplan_pdn.odb` | 包含 PDN 的布局规划数据库 |

## 验证要点

- PDN 无 DRC 违例
- 电源条带覆盖整个核心区域
- VDD/VSS 网络完整连接
