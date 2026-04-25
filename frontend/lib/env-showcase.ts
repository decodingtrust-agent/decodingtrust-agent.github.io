export type WallShot = {
  name: string
  domain: string
  src: string
}

export const wallShots: WallShot[] = [
  // ---------- Workflow / Productivity ----------
  { name: "Gmail", domain: "Workflow", src: "/env-showcase/gmail-1.png" },
  { name: "Google Calendar", domain: "Workflow", src: "/env-showcase/calendar-2.png" },
  { name: "Google Docs", domain: "Workflow", src: "/env-showcase/googledoc-1.png" },
  { name: "Google Docs Editor", domain: "Workflow", src: "/env-showcase/googledoc-2.png" },
  { name: "Google Sheets", domain: "Workflow", src: "/env-showcase/googlesheets-2.png" },
  { name: "Google Drive", domain: "Workflow", src: "/env-showcase/googledrive-1.png" },
  { name: "Google Form", domain: "Workflow", src: "/env-showcase/googleform-1.png" },
  { name: "Notion", domain: "Workflow", src: "/env-showcase/notion-1.png" },
  { name: "Notion Workspace", domain: "Workflow", src: "/env-showcase/notion-2.png" },
  { name: "Dropbox", domain: "Workflow", src: "/env-showcase/dropbox-1.png" },
  { name: "Dropbox Files", domain: "Workflow", src: "/env-showcase/dropbox-2.png" },

  // ---------- Messaging / Collaboration ----------
  { name: "Slack", domain: "Workflow", src: "/env-showcase/slack-1.png" },
  { name: "Zoom", domain: "Workflow", src: "/env-showcase/zoom-2.png" },
  { name: "Atlassian Jira", domain: "Workflow", src: "/env-showcase/atlassian-4.png" },
  { name: "WhatsApp", domain: "Workflow", src: "/env-showcase/whatsapp-1.png" },
  { name: "WhatsApp Chats", domain: "Workflow", src: "/env-showcase/whatsapp-2.png" },

  // ---------- Social ----------
  { name: "X (Twitter)", domain: "Social", src: "/env-showcase/X-1.png" },
  { name: "X Feed", domain: "Social", src: "/env-showcase/X-2.png" },
  { name: "LinkedIn", domain: "Social", src: "/env-showcase/linkedin-1.png" },
  { name: "LinkedIn Profile", domain: "Social", src: "/env-showcase/linkedin-2.png" },
  { name: "Reddit", domain: "Social", src: "/env-showcase/reddit-1.png" },
  { name: "Reddit Thread", domain: "Social", src: "/env-showcase/reddit-3.png" },

  // ---------- Code ----------
  { name: "GitHub", domain: "Code", src: "/env-showcase/github-1.png" },
  { name: "GitLab", domain: "Code", src: "/env-showcase/gitlab-1.png" },
  { name: "GitLab Pipeline", domain: "Code", src: "/env-showcase/gitlab-2.png" },

  // ---------- Payments / Finance ----------
  { name: "PayPal", domain: "Workflow", src: "/env-showcase/paypal-1.png" },
  { name: "Trade Desk", domain: "Finance", src: "/env-showcase/ui_trade.png" },
  { name: "Portfolio", domain: "Finance", src: "/env-showcase/ui_portfolio.png" },
  { name: "Markets", domain: "Finance", src: "/env-showcase/ui_markets.png" },
  { name: "News Feed", domain: "Finance", src: "/env-showcase/ui_news.png" },
  { name: "Stock Quote", domain: "Finance", src: "/env-showcase/ui_stock_quote.png" },
  { name: "Options", domain: "Finance", src: "/env-showcase/ui_options.png" },
  { name: "Analysis", domain: "Finance", src: "/env-showcase/ui_analysis.png" },
  { name: "Chart", domain: "Finance", src: "/env-showcase/ui_chart.png" },
  { name: "Chase Banking", domain: "Finance", src: "/env-showcase/chase-1.png" },
  { name: "Chase Transfer", domain: "Finance", src: "/env-showcase/chase-2.png" },
  { name: "Robinhood", domain: "Finance", src: "/env-showcase/robin-1.png" },
  { name: "Robinhood Trade", domain: "Finance", src: "/env-showcase/robin-2.png" },

  // ---------- CRM ----------
  { name: "CRM Leads", domain: "CRM", src: "/env-showcase/leads_page.png" },
  { name: "Create Lead", domain: "CRM", src: "/env-showcase/create_page.png" },

  // ---------- Customer Service ----------
  { name: "Case Details", domain: "Customer Service", src: "/env-showcase/ui_case_details.png" },
  { name: "Case Queue", domain: "Customer Service", src: "/env-showcase/ui_case_list.png" },
  { name: "Cases Dashboard", domain: "Customer Service", src: "/env-showcase/ui_cases.png" },
  { name: "ServiceNow", domain: "Customer Service", src: "/env-showcase/servicenow-store-credit-ff-attack.png" },

  // ---------- Browser / E-commerce ----------
  { name: "E-commerce Home", domain: "Browser", src: "/env-showcase/ecommerce-home.png" },
  { name: "Review Page", domain: "Browser", src: "/env-showcase/ecommerce-review.png" },
  { name: "Account Center", domain: "Browser", src: "/env-showcase/ecommerce-account.png" },

  // ---------- Travel ----------
  { name: "Booking", domain: "Travel", src: "/env-showcase/booking-main.png" },
  { name: "Booking Hotel", domain: "Travel", src: "/env-showcase/booking-hotel.png" },
  { name: "Expedia Search", domain: "Travel", src: "/env-showcase/expedia-search.png" },
  { name: "Expedia Results", domain: "Travel", src: "/env-showcase/expedia-results.png" },
  { name: "United Airlines", domain: "Travel", src: "/env-showcase/united-main.png" },
  { name: "United Results", domain: "Travel", src: "/env-showcase/united-results.png" },
  { name: "Southwest Search", domain: "Travel", src: "/env-showcase/southwest-search.png" },
  { name: "Southwest Results", domain: "Travel", src: "/env-showcase/southwest-results.png" },
  { name: "Enterprise Rental", domain: "Travel", src: "/env-showcase/enterprise-search.png" },
  { name: "Enterprise Results", domain: "Travel", src: "/env-showcase/enterprise-results.png" },

  // ---------- Logistics / Delivery ----------
  { name: "FedEx Shipping", domain: "Logistics", src: "/env-showcase/fedex-ui1.png" },
  { name: "FedEx Tracking", domain: "Logistics", src: "/env-showcase/fedex-ui2.png" },
  { name: "DoorDash", domain: "Logistics", src: "/env-showcase/doordash-main.png" },
  { name: "DoorDash Results", domain: "Logistics", src: "/env-showcase/doordash-results.png" },

  // ---------- Desktop OS ----------
  { name: "Windows Desktop", domain: "Desktop OS", src: "/env-showcase/windows-screenshot.png" },
  { name: "macOS Desktop", domain: "Desktop OS", src: "/env-showcase/macos_screenshot.png" },
  { name: "VM Desktop", domain: "Desktop OS", src: "/env-showcase/vm_desktop.png" },

  // ---------- Research ----------
  { name: "arXiv", domain: "Research", src: "/env-showcase/arxiv_DT.png" },
]
