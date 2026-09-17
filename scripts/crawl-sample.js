// Test parser for cadao.me page 1
async function test() {
  const res = await fetch('https://cadao.me/page/1/');
  const html = await res.text();
  
  const articleRegex = /<article[\s\S]*?<\/article>/g;
  const articles = html.match(articleRegex) || [];
  console.log(`Found ${articles.length} articles on page 1`);
  
  const items = [];
  for (const art of articles) {
    const idMatch = art.match(/data-post-id="(\d+)"/);
    const titleMatch = art.match(/<h1 class="post-title[^"]*">\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    const contentMatch = art.match(/<div class="entry-content">\s*<p>([\s\S]*?)<\/p>\s*<\/div>/);
    const catMatch = art.match(/rel="category tag">([\s\S]*?)<\/a>/);
    
    const id = idMatch ? parseInt(idMatch[1], 10) : null;
    const url = titleMatch ? titleMatch[1].trim() : '';
    const title = titleMatch ? titleMatch[2].replace(/<[^>]+>/g, '').trim() : '';
    
    // Clean content, preserve newlines
    let content = '';
    if (contentMatch) {
      content = contentMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
    } else {
      content = title;
    }
    
    const category = catMatch ? catMatch[1].trim() : 'Chung';
    
    items.push({ id, title, content, category, url });
  }
  
  console.log('Sample parsed item 1:', items[0]);
  console.log('Sample parsed item 4:', items[3]);
}

test().catch(console.error);
