// Test that every search returns all 5 stores
async function test(q) {
  const r = await fetch('http://localhost:3000/api/search?q=' + encodeURIComponent(q));
  const d = await r.json();
  const stores = {};
  d.results.forEach(p => { stores[p.store] = (stores[p.store] || 0) + 1; });
  const all5 = ['amazon','flipkart','croma','reliance','tatacliq'].every(s => stores[s]);
  console.log(`${q}: ${d.count} results | ${all5 ? '✅ ALL 5' : '❌ MISSING'} | ${JSON.stringify(stores)}`);
}

async function main() {
  const queries = [
    'iPhone 15', 'Samsung Galaxy', 'MacBook Air', 'Dell laptop',
    'Sony headphones', 'washing machine', 'Nike shoes', 'air purifier',
    'iPad', 'OnePlus', 'Redmi Note', 'gaming mouse'
  ];
  for (const q of queries) {
    await test(q);
  }
}
main();
