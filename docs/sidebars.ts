import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Backend',
      items: [
        'backend/database',
        'backend/models',
        'backend/authentication',
        'backend/api',
      ],
    },
    {
      type: 'category',
      label: 'Frontend',
      items: [
        'frontend/architecture',
        'frontend/state-management',
        'frontend/components',
        'frontend/realtime',
      ],
    },
    {
      type: 'category',
      label: 'Infrastructure',
      items: [
        'infrastructure/deployment',
        'infrastructure/monitoring',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development/setup',
        'development/workflow',
        'development/testing',
      ],
    },
  ],
};

export default sidebars;
