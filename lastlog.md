ercure-fe/dashboard on  authentik via 🐳 lima-docker via 🥟 v1.3.7 took 3s
➜ bun run dev:dashboard
$ turbo dev --filter=@vision_dashboard/dashboard
╭──────────────────────────────────────────────────────────────────────────╮
│                                                                          │
│                     Update available v2.5.6 ≫ v2.8.3                     │
│    Changelog: https://github.com/vercel/turborepo/releases/tag/v2.8.3    │
│            Run "bunx @turbo/codemod@latest update" to update             │
│                                                                          │
│          Follow @turborepo for updates: https://x.com/turborepo          │
╰──────────────────────────────────────────────────────────────────────────╯
turbo 2.5.6

• Packages in scope: @vision_dashboard/dashboard
• Running dev in 1 packages
• Remote caching disabled
@vision_dashboard/dashboard:dev: cache bypass, force executing 76aa291a5f5189de
@vision_dashboard/dashboard:dev: $ TZ=UTC next dev -p 3000 --turbopack
@vision_dashboard/dashboard:dev:    ▲ Next.js 15.5.2 (Turbopack)
@vision_dashboard/dashboard:dev:    - Local:        http://localhost:3000
@vision_dashboard/dashboard:dev:    - Network:      http://192.168.0.195:3000
@vision_dashboard/dashboard:dev:    - Environments: .env
@vision_dashboard/dashboard:dev:
@vision_dashboard/dashboard:dev:  ✓ Starting...
@vision_dashboard/dashboard:dev:  ○ Compiling middleware ...
@vision_dashboard/dashboard:dev:  ✓ Compiled middleware in 691ms
@vision_dashboard/dashboard:dev:  ✓ Ready in 3s
@vision_dashboard/dashboard:dev: [Middleware] Path: /
@vision_dashboard/dashboard:dev: [Middleware] Redirecting root to: http://localhost:3000/id
@vision_dashboard/dashboard:dev: [Middleware] Path: /id
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /id
@vision_dashboard/dashboard:dev:  ○ Compiling /[locale] ...
@vision_dashboard/dashboard:dev:  ✓ Compiled /[locale] in 17.5s
@vision_dashboard/dashboard:dev:  GET /id 200 in 20285ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/auth/session
@vision_dashboard/dashboard:dev: [Middleware] Allowing NextAuth route: /api/auth/session
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev:  ○ Compiling /api/auth/[...nextauth] ...
@vision_dashboard/dashboard:dev:  GET /api/v1/detections/stats 404 in 1997ms
@vision_dashboard/dashboard:dev:  GET /api/v1/cameras?limit=50 404 in 2000ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev:  GET /api/v1/monitoring/cameras 404 in 1988ms
@vision_dashboard/dashboard:dev:  GET /api/v1/detections?page=1&page_size=10 404 in 2018ms
@vision_dashboard/dashboard:dev:  GET /api/v1/waste-targets/summary 404 in 1996ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev:  ✓ Compiled /api/auth/[...nextauth] in 2.2s
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/trends/31 404 in 1063ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/summary/30 404 in 1071ms
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/kpis?period_days=30 404 in 1057ms
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/daily-trends?period_days=30 404 in 1061ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/settings/currency
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/cameras
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/categories/30 404 in 1093ms
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/settings/currency
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections
@vision_dashboard/dashboard:dev:  GET /api/v1/detections/stats 404 in 1260ms
@vision_dashboard/dashboard:dev:  GET /api/v1/cameras?limit=50 404 in 1266ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev:  GET /api/v1/settings/currency 404 in 1292ms
@vision_dashboard/dashboard:dev:  GET /api/v1/monitoring/cameras 404 in 1278ms
@vision_dashboard/dashboard:dev:  GET /api/v1/detections?page=1&page_size=10 404 in 1278ms
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev:  GET /api/auth/session 200 in 4766ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev:  GET /api/v1/waste-targets/summary 404 in 810ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/summary/30 404 in 721ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/trends/31 404 in 731ms
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/kpis?period_days=30 404 in 719ms
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/daily-trends?period_days=30 404 in 722ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/categories/30 404 in 676ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/settings/currency
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/settings/currency
@vision_dashboard/dashboard:dev:  GET /api/v1/settings/currency 404 in 183ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections
@vision_dashboard/dashboard:dev:  GET /api/v1/detections/stats 404 in 551ms
@vision_dashboard/dashboard:dev:  GET /api/v1/detections?page=1&page_size=10 404 in 599ms
@vision_dashboard/dashboard:dev:  GET /api/v1/monitoring/cameras 404 in 609ms
@vision_dashboard/dashboard:dev:  GET /api/v1/cameras?limit=50 404 in 624ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev:  GET /api/v1/waste-targets/summary 404 in 811ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/summary/30 404 in 807ms
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/kpis?period_days=30 404 in 777ms
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/daily-trends?period_days=30 404 in 771ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/trends/31 404 in 793ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/categories/30 404 in 774ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/cameras
@vision_dashboard/dashboard:dev:  GET /api/v1/detections/stats 404 in 250ms
@vision_dashboard/dashboard:dev:  GET /api/v1/monitoring/cameras 404 in 479ms
@vision_dashboard/dashboard:dev:  GET /api/v1/detections?page=1&page_size=10 404 in 503ms
@vision_dashboard/dashboard:dev:  GET /api/v1/cameras?limit=50 404 in 478ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/kpis?period_days=30 404 in 1026ms
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/daily-trends?period_days=30 404 in 1028ms
@vision_dashboard/dashboard:dev:  GET /api/v1/waste-targets/summary 404 in 1034ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/categories/30 404 in 1028ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/trends/31 404 in 1032ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/summary/30 404 in 1045ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /executive
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /executive
@vision_dashboard/dashboard:dev:  GET /executive 200 in 268ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/auth/session
@vision_dashboard/dashboard:dev: [Middleware] Allowing NextAuth route: /api/auth/session
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/auth/session
@vision_dashboard/dashboard:dev: [Middleware] Allowing NextAuth route: /api/auth/session
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev:  GET /api/auth/session 200 in 1718ms
@vision_dashboard/dashboard:dev:  GET /api/auth/session 200 in 1721ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev:  GET /api/v1/cameras?limit=50 404 in 1835ms
@vision_dashboard/dashboard:dev:  GET /api/v1/detections/stats 404 in 1849ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev:  GET /api/v1/detections?page=1&page_size=10 404 in 1852ms
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev:  GET /api/v1/monitoring/cameras 404 in 1850ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev:  GET /api/v1/waste-targets/summary 404 in 1127ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/settings/currency
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/settings/currency
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/summary/30 404 in 1257ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/cameras
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/kpis?period_days=30 404 in 1208ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/trends/31 404 in 1238ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/daily-trends?period_days=30 404 in 1221ms
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/categories/30 404 in 1253ms
@vision_dashboard/dashboard:dev:  GET /api/v1/settings/currency 404 in 713ms
@vision_dashboard/dashboard:dev:  GET /api/v1/cameras?limit=50 404 in 692ms
@vision_dashboard/dashboard:dev:  GET /api/v1/detections/stats 404 in 616ms
@vision_dashboard/dashboard:dev:  GET /api/v1/monitoring/cameras 404 in 593ms
@vision_dashboard/dashboard:dev:  GET /api/v1/detections?page=1&page_size=10 404 in 614ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev:  GET /api/v1/waste-targets/summary 404 in 174ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/summary/30 404 in 394ms
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/kpis?period_days=30 404 in 604ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/trends/31 404 in 582ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/settings/currency
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/settings/currency
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/daily-trends?period_days=30 404 in 644ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/categories/30 404 in 612ms
@vision_dashboard/dashboard:dev:  GET /api/v1/settings/currency 404 in 139ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev:  GET /api/v1/detections?page=1&page_size=10 404 in 1074ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev:  GET /api/v1/cameras?limit=50 404 in 1098ms
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev:  GET /api/v1/monitoring/cameras 404 in 1097ms
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev:  GET /api/v1/detections/stats 404 in 1111ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev:  GET /api/v1/waste-targets/summary 404 in 1228ms
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/kpis?period_days=30 404 in 803ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/summary/30 404 in 838ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/trends/31 404 in 787ms
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/daily-trends?period_days=30 404 in 778ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/categories/30 404 in 768ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections/stats
@vision_dashboard/dashboard:dev:  GET /api/v1/detections?page=1&page_size=10 404 in 539ms
@vision_dashboard/dashboard:dev:  GET /api/v1/cameras?limit=50 404 in 530ms
@vision_dashboard/dashboard:dev:  GET /api/v1/monitoring/cameras 404 in 520ms
@vision_dashboard/dashboard:dev:  GET /api/v1/detections/stats 404 in 520ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev:  GET /api/v1/waste-targets/summary 404 in 140ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/kpis?period_days=30 404 in 593ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/summary/30 404 in 582ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/trends/31 404 in 581ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/categories/30 404 in 569ms
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/daily-trends?period_days=30 404 in 574ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /menu-management
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /menu-management
@vision_dashboard/dashboard:dev:  GET /menu-management 200 in 258ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/auth/session
@vision_dashboard/dashboard:dev: [Middleware] Allowing NextAuth route: /api/auth/session
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/auth/session
@vision_dashboard/dashboard:dev: [Middleware] Allowing NextAuth route: /api/auth/session
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev:  GET /api/auth/session 200 in 1489ms
@vision_dashboard/dashboard:dev:  GET /api/auth/session 200 in 1480ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev:  GET /api/v1/detections?page=1&page_size=10 404 in 1688ms
@vision_dashboard/dashboard:dev:  GET /api/v1/monitoring/cameras 404 in 1696ms
@vision_dashboard/dashboard:dev:  GET /api/v1/detections/stats 404 in 1717ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev:  GET /api/v1/cameras?limit=50 404 in 1954ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/summary/30 404 in 1799ms
@vision_dashboard/dashboard:dev:  GET /api/v1/waste-targets/summary 404 in 1885ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/settings/currency
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/settings/currency
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/daily-trends?period_days=30 404 in 1832ms
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/kpis?period_days=30 404 in 1836ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/trends/31 404 in 1915ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/cameras
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/categories/30 404 in 1811ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev:  GET /api/v1/detections?page=1&page_size=10 404 in 1066ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev:  GET /api/v1/settings/currency 404 in 1155ms
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev:  GET /api/v1/monitoring/cameras 404 in 961ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev:  GET /api/v1/detections/stats 404 in 978ms
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev:  GET /api/v1/cameras?limit=50 404 in 1002ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/summary/30 404 in 1013ms
@vision_dashboard/dashboard:dev:  GET /api/v1/waste-targets/summary 404 in 979ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/settings/currency
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/settings/currency
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/daily-trends?period_days=30 404 in 1041ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/trends/31 404 in 999ms
@vision_dashboard/dashboard:dev:  GET /api/v1/restaurant-performance/kpis?period_days=30 404 in 1019ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/categories/30 404 in 966ms
@vision_dashboard/dashboard:dev:  GET /api/v1/settings/currency 404 in 192ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/monitoring/cameras
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/detections/stats
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/cameras
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/cameras
@vision_dashboard/dashboard:dev:  GET /api/v1/detections?page=1&page_size=10 404 in 371ms
@vision_dashboard/dashboard:dev:  GET /api/v1/monitoring/cameras 404 in 452ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/summary/30
@vision_dashboard/dashboard:dev:  GET /api/v1/detections/stats 404 in 691ms
@vision_dashboard/dashboard:dev:  GET /api/v1/cameras?limit=50 404 in 683ms
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/waste-targets/summary
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Path: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/daily-trends
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/trends/31
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/restaurant-performance/kpis
@vision_dashboard/dashboard:dev: [Middleware] Token exists: true
@vision_dashboard/dashboard:dev: [Middleware] Authenticated, allowing: /api/v1/financial-analytics/categories/30
@vision_dashboard/dashboard:dev:  GET /api/v1/financial-analytics/summary/30 404 in 492ms
@vision_dashboard/dashboard:dev:  GET /api/v1/waste-targets/summary 404 in 824ms
@vision_dashboard/dashboard:dev:  GET /api/v1/financia
