import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'OpenROAD 实战教程',
  description: '从 RTL 到 GDSII 的完整物理设计流程',

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '快速入门', link: '/guide/overview' },
      { text: '深入理解', link: '/deep/' },
      { text: 'OpenROAD', link: 'https://github.com/The-OpenROAD-Project/OpenROAD-flow-scripts' }
    ],

    sidebar: [
      {
        text: '快速入门',
        items: [
          { text: '概述', link: '/guide/overview' },
          { text: '环境搭建', link: '/guide/environment' }
        ]
      },
      {
        text: 'RTL 到 GDSII 全流程',
        items: [
          { text: '1. 逻辑综合', link: '/guide/01-synthesis' },
          { text: '2. 布局规划', link: '/guide/02-floorplan' },
          { text: '3. 电源网络', link: '/guide/03-pdn' },
          { text: '4. 布局', link: '/guide/04-placement' },
          { text: '5. 时钟树综合', link: '/guide/05-cts' },
          { text: '6. 布线', link: '/guide/06-routing' },
          { text: '7. 收尾与 GDSII', link: '/guide/07-finish' }
        ]
      },
      {
        text: '深入理解（VLSI Physical Design）',
        items: [
          { text: '系列介绍', link: '/deep/' },
          { text: 'Ch2 逻辑划分', link: '/deep/02-partitioning' },
          { text: 'Ch3 布局规划', link: '/deep/03-floorplanning' },
          { text: 'Ch4 布局算法', link: '/deep/04-placement' },
          { text: 'Ch5 全局布线', link: '/deep/05-global-routing' },
          { text: 'Ch6 详细布线', link: '/deep/06-detailed-routing' },
          { text: 'Ch7 时序收敛', link: '/deep/07-timing-closure' }
        ]
      },
      {
        text: '参考',
        items: [
          { text: '关键指标解读', link: '/guide/metrics' },
          { text: '完整代码与脚本', link: '/guide/code' },
          { text: '常见问题', link: '/guide/faq' }
        ]
      }
    ],

    outline: {
      label: '页面导航',
      level: [2, 3]
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    lastUpdated: {
      text: '最后更新'
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '未找到结果',
            resetButtonTitle: '清除查询',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        }
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/The-OpenROAD-Project/OpenROAD-flow-scripts' }
    ]
  }
})
