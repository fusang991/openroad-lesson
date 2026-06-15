import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'OpenROAD 实战教程',
  description: '从 RTL 到 GDSII 的完整物理设计流程',

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '教程', link: '/guide/overview' },
      { text: 'OpenROAD', link: 'https://github.com/The-OpenROAD-Project/OpenROAD-flow-scripts' }
    ],

    sidebar: [
      {
        text: '入门',
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
        text: '进阶',
        items: [
          { text: '关键指标解读', link: '/guide/metrics' },
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
