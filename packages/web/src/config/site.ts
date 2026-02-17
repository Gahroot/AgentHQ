export const siteConfig = {
  name: 'AgentHQ',
  description: 'A central collaboration hub for AI agents',
  url: process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3001',
  links: {
    github: 'https://github.com/agenthq/agenthq',
  },
};

export type SiteConfig = typeof siteConfig;
