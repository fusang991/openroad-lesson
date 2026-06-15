# 常见问题

## 环境问题

### Docker 相关

**Q: `docker: permission denied` 怎么办？**

```bash
sudo usermod -aG docker $USER
# 重新登录
```

**Q: Docker 镜像拉取失败？**

检查网络，或使用镜像源：
```bash
# 编辑 /etc/docker/daemon.json
{
  "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]
}
sudo systemctl restart docker
```

**Q: 磁盘空间不足？**

```bash
# 查看 Docker 磁盘使用
docker system df

# 清理无用镜像
docker system prune -a
```

### ORFS 相关

**Q: `git clone` 太慢？**

```bash
# 使用 --depth 1 只克隆最新版本
git clone --depth 1 https://github.com/The-OpenROAD-Project/OpenROAD-flow-scripts.git
```

## 运行问题

### 综合阶段

**Q: Yosys 报错找不到库文件？**

检查 `config.mk` 中的 `PLATFORM` 路径是否正确。

### 布局规划

**Q: `[ERROR PDN-0185] Insufficient width`？**

小设计需要自定义 PDN 脚本。参考 GCD 的 `grid_strategy-M1-M4-M7.tcl`。

**Q: 利用率超过 100%？**

降低 `CORE_UTILIZATION`：
```makefile
export CORE_UTILIZATION ?= 30
```

### 布线阶段

**Q: DRC 违例怎么修？**

1. 检查 `5_route_drc.rpt` 了解违例类型
2. 尝试降低布局密度
3. 检查 PDN 是否合理

**Q: TritonRoute 报错 `Net zero_ of signal type GROUND is not routable`？**

这是因为手动综合流程没有正确设置电源网络。使用 ORFS 完整流程即可避免。

### 时序问题

**Q: Setup 违例太多？**

1. 放宽时钟约束（增大时钟周期）
2. 增加 `TNS_END_PERCENT`
3. 检查利用率是否过高

**Q: Hold 违例？**

在 `config.mk` 中放松 hold 约束：
```makefile
export HOLD_SLACK_MARGIN = -0.5
```

## 输出问题

**Q: GDSII 文件在哪里？**

```
results/nangate45/gcd/base/6_final.gds
```

**Q: 如何查看 GDSII？**

```bash
# 本地安装 KLayout
klayout results/nangate45/gcd/base/6_final.gds
```

**Q: 结果在 Docker 容器里拿不到？**

使用 `docker_shell` 运行时，结果会自动映射到宿主机的 `results/` 目录。

## 进阶问题

**Q: 如何运行自己的设计？**

参考 ORFS 文档中的自定义设计流程。关键步骤：
1. 创建 `designs/nangate45/my_design/config.mk`
2. 准备 RTL 和 SDC
3. 使用 `docker run` 的方式运行

**Q: 如何查看中间结果？**

```bash
# 使用 OpenROAD 交互模式
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell bash
openroad -no_init

# 在 Tcl shell 中加载中间结果
read_liberty /OpenROAD-flow-scripts/flow/platforms/nangate45/lib/NangateOpenCellLibrary_typical.lib
read_db /work/results/nangate45/gcd/base/3_place.odb
read_sdc /work/results/nangate45/gcd/base/3_place.sdc
```

**Q: 如何单独运行某个阶段？**

```bash
make do-synth DESIGN_CONFIG=...     # 综合
make do-floorplan DESIGN_CONFIG=... # 布局规划
make do-place DESIGN_CONFIG=...     # 布局
make do-cts DESIGN_CONFIG=...       # 时钟树
make do-route DESIGN_CONFIG=...     # 布线
make do-finish DESIGN_CONFIG=...    # 收尾
```
