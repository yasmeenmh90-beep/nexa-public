import VoiceChat from './components/VoiceChat';
import GuidedTour from './components/GuidedTour';
import { usePageMotion } from './hooks/usePageMotion';
import { useState, useRef, type ReactNode, type CSSProperties } from 'react';
import { PUBLIC_LINKS } from './config/publicLinks';

const portfolio = PUBLIC_LINKS.portfolio;
const github = PUBLIC_LINKS.repository ?? PUBLIC_LINKS.githubProfile;
const linkedin = PUBLIC_LINKS.linkedin;
const states = ['idle', 'listening', 'thinking', 'speaking'] as const;
type State = typeof states[number];

function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: ReactNode }) {
  return <section id={id} className="section"><div className="section-heading"><p className="eyebrow">{kicker}</p><h2>{title}</h2></div>{children}</section>;
}
function Tag({ children }: { children: ReactNode }) { return <span className="tag">{children}</span>; }
function Portrait({state='idle'}:{state?:State}){
 const speaking=state==='speaking';
 return <div className={`portrait ${state}`}>
  <div className="orbit" aria-hidden="true"/>
  <div className="nexa-aura" aria-hidden="true"/>
  <svg className="nexa-voice-halo" viewBox="0 0 300 300" aria-hidden="true" focusable="false">
   <circle className="nexa-halo-track" cx="150" cy="150" r="124"/>
   {Array.from({length:48},(_,index)=><g key={index} transform={`rotate(${index*7.5} 150 150)`}><rect className="nexa-halo-bar" x="148" y="9" width="4" height={10+(index%5)*3} rx="2" style={{animationDelay:`-${(index%9)*0.13}s`,animationDuration:`${0.65+(index%4)*0.12}s`}}/></g>)}
  </svg>
  <img className="nexa-character" src="/avatar/nexa-studio-dashboard.png" width="291" height="313" alt="NEXA wearing a lavender hijab, purple headphones and silver NEXA armor"/>
  <div className="nexa-voice-wave" aria-hidden="true">{Array.from({length:13},(_,index)=><span key={index} style={{animationDelay:`-${index*0.11}s`,height:`${8+(6-Math.abs(6-index))*3}px`}}/>)}</div>
  <span className="portrait-state"><i/>{state.toUpperCase()} <small>{speaking?'VOICE PLAYING':'NEXA'}</small></span>
 </div>
}
function ScreenshotGallery(){
 const dialog=useRef<HTMLDialogElement>(null);const [image,setImage]=useState('desktop');
 const labels:Record<string,string>={login:'Login interface · demo entry',desktop:'Desktop dashboard',mobile:'Mobile dashboard',architecture:'Earlier public architecture view',states:'Actual visual-state presentation'};
 return <><div className="screenshot-grid">{['login','desktop','mobile','states','architecture'].map(view=><button key={view} onClick={()=>{setImage(view);dialog.current?.showModal()}} aria-label={`Enlarge actual ${view} prototype screenshot`}><img loading="lazy" src={`/screenshots/${view}.png`} alt={`Actual ${view} NEXA prototype using sample data`}/><span>{labels[view]} · Actual prototype ↗</span></button>)}</div><dialog ref={dialog} className="lightbox"><button className="lightbox-close" onClick={()=>dialog.current?.close()}>Close screenshot</button><img src={`/screenshots/${image}.png`} alt={`Enlarged actual ${image} prototype screenshot`}/></dialog></>
}

