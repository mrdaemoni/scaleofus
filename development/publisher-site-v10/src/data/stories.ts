export const stories = [
  {
    slug: 'the-boy-who-tried-to-catch-the-wind', number: '01', subject: 'Wind',
    title: 'The Boy Who Tried to Catch the Wind', status: 'available',
    intro: 'A story about a boy, a machine, and the part of us no answer can hold.',
    color: 'blue', image: '/edition/cover.webp',
    formats: ['Printed edition', 'Online reading', 'Immersive reading']
  },
  {
    slug: 'the-boy-who-tried-to-count-love', number: '02', subject: 'Love',
    title: 'The Boy Who Tried to Count Love', status: 'forthcoming',
    intro: 'The second Scale of Us story.',
    color: 'rose', image: null,
    formats: ['Print planned', 'Online reading planned', 'Immersive reading planned']
  },
  {
    slug: 'the-boy-who-tried-to-fix-the-stars', number: '03', subject: 'Stars',
    title: 'The Boy Who Tried to Fix the Stars', status: 'forthcoming',
    intro: 'The third Scale of Us story.',
    color: 'night', image: null,
    formats: ['Print planned', 'Online reading planned', 'Immersive reading planned']
  }
] as const;
export const windSlug = stories[0].slug;
export const linkedInPost = 'https://www.linkedin.com/feed/update/urn:li:activity:7495532613634396160/';
