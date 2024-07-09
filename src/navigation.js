import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'What We Do',
      href: getPermalink('/about'),
    },
    {
      text: 'Team',
      href: getPermalink('/team/current'),
      links: [
        {
          text: 'Current Team',
          href: getPermalink('/team/current'),
        },
        {
          text: 'Alumni',
          href: getPermalink('/team/alumni'),
        },
      ],
    },
    {
      text: 'History',
      links: [
        {
          text: '2024 Competition',
          href: getPermalink('/years/2024'),
        },
        // {
        //   text: '2025 competition',
        //   href: getPermalink('/years/2025'),
        // },
      ],
    },
    {
      text: 'Contact Us',
      href: getPermalink('/contact'),
    },
  ],
};

export const footerData = {
  socialLinks: [
    { text: 'dbf@jhu.edu', ariaLabel: 'Email', icon: 'tabler:mail', href: 'mailto:dbf@jhu.edu' },
    {
      text: 'jhu_dbf',
      ariaLabel: 'Instagram',
      icon: 'tabler:brand-instagram',
      href: 'https://www.instagram.com/jhu_dbf/',
    },
    // { text: 'JHU-DBF', ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/JHU-DBF' },
  ],
};
