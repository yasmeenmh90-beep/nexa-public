import fs from 'node:fs';
const url=new URL(process.argv[2]);
if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw new Error('Provide the final public HTTPS site URL.');
const origin=url.origin;let html=fs.readFileSync('index.html','utf8');
html=html.replace(/<link rel="canonical"[^>]*>/g,'').replace(/<meta property="og:(url|image)"[^>]*>/g,'');
html=html.replace('</head>',`<link rel="canonical" href="${origin}/"/><meta property="og:url" content="${origin}/"/><meta property="og:image" content="${origin}/social-preview.jpg"/></head>`);
fs.writeFileSync('index.html',html);
// Public, indexable pages only (sign-in and account pages stay out of the sitemap).
const pages=['/','/privacy','/terms','/security'];
fs.writeFileSync('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page=>`  <url><loc>${origin}${page}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync('public/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
console.log('Public metadata configured. Run npm run build again before deploying.');

