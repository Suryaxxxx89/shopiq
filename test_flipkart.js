const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://www.flipkart.com/search?q=iPhone+15', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } })
  .then(res => {
    const $ = cheerio.load(res.data);
    const matches = $('.cPHD_L, ._1AtVbE, ._13oc-S, div[data-id], .tUxRFH, .slAVV4').length;
    console.log('Matches found:', matches);
    console.log('Class cPHD_L:', $('.cPHD_L').length);
    console.log('Class _1AtVbE:', $('._1AtVbE').length);
    console.log('Class tUxRFH:', $('.tUxRFH').length);
    console.log('Class slAVV4:', $('.slAVV4').length);
    console.log('Class CGtC98:', $('.CGtC98').length);
    
    // Test the first match
    const elem = $('.tUxRFH, .CGtC98').first();
    const title = elem.find('.KzYVwS, ._4rR01T').text().trim();
    console.log('Sample Title:', title);
  })
  .catch(err => console.error(err.message));
