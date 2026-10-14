// BookLeaf policies from the technical assignment.
// Category keys match utils/ticketOptions.js so the AI service can select relevant policies.
export const knowledgeBase = {
  company: [
    "BookLeaf Publishing is a self-publishing company operating in India and the US.",
    "Packages: Standard Free has no upfront cost. Bestseller Breakthrough is a premium paid package with marketing and distribution add-ons.",
    "BookLeaf handles cover design, typesetting, ISBN assignment, printing, distribution, and royalty management.",
    "The in-house printing facility and warehouse are in Delhi. Print partners include Repro India and Epitome Books.",
  ],

  policies: {
    ROYALTY_PAYMENTS: [
      "Authors receive 80% of net profit per book; BookLeaf receives 20%.",
      "Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.",
      "Royalties are calculated quarterly and paid within 45 days of the quarter ending.",
      "The minimum payout threshold is INR 1,000. Amounts below this threshold roll over to the next quarter.",
      "Payouts are made by bank transfer to the account linked in the author's dashboard.",
      "Authors can view detailed royalty breakdowns and sales figures per platform in their dashboard.",
    ],

    ISBN_METADATA_ISSUES: [
      "Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf.",
      "ISBNs are registered under BookLeaf's publisher imprint. Authors wanting their own imprint must obtain an ISBN independently.",
      "ISBN errors, including duplicate ISBNs or the wrong book being linked, are high-priority issues and must be escalated to the production team.",
      "For an ISBN mismatch, acknowledge the seriousness, escalate immediately, and provide a 48-hour resolution timeline.",
    ],

    PRINTING_QUALITY: [
      "In-house printing handles most orders. Overflow or specific format requirements go to Repro India or Epitome Books.",
      "Standard print turnaround is 5-7 business days from order confirmation.",
      "Quality issues include misprints, binding defects, blurry images, misaligned pages, and color inconsistency.",
      "BookLeaf arranges a free reprint after verifying the defect. Ask the author for photos of defective copies when needed.",
      "For verified quality issues, communicate a reprint timeline of 5-7 business days.",
    ],

    DISTRIBUTION_AVAILABILITY: [
      "Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.",
      "New listings typically go live within 7-10 business days after publication is complete.",
      "An unavailable listing usually indicates a stock sync issue. BookLeaf's team can trigger a re-sync within 24-48 hours.",
      "For unavailable listings, coordinate with the distribution team and set an expectation of 24-48 hours for availability to return.",
    ],

    BOOK_STATUS_PRODUCTION_UPDATES: [
      "Production stages: Manuscript Received -> Editing (if opted) -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live.",
      "Authors receive email updates at each production stage.",
      "Common delays happen during Cover Design while awaiting author approval and during Proofreading due to revision rounds.",
      "Check the actual production status before explaining a delay. Give a specific updated timeline when confirmed, and frame author approvals collaboratively without blame.",
    ],

    GENERAL_INQUIRY: [
      "Authors can request book metadata updates through their dashboard or by emailing the BookLeaf team.",
      "Metadata changes, such as a book description update, typically appear on platforms within 3-5 business days.",
    ],
  },

  communicationGuidelines: [
    "Be empathetic and professional. Treat authors as partners.",
    "Acknowledge the author's concern before offering a solution.",
    "Use actual numbers, dates, and statuses when available rather than vague reassurances.",
    "When BookLeaf is responsible for a problem, acknowledge it directly without corporate deflection.",
    "For escalation or investigation, provide a clear timeline, such as getting back to the author within 48 hours.",
    "Always end with a clear next step for the author or the BookLeaf team.",
  ],

  responseExamples: [
    {
      category: "ROYALTY_PAYMENTS",
      query:
        "I published my book 4 months ago and still haven't received any royalty. What's going on?",
      guidance:
        "Acknowledge frustration. Explain the quarterly cycle and 45-day payout window. Check bank details and provide the next payout date when known. If genuinely overdue, escalate with a 48-hour resolution timeline.",
    },
    {
      category: "ROYALTY_PAYMENTS",
      query:
        "My royalty amount seems too low. I sold 200 copies but only received INR 3,000.",
      guidance:
        "Explain net profit deductions and offer a line-by-line royalty breakdown. Be transparent rather than defensive.",
    },
    {
      category: "ISBN_METADATA_ISSUES",
      query:
        "My book is showing a different ISBN on Amazon than on the physical copy.",
      guidance:
        "Treat as high priority. Acknowledge the serious data issue, escalate to production immediately, and provide a 48-hour resolution timeline.",
    },
    {
      category: "PRINTING_QUALITY",
      query: "My author copies have blurry images and misaligned pages.",
      guidance:
        "Apologize sincerely, request photos, and confirm a free reprint after verification with a 5-7 business day timeline.",
    },
    {
      category: "DISTRIBUTION_AVAILABILITY",
      query: "My published book is currently unavailable on Amazon.",
      guidance:
        "Explain the likely stock sync issue, arrange a re-sync with distribution, and set a 24-48 hour expectation.",
    },
    {
      category: "BOOK_STATUS_PRODUCTION_UPDATES",
      query:
        "My book has been in typesetting for 3 weeks. When will it be done?",
      guidance:
        "Check actual production status and the reason for any delay. Share a confirmed updated timeline and discuss any required author approval collaboratively.",
    },
    {
      category: "GENERAL_INQUIRY",
      query: "Can I update my book description on Amazon after it is live?",
      guidance:
        "Explain how to submit metadata updates through the dashboard or email, with changes typically appearing within 3-5 business days.",
    },
  ],
};

export default knowledgeBase;
