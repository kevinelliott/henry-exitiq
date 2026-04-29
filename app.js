const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Seed Data ────────────────────────────────────────────────────────────────
const cancellations = [
  { id: 'c001', name: 'Marcus Webb', email: 'marcus@webbtechs.com', plan: 'Growth', mrr: 49, cancelDate: '2026-04-20', reason: 'Pricing', status: 'contacted', surveyToken: 'tkn_mw01', comment: 'Love the product but \$49/mo is too steep for where we are right now.' },
  { id: 'c002', name: 'Priya Nair', email: 'priya@nairlabs.io', plan: 'Starter', mrr: 29, cancelDate: '2026-04-22', reason: 'Missing Feature', status: 'reactivated', surveyToken: 'tkn_pn02', comment: 'Needed CSV export — you added it and I came back!' },
  { id: 'c003', name: 'Derek Holt', email: 'derek@holtbuild.co', plan: 'Scale', mrr: 99, cancelDate: '2026-04-15', reason: 'Switched Competitor', status: 'lost', surveyToken: 'tkn_dh03', comment: 'Moved to ChurnKey for the Stripe integration.' },
  { id: 'c004', name: 'Samantha Cruz', email: 'samantha@cruzsaas.com', plan: 'Starter', mrr: 29, cancelDate: '2026-04-18', reason: 'Pricing', status: 'new', surveyToken: 'tkn_sc04', comment: '' },
  { id: 'c005', name: 'Jordan Kim', email: 'jordan@kimventures.io', plan: 'Growth', mrr: 49, cancelDate: '2026-04-21', reason: 'No Longer Needed', status: 'contacted', surveyToken: 'tkn_jk05', comment: 'We pivoted our business model, no longer have a SaaS product.' },
  { id: 'c006', name: 'Aisha Thompson', email: 'aisha@thompsontech.dev', plan: 'Growth', mrr: 49, cancelDate: '2026-04-25', reason: 'Missing Feature', status: 'new', surveyToken: 'tkn_at06', comment: 'Need Slack notifications for new cancellations.' },
  { id: 'c007', name: 'Ryan Patel', email: 'ryan@pateldigital.com', plan: 'Starter', mrr: 29, cancelDate: '2026-04-27', reason: 'Pricing', status: 'new', surveyToken: 'tkn_rp07', comment: '' },
  { id: 'c008', name: 'Chloe Fernandez', email: 'chloe@fernandezapps.com', plan: 'Scale', mrr: 99, cancelDate: '2026-04-12', reason: 'Switched Competitor', status: 'contacted', surveyToken: 'tkn_cf08', comment: 'Our board asked us to consolidate tools — went with a suite that had this built in.' },
  { id: 'c009', name: 'Nathan Brooks', email: 'nathan@brooksdev.io', plan: 'Starter', mrr: 29, cancelDate: '2026-04-28', reason: 'Missing Feature', status: 'new', surveyToken: 'tkn_nb09', comment: '' },
  { id: 'c010', name: 'Lena Marsh', email: 'lena@marshmedia.co', plan: 'Growth', mrr: 49, cancelDate: '2026-04-10', reason: 'Technical Issues', status: 'reactivated', surveyToken: 'tkn_lm10', comment: 'Surveys were not sending for some customers. Fixed now so I came back.' },
  { id: 'c011', name: 'Omar Gonzalez', email: 'omar@gonzalezops.com', plan: 'Starter', mrr: 29, cancelDate: '2026-04-16', reason: 'Pricing', status: 'new', surveyToken: 'tkn_og11', comment: 'Found a free alternative that covers 80% of what I need.' },
  { id: 'c012', name: 'Vivian Lee', email: 'vivian@leegrowth.io', plan: 'Growth', mrr: 49, cancelDate: '2026-04-23', reason: 'Missing Feature', status: 'contacted', surveyToken: 'tkn_vl12', comment: 'Need team seats at this tier — Growth should include 3 seats minimum.' },
  { id: 'c013', name: 'Caleb Stone', email: 'caleb@stonestartup.com', plan: 'Scale', mrr: 99, cancelDate: '2026-04-08', reason: 'Switched Competitor', status: 'reactivated', surveyToken: 'tkn_cs13', comment: 'Tried the competitor, came back — your survey UX is way better.' },
  { id: 'c014', name: 'Fatima Hassan', email: 'fatima@hassanstudio.dev', plan: 'Starter', mrr: 29, cancelDate: '2026-04-26', reason: 'No Longer Needed', status: 'new', surveyToken: 'tkn_fh14', comment: '' },
  { id: 'c015', name: 'Ethan Rowe', email: 'ethan@rowecloud.com', plan: 'Growth', mrr: 49, cancelDate: '2026-04-29', reason: 'Pricing', status: 'new', surveyToken: 'tkn_er15', comment: 'Pricing jumped from my intro rate and I was not prepared for the increase.' },
];

