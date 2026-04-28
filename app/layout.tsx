import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '北京有厚米科技有限公司 - 官方网站',
  description:
    '有厚米创意记事与多维度信息管理平台 — YoHomie 心情记录与自我认知辅助工具。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  )
}
