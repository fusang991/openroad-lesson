# 深入理解系列

本系列结合经典教材《VLSI Physical Design: From Graph Partitioning to Timing Closure》（Andrew B. Kahng 等著），以 GCD 设计为例，讲解物理设计的核心算法和概念。

每章结构：
1. **概念**：书本核心思想
2. **数学模型**：关键公式
3. **动手做**：OpenROAD 实操命令
4. **观察**：用 GCD 数据解释现象

## 章节列表

| 章节 | 书本对应 | 核心内容 |
|------|----------|----------|
| [逻辑划分](/deep/02-partitioning) | Ch2 | 超图划分、ABC 技术映射、单元分布 |
| [布局规划](/deep/03-floorplanning) | Ch3 | 面积计算、利用率、IO 摆放、Tap 单元 |
| [布局算法](/deep/04-placement) | Ch4 | HPWL、力导向布局、全局/详细布局 |
| [全局布线](/deep/05-global-routing) | Ch5 | GCell 网格、迷宫路由、拥塞分析 |
| [详细布线](/deep/06-detailed-routing) | Ch6 | 金属层分配、DRC、天线效应 |
| [时序收敛](/deep/07-timing-closure) | Ch7 | STA、WNS/TNS、关键路径、repair_timing |

## 参考书籍

> **VLSI Physical Design: From Graph Partitioning to Timing Closure**
> Andrew B. Kahng, Jens Lienig, Igor L. Markov, Jin Hu
> Springer, 2011 (ISBN: 978-90-481-9590-9)
