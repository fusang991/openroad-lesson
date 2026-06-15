# 环境搭建

## 前置条件

- 操作系统：Linux（推荐 Ubuntu 20.04/22.04/24.04）或 WSL2
- Docker：已安装并可正常运行
- 磁盘空间：至少 5 GB（Docker 镜像约 1.5 GB + 运行时文件）

## 第一步：安装 Docker

如果你还没有安装 Docker：

```bash
# Ubuntu
sudo apt update
sudo apt install -y docker.io
sudo usermod -aG docker $USER
# 重新登录使 docker 组生效
```

验证安装：

```bash
docker --version
# 输出类似: Docker version 28.4.0
```

## 第二步：克隆 ORFS 仓库

```bash
cd ~
git clone --depth 1 https://github.com/The-OpenROAD-Project/OpenROAD-flow-scripts.git
cd OpenROAD-flow-scripts
```

::: tip
`--depth 1` 只克隆最新版本，节省时间和磁盘空间。
:::

## 第三步：拉取 Docker 镜像

```bash
cd flow
docker pull openroad/orfs:latest
```

镜像约 1.5 GB，包含编译好的 Yosys、OpenROAD 和 KLayout。

## 第四步：验证环境

运行 GCD 设计的完整流程：

```bash
cd ~/OpenROAD-flow-scripts/flow
util/docker_shell make DESIGN_CONFIG=designs/nangate45/gcd/config.mk
```

::: warning
首次运行需要几分钟。如果看到类似以下输出，说明成功：
```
6_1_merge   ...  1  425
6_report    ...  1  233
Total              24  1014
```
:::

## 第五步：查看结果

```bash
ls results/nangate45/gcd/base/
```

你应该看到以下关键文件：

| 文件 | 说明 |
|------|------|
| `6_final.gds` | GDSII 版图文件 |
| `6_final.def` | DEF 物理设计文件 |
| `6_final.v` | 后布线 Verilog 网表 |
| `6_final.spef` | 寄生参数提取文件 |
| `6_final.sdc` | 时序约束文件 |

## 目录结构说明

```
OpenROAD-flow-scripts/flow/
├── designs/              # 设计文件
│   ├── src/gcd/          # RTL 源代码
│   └── nangate45/gcd/    # 设计配置 + 约束
├── platforms/nangate45/  # 工艺库文件
├── scripts/              # 流程脚本
├── util/                 # 工具脚本 (docker_shell 等)
├── results/              # 运行结果
├── reports/              # 时序/面积/功耗报告
├── logs/                 # 运行日志
└── objects/              # 中间文件
```

## 常见问题

### Docker 权限问题

```bash
# 如果报 permission denied
sudo usermod -aG docker $USER
# 然后重新登录
```

### 磁盘空间不足

```bash
# 清理旧的 Docker 镜像
docker system prune
```

### 网络问题导致拉取失败

```bash
# 使用国内镜像（以阿里云为例）
# 编辑 /etc/docker/daemon.json 添加镜像源
```
