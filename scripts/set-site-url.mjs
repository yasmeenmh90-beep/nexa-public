import fs from 'node:fs';
const url=new URL(process.argv[2]);
if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw new Error('Provide the final public HTTPS site URL.');
const origin=url.origin;let html=fs.readFileSync('index.html','utf8');
html=html.replace(/<link rel="canonical"[^>]*>/g,'').replace(/<meta property="og:(url|image)"[^>]*>/g,'');
html=html.replace('</head>',`<link rel="canonical" href="${origin}/"/><meta property="og:url" content="${origin}/"/><meta property="og:image" content="${origin}/social-preview.png"/></head>`);
fs.writeFileSync('index.html',html);
fs.writeFileSync('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>`);
fs.writeFileSync('public/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
console.log('Public metadata configured. Run npm run build again before deploying.');

