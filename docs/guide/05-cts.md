# 5. 时钟树综合 (CTS)

## 原理

时钟树综合（Clock Tree Synthesis）是物理设计中最关键的步骤之一。它的目标是：

1. **构建时钟树**：从时钟源到所有触发器构建平衡的树形结构
2. **插入缓冲器**：在时钟路径上插入 CLKBUF 单元，驱动大扇出
3. **平衡偏斜 (Skew)**：确保时钟信号同时到达所有触发器
4. **满足时序**：确保 setup 和 hold 时间都能满足

## 时钟树结构

```
        clk (输入端口)
          │
     CLKBUF_X3 (根节点)
       ┌──┴──┐
  CLKBUF_X3  CLKBUF_X3
   ┌──┴──┐    ┌──┴──┐
  FF    FF   FF    FF    ← 触发器
```

## 输入文件

| 文件 | 来源 |
|------|------|
| `3_place.odb` | 布局数据库 |
| `3_place.sdc` | 时序约束 |

## 运行命令

```bash
util/docker_shell make do-cts DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

## CTS 过程

1. **时钟树构建**：使用 `clock_tree_synthesis` 命令
2. **时钟树优化**：插入缓冲器，平衡偏斜
3. **时序修复**：对 setup 和 hold 违例进行修复

## CTS 后的关键指标

### 时钟偏斜

```
Clock core_clock
   0.07 source latency dpath.a_reg.out[8]$_DFFE_PP_/CK
  -0.07 target latency dpath.b_reg.out[0]$_DFFE_PP_/CK
   0.00 CRPR
   0.00 setup skew
```

时钟偏斜为 0.00 ns — 非常理想。

### 时钟缓冲器

GCD 设计的时钟树使用了 CLKBUF_X3 缓冲器，形成两级结构：
- 根节点：1 个 CLKBUF_X3（clkbuf_0_clk）
- 第二级：4 个 CLKBUF_X3（clkbuf_2_0 ~ clkbuf_2_3）
- 负载缓冲：1 个 CLKBUF_X1（clkload2）
- 共计 6 个时钟缓冲器

## 输出文件

| 文件 | 说明 |
|------|------|
| `4_cts.odb` | CTS 完成的数据库 |
| `4_cts.sdc` | 更新的时序约束 |

## 验证要点

- 时钟偏斜在可接受范围内（通常 < 10% 时钟周期）
- 无 hold 违例
- Setup 违例可控
- 时钟树深度合理

## 常见问题

### CTS 警告：Wire RC 为零

```
[WARNING CTS-0104] Clock wire resistance/capacitance values are zero.
```

这是一个非致命警告。ORFS 流程会在后续步骤中设置正确的 wire RC 值。