const samples: Record<string, string> = {
  'Daily briefing': 'Sample briefing: a fictional design review is at 10:00, the demo project has two open tasks, and a sample documentation update is ready for review.',
  'Inbox': 'Sample inbox: one fictional project update, one sample meeting invitation and one illustrative newsletter. No mailbox was accessed.',
  'Calendar': 'Sample calendar: design review at 10:00 and planning at 14:00. These fictional events are local demo content.',
  'Projects': 'Sample project: the interface milestone is ready for review; two illustrative tasks remain. No project service was queried.',
  'Career': 'Sample opportunity: an illustrative applied-AI role. Suggested next step: tailor a portfolio case study. This is not a live vacancy.',
  'GitHub': 'Sample repository: a fictional documentation update and two sample issues. No GitHub account or repository was accessed.',
};
const layers: Record<string, string> = {
  'Interface': 'React and TypeScript hold chat state in the browser. Visitors can type, dictate, review text, copy replies and hear answers.',
  'Public API': 'Live AI uses a Netlify Function with input validation, bounded recent history, request throttling, daily usage limits and a server-side OpenAI key.',
  'Private access': 'Owner authentication and authorization are planned for a separate private application. Public chat does not provide access to that route.',
  'Orchestration': 'The separate n8n foundation routes specialist workflows. The owner reports verification of seven read-only specialists; this website does not invoke them.',
  'Specialists': 'Planned private domains include calendar, email, projects and developer activity. Memory and write actions require separate permissions and approval design.',
  'Response': 'Sample replies stay local. Live AI returns text through the server; optional browser speech reads it aloud. Recent context clears on Reset, mode changes or refresh.',
};
const faqs = [
  ['What can I use NEXA for?', 'Ask general questions, explore an AI concept, plan a day or select Interview Practice in Live AI for one-question-at-a-time coaching. Sample Demo previews fictional productivity tasks. Neither mode performs actions in personal accounts.'],
  ['What is the difference between Sample and Live AI?', 'Sample Demo uses predefined fictional answers in your browser. Live AI sends your question and up to three recent completed exchanges to OpenAI through a server endpoint. Responses can be inaccurate.'],
  ['Can I speak instead of typing?', 'Yes, in supported browsers. Choose Microphone, speak, review the recognized text and press Send. Enable spoken replies to hear answers. Available languages and voices depend on your browser.'],
  ['Does NEXA access my email, calendar or GitHub?', 'No. Personal accounts and private n8n workflows are disconnected from this public site. The screenshot gallery documents an earlier prototype using sample data.'],
  ['Is there a limit on Live AI?', 'Yes. Each visitor can send 10 live messages a day, and the site has a daily total. When the limit is reached, NEXA shows when Live AI opens again. Sample Demo is always available.'],
  ['Does it remember our conversation?', 'Live AI uses a bounded amount of recent context for follow-up questions. Reset, changing modes or refreshing clears the chat held by this app. This is not long-term personal memory.'],
  ['Why does the portrait not move its lips?', 'The halo and voice bars indicate speech playback. Precise lip sync is deferred until an audio-driven avatar can preserve NEXA’s identity reliably.'],
  ['What remains on the roadmap?', 'Complete device and accessibility review, monitor usage and publish a clean walkthrough. Owner authentication, personal-service integrations and precise lip sync are separate future milestones.'],
];

function Flow({ kind, title, nodes }: { kind: string; title: string; nodes: [string, string][] }) {
  return <div className={`flow-lane ${kind}`}><div className="flow-label"><Tag>{title}</Tag><span>{kind === 'sample-flow' ? 'Browser only' : 'Server-backed answers'}</span></div><ol className="flow-nodes" style={{ '--nodes': nodes.length } as CSSProperties}>{nodes.map(([name, description], index) => <li key={name}><span className="flow-number">0{index + 1}</span><strong>{name}</strong><small>{description}</small></li>)}</ol></div>;
}

