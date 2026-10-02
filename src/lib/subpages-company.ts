import type { SubPage } from './subpages'
import { TOTAL_CATALOGUED, PUBLISHED_COUNT } from 'virtual:catalogue-summary'

export const COMPANY_PAGES: Record<string, SubPage> = {

  '/about': {
    area: 'Company',
    title: 'About Connector OS',
    tagline: 'The governed execution layer between AI agents and real systems.',
    sections: [
      {
        h: 'What we are building',
        p: ['Connector OS is infrastructure for the agent era: a control plane that lets AI agents act on real business systems — with policy, human approval, controlled execution and verifiable evidence for every action.', 'Agents are getting capable enough to do consequential work. The missing piece is not more capability — it is governance: knowing what an agent may do, watching what it did, and proving it afterwards. That is the layer we build.'],
      },
      {
        h: 'Principles',
        ul: ['Reasoning and execution are separated — agents never hold credentials or call providers directly', 'Failures are explicit states, never hidden', 'Evidence comes from execution, not from agent narration', 'Claims match reality — in our product and on this website'],
      },
      {
        h: 'Status',
        p: [
          `Connector OS is pre-launch. The canonical connector catalogue holds ${TOTAL_CATALOGUED} records, of which ${PUBLISHED_COUNT} are published; platform availability follows the staged release path.`,
          'The system is integrated and proven end-to-end against simulated providers — hermetically proven, not yet verified with real providers.',
          'Real-provider staging of the golden-five connectors is the next major gate; the full 30-item capability table is public on the Build status page.',
        ],
      },
    ],
  },

  '/contact': {
    area: 'Company',
    title: 'Contact',
    tagline: 'Talk to the team — sales, support, security and partnership enquiries.',
    sections: [
      {
        h: 'Sales and enterprise',
        p: ['For deployment models, custom agreements, connector prioritization and dedicated support, see the enterprise contact page — it routes to the right conversation.'],
      },
      {
        h: 'Product and technical questions',
        p: ['For questions about connectors, the execution model, policies or receipts, start with the developer portal — it documents the current public surface honestly, including what is still pending.'],
      },
      {
        h: 'Security enquiries',
        p: ['For security questions or responsible disclosure, contact the team directly. We do not publish invented response-time commitments; we do take security reports seriously and route them to the people who own the systems.'],
      },
    ],
  },

  '/privacy': {
    area: 'Legal',
    title: 'Privacy policy',
    tagline: 'Draft pending founder and legal review.',
    sections: [
      {
        h: 'Status of this page',
        p: ['This privacy policy is pending founder and legal review before publication. Rather than publish invented legal commitments, this page states what we can say factually today.'],
        note: 'Legal copy on this page is a placeholder marked for founder/legal review. It does not constitute legal terms.',
      },
      {
        h: 'What the product is designed to do',
        ul: ['Provider credentials are stored scoped per connection and tenant, and are never exposed to agents', 'Secrets and sensitive values are redacted from logs, execution facts and receipts', 'Connections are revocable by the customer at any time; revocation takes effect at the next dispatch check'],
      },
      {
        h: 'What we do not claim',
        p: ['Until the reviewed policy is published, this website makes no commitments about data retention periods, subprocessors, training-data usage or regulatory frameworks. Any such commitment will appear here only after legal review.'],
      },
    ],
  },

  '/terms': {
    area: 'Legal',
    title: 'Terms of service',
    tagline: 'Draft pending founder and legal review.',
    sections: [
      {
        h: 'Status of this page',
        p: ['Terms of service are pending founder and legal review before publication. We do not publish placeholder legal language dressed up as enforceable terms.'],
        note: 'Legal copy on this page is a placeholder marked for founder/legal review. It does not constitute legal terms.',
      },
      {
        h: 'What exists today',
        p: ['The platform is in pre-launch. Commercial terms — including plan pricing and enterprise agreements — are announced at launch or agreed directly with customers.'],
      },
      {
        h: 'In the meantime',
        p: ['Questions about usage, evaluation or enterprise terms can be raised through the contact page.'],
      },
    ],
  },
}