const monthlyTrend = [
  { month: 'Nov', count: 6, mrrLost: 254 },
  { month: 'Dec', count: 8, mrrLost: 341 },
  { month: 'Jan', count: 10, mrrLost: 458 },
  { month: 'Feb', count: 9, mrrLost: 412 },
  { month: 'Mar', count: 12, mrrLost: 537 },
  { month: 'Apr', count: 15, mrrLost: 666 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeStats() {
  const mtd = cancellations; // all are April or earlier; treat all as in scope for demo
  const totalCancels = mtd.length;
  const mrrLost = mtd.reduce((s, c) => s + c.mrr, 0);
  const reactivated = mtd.filter(c => c.status === 'reactivated').length;
  const winbackRate = Math.round((reactivated / totalCancels) * 100);
  const withSurvey = mtd.filter(c => c.comment && c.comment.length > 0).length;
  const responseRate = Math.round((withSurvey / totalCancels) * 100);
  const reasonCounts = {};
  mtd.forEach(c => { reasonCounts[c.reason] = (reasonCounts[c.reason] || 0) + 1; });
  return { totalCancels, mrrLost, winbackRate, responseRate, reasonCounts };
}

const WIN_BACK_TEMPLATES = {
  'Pricing':
    'Hi {{name}},\n\n' +
    'We noticed you recently cancelled your ExitIQ subscription, and we understand — pricing matters, especially in the early stages.\n\n' +
    'We\'d love to offer you 30% off for the next 3 months to help you get to the point where it\'s a no-brainer. That brings {{plan}} down to just ${{discounted}}/month.\n\n' +
    'No strings attached. If you\'d like to take us up on it, just reply to this email or click below.\n\n' +
    'Hope to earn you back,\nThe ExitIQ Team',

  'Missing Feature':
    'Hi {{name}},\n\n' +
    'Thanks for sharing why you left — it genuinely helps us build a better product.\n\n' +
    'The feature you mentioned is on our roadmap for Q3. We\'d love to bring you back as a beta tester when it\'s ready — at no charge during the beta period.\n\n' +
    'Would that interest you? Just reply and I\'ll add you to the list.\n\n' +
    '— The ExitIQ Team',

  'Switched Competitor':
    'Hi {{name}},\n\n' +
    'We respect your decision to try other tools — competition makes everyone better.\n\n' +
    'If you ever find the other option isn\'t quite fitting, we\'d welcome you back. We\'ve shipped 14 new features this quarter and continue to focus on the things that matter most to founders like you.\n\n' +
    'Your account is preserved for 30 days if you\'d like to give us another shot.\n\n' +
    '— The ExitIQ Team',

  'No Longer Needed':
    'Hi {{name}},\n\n' +
    'Totally understand — sometimes the timing just isn\'t right.\n\n' +
    'If things shift and you launch a new product or need to understand cancellations again, we\'ll be here. We\'d love to offer you a "returning founder" discount when you\'re ready.\n\n' +
    'Wishing you the best,\n— The ExitIQ Team',

  'Technical Issues':
    'Hi {{name}},\n\n' +
    'We\'re sorry technical issues led to your cancellation — that\'s on us.\n\n' +
    'We\'ve made significant improvements to reliability and deliverability in the past 30 days. If you\'re open to it, we\'d like to give you a free month to try the improved experience with no commitment.\n\n' +
    'Your data is still here. Let us know and we\'ll reactivate your account today.\n\n' +
    '— The ExitIQ Team',

  'Other':
    'Hi {{name}},\n\n' +
    'Thank you for being a customer and for your honest feedback. We\'d love to understand more about what didn\'t work for you.\n\n' +
    'Would you be open to a quick 15-minute call? Your perspective would directly shape our roadmap — and we\'d like to make it right if we can.\n\n' +
    '— The ExitIQ Team',
};

function getWinbackMessage(reason, record) {
  const template = WIN_BACK_TEMPLATES[reason] || WIN_BACK_TEMPLATES['Other'];
  if (!record) return template;
  const discounted = Math.round(record.mrr * 0.7);
  return template
    .replace(/{{name}}/g, record.name.split(' ')[0])
    .replace(/{{plan}}/g, record.plan)
    .replace(/{{discounted}}/g, discounted);
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #0f1117; color: #e2e8f0; min-height: 100vh; }
  a { color: #6366f1; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .btn { display: inline-block; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.15s; }
  .btn:hover { opacity: 0.85; }
  .btn-primary { background: #6366f1; color: #fff; }
  .btn-sm { padding: 6px 14px; font-size: 13px; }
  .btn-ghost { background: transparent; border: 1px solid #334155; color: #94a3b8; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .badge-pricing { background: #fef3c7; color: #92400e; }
  .badge-feature { background: #ede9fe; color: #5b21b6; }
  .badge-competitor { background: #fce7f3; color: #9d174d; }
  .badge-nolonger { background: #e0f2fe; color: #0c4a6e; }
  .badge-technical { background: #fef9c3; color: #713f12; }
  .badge-other { background: #f1f5f9; color: #475569; }
  .badge-new { background: #1e293b; color: #94a3b8; }
  .badge-contacted { background: #1e3a5f; color: #60a5fa; }
  .badge-reactivated { background: #052e16; color: #4ade80; }
  .badge-lost { background: #2d0e11; color: #f87171; }
  nav { background: #0f1117; border-bottom: 1px solid #1e293b; padding: 0 24px; display: flex; align-items: center; height: 60px; gap: 32px; }
  nav .logo { font-size: 18px; font-weight: 700; color: #fff; }
  nav .logo span { color: #6366f1; }
  nav a { color: #94a3b8; font-size: 14px; }
  nav a:hover { color: #e2e8f0; text-decoration: none; }
  nav .nav-right { margin-left: auto; }
`;

// ─── Routes: Landing ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ExitIQ — Cancellation Intelligence for SaaS Founders</title>
<style>
${BASE_CSS}
.hero { max-width: 800px; margin: 0 auto; padding: 100px 24px 80px; text-align: center; }
.hero h1 { font-size: clamp(36px,6vw,64px); font-weight: 800; line-height: 1.1; letter-spacing: -1px; margin-bottom: 20px; }
.hero h1 span { color: #6366f1; }
.hero p { font-size: 20px; color: #94a3b8; max-width: 560px; margin: 0 auto 40px; line-height: 1.6; }
.hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.btn-lg { padding: 14px 32px; font-size: 16px; border-radius: 10px; }
.section { padding: 80px 24px; }
.section-title { text-align: center; font-size: 32px; font-weight: 700; margin-bottom: 12px; }
.section-sub { text-align: center; color: #64748b; font-size: 16px; margin-bottom: 56px; }
.features { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 960px; margin: 0 auto; }
.feature-card { background: #1a1d27; border: 1px solid #1e293b; border-radius: 12px; padding: 28px; }
.feature-card .icon { font-size: 28px; margin-bottom: 16px; }
.feature-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.feature-card p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
.pain-section { background: #0d1020; border-top: 1px solid #1e293b; border-bottom: 1px solid #1e293b; }
.pain-inner { max-width: 760px; margin: 0 auto; padding: 80px 24px; }
.pain-inner h2 { font-size: 28px; font-weight: 700; margin-bottom: 32px; text-align: center; }
.pain-list { list-style: none; display: flex; flex-direction: column; gap: 16px; }
.pain-list li { background: #1a1d27; border: 1px solid #1e293b; border-radius: 10px; padding: 20px 24px; display: flex; gap: 16px; align-items: flex-start; }
.pain-list li .x { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
.pain-list li p { color: #94a3b8; font-size: 15px; line-height: 1.5; }
.pain-list li strong { color: #e2e8f0; }
.pricing { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; max-width: 860px; margin: 0 auto; }
.price-card { background: #1a1d27; border: 1px solid #1e293b; border-radius: 12px; padding: 32px 28px; }
.price-card.featured { border-color: #6366f1; position: relative; }
.price-card .tag { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: #6366f1; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 20px; white-space: nowrap; }
.price-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.price-card .price { font-size: 40px; font-weight: 800; margin: 12px 0 4px; }
.price-card .price span { font-size: 16px; color: #64748b; font-weight: 400; }
.price-card .price-desc { color: #64748b; font-size: 13px; margin-bottom: 24px; }
.price-card ul { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
.price-card ul li { font-size: 14px; color: #94a3b8; padding-left: 20px; position: relative; }
.price-card ul li::before { content: '✓'; position: absolute; left: 0; color: #10b981; }
.cta-section { text-align: center; padding: 100px 24px; }
.cta-section h2 { font-size: 36px; font-weight: 800; margin-bottom: 16px; }
.cta-section p { color: #64748b; font-size: 16px; margin-bottom: 36px; }
footer { border-top: 1px solid #1e293b; padding: 32px 24px; text-align: center; color: #475569; font-size: 13px; }
</style>
</head>
<body>
<nav>
  <div class="logo">Exit<span>IQ</span></div>
  <a href="/app">Dashboard</a>
  <a href="/winback">Win-back</a>
  <div class="nav-right"><a href="/app" class="btn btn-primary btn-sm">Open App</a></div>
</nav>

<div class="hero">
  <h1>Stop guessing<br><span>why customers leave.</span></h1>
  <p>Stripe tells you who churned. ExitIQ tells you why — and helps you win them back.</p>
  <div class="hero-actions">
    <a href="/app" class="btn btn-primary btn-lg">Start free 14-day trial</a>
    <a href="/app" class="btn btn-ghost btn-lg">View demo</a>
  </div>
</div>

<div class="pain-section">
  <div class="pain-inner">
    <h2>Sound familiar?</h2>
    <ul class="pain-list">
      <li><div class="x">📊</div><p><strong>Stripe shows you who churned.</strong> But "cancelled" isn't an answer. Was it pricing? A missing feature? A competitor? You don't know.</p></li>
      <li><div class="x">📧</div><p><strong>Exit emails go unanswered.</strong> "We'd love to know why you're leaving" in your cancellation email gets a 4% reply rate — if you're lucky.</p></li>
      <li><div class="x">💸</div><p><strong>You're re-learning the same lessons.</strong> The same pricing objection kills 3 deals a month and you have no data to justify fixing it.</p></li>
    </ul>
  </div>
</div>

<div class="section">
  <div class="section-title">Everything you need to understand churn</div>
  <div class="section-sub">From the moment they cancel to the win-back message in their inbox.</div>
  <div class="features">
    <div class="feature-card">
      <div class="icon">📋</div>
      <h3>Exit surveys (no login required)</h3>
      <p>Embed a link in your cancel flow. Customers answer in 30 seconds — no account needed. You get structured reasons, not silence.</p>
    </div>
    <div class="feature-card">
      <div class="icon">📈</div>
      <h3>Churn reason dashboard</h3>
      <p>See exactly which reasons are driving cancellations, trending over time, and how much MRR each category is costing you per month.</p>
    </div>
    <div class="feature-card">
      <div class="icon">✉️</div>
      <h3>Win-back message generator</h3>
      <p>ExitIQ writes targeted win-back messages for each cancellation reason. Pricing churners get a discount offer. Competitor churners get a differentiation message.</p>
    </div>
  </div>
</div>

<div class="section" style="background:#0d1020; border-top:1px solid #1e293b; border-bottom:1px solid #1e293b;">
  <div class="section-title">Simple, founder-friendly pricing</div>
  <div class="section-sub">No per-seat surprises. Cancel anytime.</div>
  <div class="pricing">
    <div class="price-card">
      <h3>Starter</h3>
      <div class="price">$29<span>/mo</span></div>
      <div class="price-desc">For early-stage SaaS</div>
      <ul>
        <li>1 product</li>
        <li>500 survey responses/mo</li>
        <li>Churn reason dashboard</li>
        <li>Win-back message generator</li>
        <li>Email support</li>
      </ul>
      <a href="/app" class="btn btn-ghost" style="width:100%;text-align:center;">Get started</a>
    </div>
    <div class="price-card featured">
      <div class="tag">Most popular</div>
      <h3>Growth</h3>
      <div class="price">$49<span>/mo</span></div>
      <div class="price-desc">For growing SaaS teams</div>
      <ul>
        <li>5 products</li>
        <li>Unlimited responses</li>
        <li>Everything in Starter</li>
        <li>3 team seats</li>
        <li>Monthly trend reports</li>
        <li>Segment win-back campaigns</li>
      </ul>
      <a href="/app" class="btn btn-primary" style="width:100%;text-align:center;">Start free trial</a>
    </div>
    <div class="price-card">
      <h3>Scale</h3>
      <div class="price">$99<span>/mo</span></div>
      <div class="price-desc">For established SaaS businesses</div>
      <ul>
        <li>Unlimited products</li>
        <li>Unlimited everything</li>
        <li>Unlimited team seats</li>
        <li>CSV export</li>
        <li>Stripe webhook integration</li>
        <li>Priority support</li>
      </ul>
      <a href="/app" class="btn btn-ghost" style="width:100%;text-align:center;">Get started</a>
    </div>
  </div>
</div>

<div class="cta-section">
  <h2>Built for founders who want answers, not guesses.</h2>
  <p>Set up in 10 minutes. Cancel anytime. Your first 14 days are free.</p>
  <a href="/app" class="btn btn-primary btn-lg">Start your free trial →</a>
</div>

<footer>© 2026 ExitIQ. All rights reserved.</footer>
</body></html>`);
});

// ─── Routes: Dashboard ────────────────────────────────────────────────────────
app.get('/app', (req, res) => {
  const stats = computeStats();
  const sorted = [...cancellations].sort((a, b) => new Date(b.cancelDate) - new Date(a.cancelDate));

  const reasonBadge = (r) => {
    const map = { 'Pricing': 'pricing', 'Missing Feature': 'feature', 'Switched Competitor': 'competitor', 'No Longer Needed': 'nolonger', 'Technical Issues': 'technical', 'Other': 'other' };
    return `<span class="badge badge-${map[r] || 'other'}">${r}</span>`;
  };
  const statusBadge = (s) => `<span class="badge badge-${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`;

  const maxCount = Math.max(...Object.values(stats.reasonCounts));
  const reasonBars = ['Pricing', 'Missing Feature', 'Switched Competitor', 'No Longer Needed', 'Technical Issues'].map(r => {
    const count = stats.reasonCounts[r] || 0;
    const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
    const mrrForReason = cancellations.filter(c => c.reason === r).reduce((s, c) => s + c.mrr, 0);
    return `<div class="reason-row">
      <div class="reason-label">${r}</div>
      <div class="reason-bar-wrap"><div class="reason-bar" style="width:${pct}%"></div></div>
      <div class="reason-stats">${count} cancel${count !== 1 ? 's' : ''} · $${mrrForReason} MRR</div>
    </div>`;
  }).join('');

  const rows = sorted.map(c => `<tr>
    <td><div class="customer-name">${c.name}</div><div class="customer-email">${c.email}</div></td>
    <td><span class="plan-tag plan-${c.plan.toLowerCase()}">${c.plan}</span></td>
    <td class="mrr-cell">$${c.mrr}</td>
    <td>${c.cancelDate}</td>
    <td>${reasonBadge(c.reason)}</td>
    <td>${statusBadge(c.status)}</td>
    <td><a href="/winback?highlight=${c.id}" class="btn btn-sm btn-ghost">Win-back</a></td>
  </tr>`).join('');

  const trendBars = monthlyTrend.map(m => {
    const maxMrr = Math.max(...monthlyTrend.map(t => t.mrrLost));
    const h = Math.round((m.mrrLost / maxMrr) * 80);
    return `<div class="trend-col">
      <div class="trend-bar" style="height:${h}px" title="$${m.mrrLost} MRR lost"></div>
      <div class="trend-label">${m.month}</div>
    </div>`;
  }).join('');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ExitIQ — Dashboard</title>
<style>
${BASE_CSS}
.page { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
.page-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
.page-sub { color: #64748b; font-size: 14px; margin-bottom: 32px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
.stat-card { background: #1a1d27; border: 1px solid #1e293b; border-radius: 12px; padding: 20px 24px; }
.stat-label { font-size: 13px; color: #64748b; margin-bottom: 8px; }
.stat-value { font-size: 32px; font-weight: 800; }
.stat-value.red { color: #f43f5e; }
.stat-value.green { color: #10b981; }
.stat-value.indigo { color: #6366f1; }
.stat-delta { font-size: 12px; color: #64748b; margin-top: 4px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
@media(max-width:700px) { .grid-2 { grid-template-columns: 1fr; } }
.card { background: #1a1d27; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; }
.card-title { font-size: 15px; font-weight: 700; margin-bottom: 20px; }
.reason-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; font-size: 13px; }
.reason-label { width: 160px; flex-shrink: 0; color: #94a3b8; }
.reason-bar-wrap { flex: 1; background: #0f1117; border-radius: 4px; height: 8px; }
.reason-bar { background: #6366f1; border-radius: 4px; height: 8px; transition: width 0.3s; }
.reason-stats { width: 140px; flex-shrink: 0; color: #64748b; text-align: right; }
.trend-chart { display: flex; align-items: flex-end; gap: 10px; height: 100px; }
.trend-col { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
.trend-bar { background: #6366f1; border-radius: 4px 4px 0 0; width: 100%; min-height: 4px; }
.trend-label { font-size: 11px; color: #64748b; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: left; padding: 12px 14px; font-size: 12px; color: #64748b; font-weight: 600; border-bottom: 1px solid #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }
td { padding: 14px; border-bottom: 1px solid #1e293b; vertical-align: middle; }
tr:last-child td { border-bottom: none; }
.customer-name { font-weight: 600; font-size: 14px; }
.customer-email { font-size: 12px; color: #64748b; margin-top: 2px; }
.mrr-cell { font-weight: 700; color: #f43f5e; }
.plan-tag { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.plan-starter { background: #1e293b; color: #94a3b8; }
.plan-growth { background: #1e3a5f; color: #60a5fa; }
.plan-scale { background: #1e1052; color: #a78bfa; }
</style>
</head>
<body>
<nav>
  <div class="logo">Exit<span>IQ</span></div>
  <a href="/app">Dashboard</a>
  <a href="/winback">Win-back</a>
  <div class="nav-right"><a href="/" style="color:#64748b;font-size:13px;">← Landing page</a></div>
</nav>
<div class="page">
  <div class="page-title">Churn Dashboard</div>
  <div class="page-sub">April 2026 · All products</div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Cancellations (MTD)</div>
      <div class="stat-value red">${stats.totalCancels}</div>
      <div class="stat-delta">↑ 3 vs last month</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">MRR Lost (MTD)</div>
      <div class="stat-value red">$${stats.mrrLost}</div>
      <div class="stat-delta">↑ $129 vs last month</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Win-back Rate</div>
      <div class="stat-value green">${stats.winbackRate}%</div>
      <div class="stat-delta">↑ 4pp vs last month</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Survey Response Rate</div>
      <div class="stat-value indigo">${stats.responseRate}%</div>
      <div class="stat-delta">Avg for SaaS: 18%</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">Churn reasons breakdown</div>
      ${reasonBars}
    </div>
    <div class="card">
      <div class="card-title">MRR lost — 6-month trend</div>
      <div class="trend-chart">${trendBars}</div>
      <div style="margin-top:16px; font-size:13px; color:#64748b;">Peak month: Apr 2026 · $666 MRR lost</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Recent cancellations</div>
    <div style="overflow-x:auto;">
    <table>
      <thead><tr>
        <th>Customer</th><th>Plan</th><th>MRR</th><th>Cancelled</th><th>Reason</th><th>Status</th><th>Action</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </div>
  </div>
</div>
</body></html>`);
});

// ─── Routes: Exit Survey ──────────────────────────────────────────────────────
app.get('/survey/:token', (req, res) => {
  const record = cancellations.find(c => c.surveyToken === req.params.token);
  const submitted = req.query.done === '1';

  if (submitted) {
    return res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Thank you — ExitIQ</title>
<style>
${BASE_CSS}
.center { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; text-align:center; padding:24px; }
.icon { font-size:56px; margin-bottom:24px; }
h1 { font-size:28px; font-weight:700; margin-bottom:12px; }
p { color:#94a3b8; font-size:16px; max-width:400px; line-height:1.6; }
</style></head><body>
<div class="center">
  <div class="icon">🙏</div>
  <h1>Thanks for your feedback.</h1>
  <p>Your input helps us build something better. We genuinely appreciate you taking the time to share.</p>
</div>
</body></html>`);
  }

  if (!record) {
    return res.status(404).send('<h1 style="color:#fff;font-family:system-ui;padding:40px;">Survey not found.</h1>');
  }

  const firstName = record.name.split(' ')[0];
  res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Quick question — ExitIQ</title>
<style>
${BASE_CSS}
.survey-wrap { max-width:520px; margin:60px auto; padding:0 24px; }
.survey-card { background:#1a1d27; border:1px solid #1e293b; border-radius:16px; padding:40px; }
.survey-pre { font-size:13px; color:#6366f1; font-weight:600; margin-bottom:12px; text-transform:uppercase; letter-spacing:0.5px; }
h1 { font-size:26px; font-weight:800; margin-bottom:8px; }
.survey-sub { color:#94a3b8; font-size:15px; margin-bottom:32px; line-height:1.5; }
.options { display:flex; flex-direction:column; gap:10px; margin-bottom:24px; }
.option-label { display:flex; align-items:center; gap:12px; padding:14px 16px; background:#0f1117; border:1px solid #1e293b; border-radius:10px; cursor:pointer; transition:border-color 0.15s; font-size:15px; }
.option-label:hover { border-color:#6366f1; }
.option-label input[type=radio] { accent-color:#6366f1; width:16px; height:16px; flex-shrink:0; }
textarea { width:100%; background:#0f1117; border:1px solid #1e293b; border-radius:10px; padding:14px 16px; color:#e2e8f0; font-family:system-ui; font-size:14px; resize:vertical; min-height:90px; margin-bottom:24px; outline:none; }
textarea:focus { border-color:#6366f1; }
textarea::placeholder { color:#475569; }
.submit-btn { width:100%; padding:14px; background:#6366f1; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:700; cursor:pointer; transition:opacity 0.15s; }
.submit-btn:hover { opacity:0.85; }
.powered { text-align:center; margin-top:20px; font-size:12px; color:#334155; }
</style>
</head><body>
<div class="survey-wrap">
  <div class="survey-card">
    <div class="survey-pre">Before you go</div>
    <h1>Hi ${firstName}, one quick question.</h1>
    <div class="survey-sub">Your honest feedback helps us improve. Takes 30 seconds — no login needed.</div>
    <form method="POST" action="/survey/${record.surveyToken}">
      <div style="font-size:14px; font-weight:600; margin-bottom:12px; color:#94a3b8;">Why are you cancelling?</div>
      <div class="options">
        ${['Pricing too high', 'Missing a feature I need', 'Switching to a competitor', 'No longer need it', 'Technical issues', 'Other'].map(opt => `
        <label class="option-label"><input type="radio" name="reason" value="${opt}" required> ${opt}</label>`).join('')}
      </div>
      <textarea name="comment" placeholder="Anything else you'd like to share? (optional)"></textarea>
      <button type="submit" class="submit-btn">Submit feedback →</button>
    </form>
  </div>
  <div class="powered">Powered by <strong style="color:#6366f1;">ExitIQ</strong></div>
</div>
</body></html>`);
});

app.post('/survey/:token', (req, res) => {
  const record = cancellations.find(c => c.surveyToken === req.params.token);
  if (record) {
    const reasonMap = {
      'Pricing too high': 'Pricing',
      'Missing a feature I need': 'Missing Feature',
      'Switching to a competitor': 'Switched Competitor',
      'No longer need it': 'No Longer Needed',
      'Technical issues': 'Technical Issues',
      'Other': 'Other',
    };
    if (req.body.reason) record.reason = reasonMap[req.body.reason] || req.body.reason;
    if (req.body.comment) record.comment = req.body.comment;
    if (record.status === 'new') record.status = 'contacted';
  }
  res.redirect(`/survey/${req.params.token}?done=1`);
});

// ─── Routes: Win-back Center ──────────────────────────────────────────────────
app.get('/winback', (req, res) => {
  const highlight = req.query.highlight || null;
  const reasons = ['Pricing', 'Missing Feature', 'Switched Competitor', 'No Longer Needed', 'Technical Issues', 'Other'];

  const groups = reasons.map(reason => {
    const members = cancellations.filter(c => c.reason === reason);
    if (members.length === 0) return '';
    const mrrTotal = members.reduce((s, c) => s + c.mrr, 0);
    const template = getWinbackMessage(reason, members[0]);
    const id = reason.replace(/\s+/g, '-').toLowerCase();
    const highlighted = members.find(c => c.id === highlight);

    return `<div class="group-card ${highlighted ? 'highlighted' : ''}" id="group-${id}">
      <div class="group-header">
        <div>
          <div class="group-reason">${reason}</div>
          <div class="group-meta">${members.length} customer${members.length !== 1 ? 's' : ''} · $${mrrTotal} MRR lost</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="toggleMsg('msg-${id}')">Generate win-back message</button>
      </div>
      <div class="customer-chips">
        ${members.map(c => `<span class="chip ${c.id === highlight ? 'chip-active' : ''}">${c.name}</span>`).join('')}
      </div>
      <div class="msg-box" id="msg-${id}" style="display:none">
        <div class="msg-label">Win-back message — ${reason}</div>
        <textarea class="msg-textarea">${template}</textarea>
        <div style="display:flex;gap:10px;margin-top:12px;">
          <button class="btn btn-primary btn-sm" onclick="copyMsg('msg-${id}')">Copy message</button>
          <span class="copy-confirm" id="confirm-${id}" style="display:none;color:#10b981;font-size:13px;align-self:center;">✓ Copied!</span>
        </div>
      </div>
    </div>`;
  }).filter(Boolean).join('');

  res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ExitIQ — Win-back Center</title>
<style>
${BASE_CSS}
.page { max-width:860px; margin:0 auto; padding:32px 24px; }
.page-title { font-size:24px; font-weight:700; margin-bottom:8px; }
.page-sub { color:#64748b; font-size:14px; margin-bottom:32px; }
.summary-bar { display:flex; gap:24px; background:#1a1d27; border:1px solid #1e293b; border-radius:12px; padding:20px 24px; margin-bottom:32px; flex-wrap:wrap; }
.summary-stat { }
.summary-stat .val { font-size:24px; font-weight:800; }
.summary-stat .lbl { font-size:12px; color:#64748b; margin-top:2px; }
.group-card { background:#1a1d27; border:1px solid #1e293b; border-radius:12px; padding:24px; margin-bottom:20px; }
.group-card.highlighted { border-color:#6366f1; }
.group-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:16px; flex-wrap:wrap; }
.group-reason { font-size:17px; font-weight:700; }
.group-meta { font-size:13px; color:#64748b; margin-top:4px; }
.customer-chips { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:0; }
.chip { background:#0f1117; border:1px solid #1e293b; border-radius:20px; padding:5px 14px; font-size:13px; color:#94a3b8; }
.chip-active { border-color:#6366f1; color:#6366f1; }
.msg-box { margin-top:20px; border-top:1px solid #1e293b; padding-top:20px; }
.msg-label { font-size:13px; color:#64748b; font-weight:600; margin-bottom:10px; }
.msg-textarea { width:100%; background:#0f1117; border:1px solid #1e293b; border-radius:10px; padding:16px; color:#e2e8f0; font-family:system-ui; font-size:14px; line-height:1.7; min-height:220px; resize:vertical; outline:none; }
.msg-textarea:focus { border-color:#6366f1; }
</style>
<script>
function toggleMsg(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
function copyMsg(id) {
  const box = document.getElementById(id);
  const ta = box.querySelector('textarea');
  navigator.clipboard.writeText(ta.value).then(() => {
    const c = document.getElementById('confirm-' + id.replace('msg-',''));
    c.style.display = 'inline';
    setTimeout(() => { c.style.display = 'none'; }, 2000);
  });
}
</script>
</head><body>
<nav>
  <div class="logo">Exit<span>IQ</span></div>
  <a href="/app">Dashboard</a>
  <a href="/winback">Win-back</a>
  <div class="nav-right"><a href="/" style="color:#64748b;font-size:13px;">← Landing page</a></div>
</nav>
<div class="page">
  <div class="page-title">Win-back Center</div>
  <div class="page-sub">Targeted messages for each cancellation reason. Click 'Generate' to see the template.</div>
  <div class="summary-bar">
    <div class="summary-stat"><div class="val" style="color:#f43f5e;">${cancellations.length}</div><div class="lbl">Churned customers</div></div>
    <div class="summary-stat"><div class="val" style="color:#f43f5e;">$${cancellations.reduce((s,c)=>s+c.mrr,0)}</div><div class="lbl">Total MRR at risk</div></div>
    <div class="summary-stat"><div class="val" style="color:#10b981;">${cancellations.filter(c=>c.status==='reactivated').length}</div><div class="lbl">Already reactivated</div></div>
    <div class="summary-stat"><div class="val" style="color:#6366f1;">${cancellations.filter(c=>c.status==='new').length}</div><div class="lbl">Ready to contact</div></div>
  </div>
  ${groups}
</div>
</body></html>`);
});

// ─── API ──────────────────────────────────────────────────────────────────────
app.get('/api/state', (req, res) => {
  res.json({ stats: computeStats(), cancellations, monthlyTrend });
});

app.get('/api/cancellations', (req, res) => {
  res.json(cancellations);
});

app.post('/api/cancellations', (req, res) => {
  const { name, email, plan, mrr, reason } = req.body;
  if (!name || !email || !plan || !mrr) return res.status(400).json({ error: 'name, email, plan, mrr required' });
  const newRecord = {
    id: 'c' + Date.now(),
    name, email, plan, mrr: Number(mrr),
    cancelDate: new Date().toISOString().slice(0, 10),
    reason: reason || null,
    status: 'new',
    surveyToken: 'tkn_' + Math.random().toString(36).slice(2, 8),
    comment: '',
  };
  cancellations.push(newRecord);
  res.status(201).json(newRecord);
});

app.patch('/api/cancellations/:id', (req, res) => {
  const record = cancellations.find(c => c.id === req.params.id);
  if (!record) return res.status(404).json({ error: 'not found' });
  Object.assign(record, req.body);
  res.json(record);
});

app.get('/api/winback-message', (req, res) => {
  const { reason, id } = req.query;
  if (!reason) return res.status(400).json({ error: 'reason required' });
  const record = id ? cancellations.find(c => c.id === id) : null;
  res.json({ reason, message: getWinbackMessage(reason, record) });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = 3177;
app.listen(PORT, () => {
  console.log(`ExitIQ running at http://127.0.0.1:${PORT}`);
});