export default function App() {
  usePageMotion();
  const [menu, setMenu] = useState(false);
  const [layer, setLayer] = useState('Interface');
  const nav = [['Try NEXA', 'demo'], ['Architecture', 'architecture'], ['Engineering', 'case-study'], ['FAQ', 'faq']];
  return <>
    <a className="skip" href="#overview">Skip to content</a>
    <header className="nav">
      <a className="brand" href="#overview" aria-label="NEXA home"><span>✦</span> NEXA</a>
      <button className="menu" aria-expanded={menu} aria-controls="navigation" onClick={() => setMenu(!menu)}>{menu ? 'Close' : 'Menu'}</button>
      <nav id="navigation" className={menu ? 'open' : ''}>{nav.map(([name, id]) => <a key={id} href={'#' + id} onClick={() => setMenu(false)}>{name}</a>)}<a className="nav-source" href={github}>Source code ↗</a><a className="nav-signin" href="/signin">Sign in</a></nav>
      <a className="nav-cta" href="#demo">Start a conversation <span>↗</span></a>
    </header>
    <main>
      <section id="overview" className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot"/> AN INDEPENDENT AI ENGINEERING PROJECT</p>
          <h1>A little less switching.<br/><em>A little more clarity.</em></h1>
          <p className="hero-subtitle">Meet NEXA. Your window into a more connected way to work.</p>
          <p className="lead">Ask a question, say it aloud, or explore a sample briefing. A conversational AI experience built around a familiar face—and clear boundaries.</p>
          <div className="buttons"><a className="button primary" href="#demo">Talk to NEXA <span>↗</span></a><GuidedTour/></div>
          <div className="hero-capabilities"><span>Text & voice</span><span>Live AI answers</span><span>Fictional task previews</span></div>
          <a className="hero-builder" href={portfolio}>Designed & built by Yasmeen Azmat Ali <span>↗</span></a>
        </div>
        <div className="hero-art"><div className="studio-top"><span>✦ NEXA / VOICE STUDIO</span><span className="studio-label">PUBLIC DEMO</span></div><Portrait/><div className="studio-bottom"><span>Personal AI Operations Assistant</span><a href="#demo">Meet NEXA ↗</a></div></div>
      </section>
      <div className="stack-strip"><span>THE FOUNDATION</span><strong>React</strong><strong>TypeScript</strong><strong>OpenAI</strong><strong>Netlify</strong><strong>n8n <small>private · separate</small></strong><a href={github}>Explore the source ↗</a></div>
      <Section id="problem" kicker="01 / A CLEARER START" title="One conversation. A few useful possibilities.">
        <div className="grid three use-cases">{[
          ['01', 'Understand something new.', 'Get a plain-language explanation, ask for an example, then follow up without starting over.', 'Live AI'],
          ['02', 'Think through your day.', 'Turn your own ideas into a plan or practise an interview question. Use your voice when it feels easier.', 'Text & voice'],
          ['03', 'Preview the bigger idea.', 'Explore fictional inbox, calendar and project summaries to see the direction of the private assistant.', 'Sample Demo'],
        ].map(([number, title, text, tag]) => <article className="card" key={number}><div className="card-top"><span className="number">{number}</span><Tag>{tag}</Tag></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      </Section>
      <Section id="demo" kicker="02 / YOUR TURN" title="A question is all it takes."><p className="intro">Try a sample task, or switch to Live AI and make the conversation your own.</p><VoiceChat samples={samples} renderPortrait={state => <Portrait state={state}/>}/></Section>
      <Section id="architecture" kicker="03 / BEHIND THE CONVERSATION" title="Two public paths. One clear boundary.">
        <p className="intro">A local demonstration and a live AI service share the same interface. Personal workflows remain separate.</p>
        <div className="architecture">
          <Flow kind="sample-flow" title="SAMPLE DEMO" nodes={[[ 'You', 'Choose a fictional task' ], [ 'Local samples', 'Predefined browser content' ], [ 'NEXA replies', 'Text + optional speech' ]]}/>
          <Flow kind="live-flow" title="LIVE AI" nodes={[[ 'You', 'Type or dictate a question' ], [ 'Server API', 'Validate input · keep the key private' ], [ 'OpenAI', 'Generate a general answer' ], [ 'NEXA replies', 'Read, copy or listen' ]]}/>
          <div className="private-boundary"><span className="boundary-symbol">◇</span><div><strong>Private by separation.</strong><p>Personal accounts and n8n workflows are not connected to either public path.</p></div><Tag>PRIVATE INTEGRATION PLANNED</Tag></div>
        </div>
        <details className="technical-details"><summary>Explore the engineering layers <span>+</span></summary><div className="layers" aria-label="Architecture layers">{Object.keys(layers).map((name, index) => <button key={name} aria-pressed={layer === name} onClick={() => setLayer(name)}><small>0{index + 1}</small>{name}<span>↗</span></button>)}</div><div className="layer-detail" aria-live="polite"><h3>{layer}</h3><p>{layers[layer]}</p></div></details>
      </Section>
      <Section id="showcase" kicker="04 / THE INTERFACE STORY" title="A familiar character. An evolving workspace.">
        <div className="showcase-heading"><p className="intro">The lavender hijab, purple headphones and silver armor stay at the heart of NEXA. These earlier prototype screens show how the interface developed.</p><Tag>EARLIER PROTOTYPE · SAMPLE DATA</Tag></div>
        <details className="gallery-details"><summary>Explore the prototype gallery <span>5 screens · open gallery ↗</span></summary><ScreenshotGallery/></details>
        {PUBLIC_LINKS.demoVideo && <figure className="video-proof"><video controls preload="metadata" src={PUBLIC_LINKS.demoVideo} aria-label="NEXA public demonstration recording"/><figcaption>A walkthrough of the public NEXA experience.</figcaption></figure>}
      </Section>
      <Section id="security" kicker="05 / DESIGNED WITH BOUNDARIES" title="Know what you’re sharing. Know what stays separate.">
        <div className="grid three">{[
          ['A transparent AI route.', 'Live AI sends your submitted text and bounded recent context to OpenAI. Browser voice input may use its provider’s speech service. Avoid sharing sensitive information.'],
          ['No personal account access.', 'This public experience cannot read your inbox, calendar, repositories or private memory. Private integrations need their own owner authentication and permissions.'],
          ['Control in your hands.', 'Review dictated text before sending. Stop playback whenever you like. Reset clears the app’s conversation context. AI answers can be inaccurate.'],
        ].map(([title, text]) => <article className="card boundary-card" key={title}><span className="glyph">◇</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </Section>
      <Section id="case-study" kicker="06 / ENGINEERING, MADE VISIBLE" title="More than a conversational interface.">
        <div className="case-study-layout"><div><p className="intro">NEXA brings frontend engineering, a server-backed AI route and a separate workflow architecture into one public project.</p><a className="text-link" href={github}>Read the implementation ↗</a></div><div className="engineering-list">{[
          ['01', 'A maintainable foundation', 'Typed React components, explicit interaction states, responsive layouts and shared design primitives.'],
          ['02', 'A controlled public AI route', 'Server-side credentials, input validation, bounded conversation history, request throttling and upstream timeouts.'],
          ['03', 'An expressive, honest interface', 'Browser speech input/output and playback effects, with visible distinctions between samples, AI answers and future capabilities.'],
        ].map(([number, title, text]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div>
        <div id="evidence" className="evidence-strip"><div><span className="evidence-mark">✓</span><strong>TypeScript checks</strong><small>Component & state validation</small></div><div><span className="evidence-mark">10</span><strong>Backend tests</strong><small>Mocked API & validation tests</small></div><div><span className="evidence-mark">↗</span><strong>Public source</strong><small>Setup & verification in the README</small></div></div>
        <p className="caption">The owner reports passing live chat and voice tests. Static checks and mocked tests do not establish complete security or device compatibility.</p>
      </Section>
      <Section id="development" kicker="07 / THE ROAD AHEAD" title="Working today. Room to grow.">
        <div className="roadmap-grid"><article className="roadmap-current"><Tag>AVAILABLE NOW</Tag><h3>A public experience you can try.</h3><ul><li>Sample tasks and general Live AI answers</li><li>Voice input and spoken replies</li><li>Short follow-up context and answer copying</li><li>Interview Practice and a guided website tour</li><li>Public feedback and source access</li></ul></article><article className="roadmap-next"><Tag>NEXT MILESTONES</Tag><h3>A deliberate path forward.</h3><ul><li>Complete cross-device and accessibility review</li><li>Monitor usage and add a clean walkthrough</li><li>Build owner authentication for private workflows</li><li>Revisit precise lip sync after avatar testing</li></ul></article></div>
        <details className="technical-details history-details"><summary>Earlier development & verification <span>+</span></summary><p>The owner reports recovering 37 original source files and verifying their SHA-256 integrity, plus separate read-only specialist routing checks in n8n. These are historical owner-reported results, not a new independent audit. The earlier private-assistant prototype, pictured above, included a demo login and dashboard. It is distinct from this public website.</p></details>
      </Section>
      <Section id="about" kicker="08 / THE BUILDER" title="Built with curiosity. Grounded in engineering."><div className="about-panel"><div className="builder-monogram" aria-hidden="true">YA<span>✦</span></div><div><h3>Yasmeen Azmat Ali</h3><p>AI/ML and full-stack engineer exploring practical AI, agentic systems and the interfaces that make them useful.</p></div><div className="about-links"><a href={portfolio}>Portfolio ↗</a><a href={github}>GitHub ↗</a><a href={linkedin}>Connect ↗</a></div></div></Section>
      <Section id="faq" kicker="09 / A FEW ANSWERS" title="Before you ask NEXA."><div className="faq">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></Section>
      <section className="final-cta"><p className="eyebrow">IDEAS BECOME MORE USEFUL IN CONVERSATION.</p><h2>Go ahead.<br/><em>Ask your first question.</em></h2><div className="buttons"><a className="button primary" href="#demo">Talk to NEXA ↗</a><a className="text-link" href={github}>Explore the source ↗</a>{PUBLIC_LINKS.booking && <a className="text-link" href={PUBLIC_LINKS.booking}>Book a conversation ↗</a>}</div></section>
    </main>
    <footer><div><a className="brand" href="#overview"><span>✦</span> NEXA</a><p>Personal AI Operations Assistant<br/>An independent project by Yasmeen Azmat Ali.</p></div><div className="footer-links"><a href="#demo">Try NEXA</a><a href="#architecture">Architecture</a><a href={portfolio}>Portfolio</a><a href={github}>GitHub</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/security">Security</a><span>© {new Date().getFullYear()} · Sample content is fictional. AI can be inaccurate.</span></div></footer>
  </>;
}
