'use strict';

const now = new Date().toISOString();
const dayAgo = new Date(Date.now() - 86400000).toISOString();
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
const threeDaysAgo = new Date(Date.now() - 259200000).toISOString();
const weekAgo = new Date(Date.now() - 604800000).toISOString();

const articles = [
  {
    id: 'art-1',
    url: 'https://www.bbc.com/news/world-example-1',
    outlet: 'BBC News',
    title: 'Global Climate Summit Reaches Historic Agreement on Carbon Emissions',
    publishedAt: dayAgo,
    sourceType: 'wire',
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
    sourceType: 'wire',
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
    sourceType: 'opinion',
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
    sourceType: 'wire',
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
    sourceType: 'primary',
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
    sourceType: 'primary',
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
    sourceType: 'primary',
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
    sourceType: 'wire',
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
    sourceType: 'wire',
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
    sourceType: 'wire',
    snippet: 'A Falcon Heavy rocket has successfully delivered the first module of the Lunar Gateway space station into a near-rectilinear halo orbit around the Moon.',
    imageUrl: 'https://picsum.photos/seed/spacex-lunar/800/450',
    outletCount: 93,
  },
];

const citations = [
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
];

const streamedAnswer =
  'Based on the articles I have analyzed, this story is being covered from multiple angles. ' +
  'The BBC and Reuters focus on the economic implications, while Al Jazeera emphasizes the ' +
  'humanitarian dimension. Key points of agreement across outlets include the timeline and ' +
  'basic facts. However, there are notable differences in framing — Western outlets tend to ' +
  'highlight diplomatic progress, while regional outlets raise concerns about implementation. ' +
  'I would recommend cross-referencing these sources with primary government documents.';

const comparison = {
  event: 'Global Climate Summit Agreement',
  outlets: [
    {
      outlet: 'BBC News',
      headline: 'Historic climate deal reached after marathon negotiations',
      keyClaims: ['Net-zero by 2045', 'Binding commitments from 195 nations', '$100B annual fund'],
      framingNotes: 'Optimistic framing, focuses on diplomatic achievement',
      omissions: ['Enforcement mechanisms not mentioned', 'China dissent glossed over'],
      citations: [citations[0]],
    },
    {
      outlet: 'Al Jazeera',
      headline: 'Developing nations express caution over Geneva climate commitments',
      keyClaims: ['Financial support lacks guarantees', 'Historical emissions ignored', 'Loss & damage underfunded'],
      framingNotes: 'Critical framing, centres Global South concerns',
      omissions: ['Private sector investment ignored'],
      citations: [citations[0]],
    },
  ],
  agreements: [
    'Agreement signed by 195 delegations in Geneva',
    'Net-zero emission target date set to 2045',
    'Annual review summit established',
  ],
  disagreements: [
    'Whether financial assistance to developing countries is legally binding',
    'Interpretation of emissions baseline dates',
  ],
  singleSourceFlags: [
    'Details about the private consultation were reported only by Reuters',
  ],
};

const timeline = {
  story: 'Geneva Climate Summit Negotiations',
  events: [
    {
      date: '2026-10-25',
      description: 'Opening plenary begins with addresses by 40 heads of state.',
      citations: [citations[0]],
    },
    {
      date: '2026-10-27',
      description: 'Draft text leaked showing major disagreements over transition fund timelines.',
      citations: [citations[0]],
    },
    {
      date: '2026-10-29',
      description: 'All-night compromise talks yield preliminary consensus on emissions cuts.',
      citations: [citations[1]],
    },
    {
      date: '2026-10-31',
      description: 'Final accord signed by 195 nations after extended session.',
      citations: [citations[0]],
    },
  ],
  gaps: [
    'No independent verification of bilateral side agreements reached on day 4',
  ],
};

const verifyResult = {
  claim: 'Net-zero emissions by 2045 is legally binding under international law.',
  factcheckHits: [
    {
      title: 'Fact Check: Are Geneva summit commitments legally enforceable?',
      url: 'https://factcheck.afp.com/example',
      rating: 'Misleading',
    },
  ],
  checklist: [
    'Who reported the binding status first? (Check original UN press release text)',
    'Original treaty wording: look for "shall" vs "should" in Article 4',
    'Date of publication: ensure reports reference treaty draft v4, not v2',
    'Reverse-search quote from US chief negotiator',
  ],
  relatedSources: citations,
  verdict: 'unverified',
};

const cases = [
  {
    id: 'case-1',
    title: 'Electoral Bond Funding Transparency',
    topic: 'Governance & Campaign Finance',
    createdAt: weekAgo,
    ownerId: 'user-1',
    pinnedArticles: [articles[4], articles[6]],
    claims: [
      {
        id: 'claim-1',
        text: 'Anonymous electoral bonds violated the right to information under Article 19(1)(a).',
        status: 'verified',
        supportingArticleIds: ['art-5'],
      },
      {
        id: 'claim-2',
        text: 'State Bank of India requested a 3-month extension to decode donor bond serials.',
        status: 'verified',
        supportingArticleIds: ['art-5'],
      },
      {
        id: 'claim-3',
        text: 'A shell company in Mauritius purchased over $50M in bonds in a single transaction.',
        status: 'unverified',
        supportingArticleIds: [],
      },
    ],
    sourceLog: [
      {
        url: 'https://www.ndtv.com/india-news/example-5',
        outlet: 'NDTV',
        accessDate: now,
        whatItSupports: 'Supreme Court ruling and donor disclosure mandate',
        investigationId: 'case-1',
      },
      {
        url: 'https://www.thehindu.com/news/example-7',
        outlet: 'The Hindu',
        accessDate: dayAgo,
        whatItSupports: 'Legal history and petition timeline',
        investigationId: 'case-1',
      },
    ],
  },
];

module.exports = {
  articles,
  citations,
  streamedAnswer,
  comparison,
  timeline,
  verifyResult,
  cases,
};
