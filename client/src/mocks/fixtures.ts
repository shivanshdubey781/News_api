import type { Article, Case, Citation, Comparison, Timeline, VerifyResult } from '../api/types';

const now = new Date().toISOString();
const dayAgo = new Date(Date.now() - 86400000).toISOString();
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
const threeDaysAgo = new Date(Date.now() - 259200000).toISOString();
const weekAgo = new Date(Date.now() - 604800000).toISOString();

export const fixtures = {
  articles: [
    {
      id: 'art-1',
      url: 'https://www.bbc.com/news/world-example-1',
      outlet: 'BBC News',
      title: 'Global Climate Summit Reaches Historic Agreement on Carbon Emissions',
      publishedAt: dayAgo,
      sourceType: 'wire' as const,
      snippet: 'World leaders gathered in Geneva have signed a landmark accord pledging net-zero emissions by 2045, marking the most ambitious climate deal in history.',
      imageUrl: 'https://picsum.photos/seed/climate/800/450',
      outletCount: 47,
    },
    {
      id: 'art-2',
      url: 'https://reuters.com/world/example-2',
      outlet: 'Reuters',
      title: 'India GDP Growth Accelerates to 8.4% in Q3, Beats Forecasts',
      publishedAt: dayAgo,
      sourceType: 'wire' as const,
      snippet: "India's economy expanded at a faster-than-expected pace in the third quarter, driven by strong manufacturing output and a surge in domestic consumption.",
      imageUrl: 'https://picsum.photos/seed/india-gdp/800/450',
      outletCount: 23,
    },
    {
      id: 'art-3',
      url: 'https://www.theguardian.com/world/example-3',
      outlet: 'The Guardian',
      title: 'Tech Giants Face New EU Regulations on AI Transparency Requirements',
      publishedAt: twoDaysAgo,
      sourceType: 'opinion' as const,
      snippet: 'The European Union has unveiled sweeping new rules requiring technology companies to disclose how their artificial intelligence systems make decisions.',
      imageUrl: 'https://picsum.photos/seed/eu-ai/800/450',
      outletCount: 31,
    },
    {
      id: 'art-4',
      url: 'https://www.aljazeera.com/news/example-4',
      outlet: 'Al Jazeera',
      title: 'Ceasefire Agreement Holds in Eastern Mediterranean as Diplomats Convene',
      publishedAt: twoDaysAgo,
      sourceType: 'wire' as const,
      snippet: 'A fragile ceasefire brokered by international mediators appears to be holding in the region, with all parties agreeing to resume peace talks next week.',
      imageUrl: 'https://picsum.photos/seed/ceasefire/800/450',
      outletCount: 58,
    },
    {
      id: 'art-5',
      url: 'https://www.ndtv.com/india-news/example-5',
      outlet: 'NDTV',
      title: 'Supreme Court Issues Landmark Ruling on Electoral Bond Transparency',
      publishedAt: threeDaysAgo,
      sourceType: 'primary' as const,
      snippet: "India's apex court has ordered full disclosure of electoral bond donors, calling the anonymous funding scheme unconstitutional in a split 4-1 decision.",
      imageUrl: 'https://picsum.photos/seed/sc-ruling/800/450',
      outletCount: 89,
    },
    {
      id: 'art-6',
      url: 'https://timesofindia.indiatimes.com/india/example-6',
      outlet: 'Times of India',
      title: 'Mumbai Infrastructure Project Faces Delays Amid Environmental Concerns',
      publishedAt: threeDaysAgo,
      sourceType: 'primary' as const,
      snippet: "The coastal road project connecting Mumbai's Bandra to Versova has been stalled again following fresh objections from marine biologists over mangrove damage.",
      imageUrl: 'https://picsum.photos/seed/mumbai-infra/800/450',
      outletCount: 12,
    },
    {
      id: 'art-7',
      url: 'https://www.thehindu.com/news/example-7',
      outlet: 'The Hindu',
      title: 'Karnataka Water Dispute Escalates as Cauvery Authority Meets',
      publishedAt: weekAgo,
      sourceType: 'primary' as const,
      snippet: 'The Cauvery Water Management Authority convened an emergency session to address the ongoing inter-state water sharing dispute between Karnataka and Tamil Nadu.',
      imageUrl: 'https://picsum.photos/seed/cauvery/800/450',
      outletCount: 34,
    },
    {
      id: 'art-8',
      url: 'https://apnews.com/article/example-8',
      outlet: 'AP News',
      title: 'Federal Reserve Signals Pause in Rate Hike Cycle Amid Cooling Inflation',
      publishedAt: weekAgo,
      sourceType: 'wire' as const,
      snippet: 'US central bank officials indicated they may hold interest rates steady at the next meeting as inflation approaches the 2% target for the first time since 2021.',
      imageUrl: 'https://picsum.photos/seed/fed-rate/800/450',
      outletCount: 67,
    },
    {
      id: 'art-9',
      url: 'https://www.afp.com/en/news/example-9',
      outlet: 'AFP',
      title: 'French Government Survives No-Confidence Vote Amid Pension Reform Protests',
      publishedAt: weekAgo,
      sourceType: 'wire' as const,
      snippet: "Prime Minister's coalition government narrowly survived a parliamentary no-confidence motion as millions take to the streets over controversial pension changes.",
      imageUrl: 'https://picsum.photos/seed/france-protests/800/450',
      outletCount: 41,
    },
    {
      id: 'art-10',
      url: 'https://edition.cnn.com/world/example-10',
      outlet: 'CNN',
      title: 'SpaceX Successfully Launches Mission to Build Lunar Gateway Station',
      publishedAt: now,
      sourceType: 'wire' as const,
      snippet: 'A Falcon Heavy rocket has successfully delivered the first module of the Lunar Gateway space station into a near-rectilinear halo orbit around the Moon.',
      imageUrl: 'https://picsum.photos/seed/spacex-lunar/800/450',
      outletCount: 93,
    },
  ] as Article[],

  citations: [
    {
      url: 'https://www.bbc.com/news/world-example-1',
      outlet: 'BBC News',
      publishedAt: dayAgo,
      quoteSnippet: 'World leaders signed the landmark accord pledging net-zero emissions.',
    },
    {
      url: 'https://reuters.com/world/example-2',
      outlet: 'Reuters',
      publishedAt: dayAgo,
      quoteSnippet: "India's economy expanded at 8.4% in Q3, beating analyst forecasts.",
    },
    {
      url: 'https://apnews.com/article/example-8',
      outlet: 'AP News',
      publishedAt: weekAgo,
      quoteSnippet: 'Federal Reserve signals a pause in rate hike cycle.',
    },
  ] as Citation[],

  streamedAnswer:
    'Based on the articles I have analyzed, this story is being covered from multiple angles. ' +
    'The BBC and Reuters focus on the economic implications, while Al Jazeera emphasizes the ' +
    'humanitarian dimension. Key points of agreement across outlets include the timeline and ' +
    'basic facts. However, there are notable differences in framing — Western outlets tend to ' +
    'highlight diplomatic progress, while regional outlets raise concerns about implementation. ' +
    'I would recommend cross-referencing these sources with primary government documents.',

  comparison: {
    event: 'Global Climate Summit Agreement',
    outlets: [
      {
        outlet: 'BBC News',
        headline: 'Historic climate deal reached after marathon negotiations',
        keyClaims: ['Net-zero by 2045', 'Binding commitments from 195 nations', '$100B annual fund'],
        framingNotes: 'Optimistic framing, focuses on diplomatic achievement',
        omissions: ['Enforcement mechanisms not mentioned', 'China dissent glossed over'],
        citations: [
          {
            url: 'https://bbc.com/climate',
            outlet: 'BBC News',
            publishedAt: dayAgo,
            quoteSnippet: 'A historic climate deal has been reached.',
          },
        ],
      },
      {
        outlet: 'Al Jazeera',
        headline: 'Climate summit deal: developing nations call it insufficient',
        keyClaims: ['Wealthier nations resist stronger targets', 'Finance pledges vague', 'G77 dissatisfied'],
        framingNotes: 'Critical of wealthy nations, amplifies Global South perspective',
        omissions: ['Positive aspects of binding commitments underplayed'],
        citations: [
          {
            url: 'https://aljazeera.com/climate',
            outlet: 'Al Jazeera',
            publishedAt: dayAgo,
            quoteSnippet: 'Developing nations call the deal insufficient.',
          },
        ],
      },
    ],
    agreements: ['Net-zero target of 2045', 'Universal participation claimed'],
    disagreements: ['Adequacy of finance pledges', 'Enforcement strength', 'Developing nation satisfaction'],
    singleSourceFlags: ['China walk-out rumor (only in one tabloid)'],
  } as Comparison,

  timeline: {
    story: 'India Electoral Bond Controversy',
    events: [
      {
        date: '2018-01-02',
        description: 'Electoral Bond Scheme introduced by Finance Ministry via Finance Bill.',
        citations: [{ url: 'https://thehindu.com/1', outlet: 'The Hindu', publishedAt: '2018-01-02', quoteSnippet: 'Scheme introduced.' }],
      },
      {
        date: '2019-03-15',
        description: 'First batch of electoral bonds purchased; identities of buyers kept secret.',
        citations: [{ url: 'https://ndtv.com/2', outlet: 'NDTV', publishedAt: '2019-03-15', quoteSnippet: 'Bonds purchased anonymously.' }],
      },
      {
        date: '2022-11-10',
        description: 'Supreme Court admits petition challenging constitutional validity.',
        citations: [{ url: 'https://thehindu.com/3', outlet: 'The Hindu', publishedAt: '2022-11-10', quoteSnippet: 'Petition admitted.' }],
      },
      {
        date: '2024-02-15',
        description: 'Constitution Bench begins final hearing over five days.',
        citations: [{ url: 'https://ndtv.com/4', outlet: 'NDTV', publishedAt: '2024-02-15', quoteSnippet: 'Bench begins hearing.' }],
      },
      {
        date: '2024-03-01',
        description: 'Supreme Court unanimously strikes down Electoral Bond Scheme as unconstitutional.',
        citations: [{ url: 'https://ndtv.com/5', outlet: 'NDTV', publishedAt: '2024-03-01', quoteSnippet: 'Scheme struck down.' }],
      },
    ],
    gaps: ['Full disclosure of bond amounts still awaited', 'SBI compliance timeline unclear'],
  } as Timeline,

  verifyResult: {
    claim: 'India GDP grew at 8.4% in Q3',
    factcheckHits: [
      { title: 'India GDP Q3 Data: NSO releases official figures', url: 'https://reuters.com/verify', rating: 'True' },
    ],
    checklist: [
      'Check NSO official press release',
      'Cross-reference with IMF World Economic Outlook',
      'Verify base year used for calculation',
      'Compare with RBI estimates',
    ],
    relatedSources: [
      { url: 'https://reuters.com/economy', outlet: 'Reuters', publishedAt: dayAgo, quoteSnippet: '8.4% Q3 growth confirmed by NSO.' },
    ],
    verdict: 'verified' as const,
  } as VerifyResult,

  cases: [
    {
      id: 'case-1',
      title: 'Electoral Bond Investigation',
      topic: 'Politics',
      createdAt: weekAgo,
      ownerId: 'user-1',
      pinnedArticles: [],
      claims: [
        { id: 'cl-1', text: 'Electoral bonds were used to circumvent disclosure rules', status: 'verified', supportingArticleIds: ['art-5'] },
        { id: 'cl-2', text: 'Ruling party received 90% of all bonds sold', status: 'disputed', supportingArticleIds: ['art-5', 'art-7'] },
        { id: 'cl-3', text: 'Foreign entities purchased bonds through shell companies', status: 'unverified', supportingArticleIds: [] },
      ],
      sourceLog: [
        { url: 'https://ndtv.com/bonds', outlet: 'NDTV', accessDate: weekAgo, whatItSupports: 'Verifies SC ruling details', investigationId: 'case-1' },
        { url: 'https://thehindu.com/bonds', outlet: 'The Hindu', accessDate: weekAgo, whatItSupports: 'Historical timeline of scheme', investigationId: 'case-1' },
      ],
    },
  ] as Case[],
};
