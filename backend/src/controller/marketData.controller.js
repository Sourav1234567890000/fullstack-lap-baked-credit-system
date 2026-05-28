// Market data controller - simulates live financial data
// In production, integrate with RBI API, Bloomberg, or NSE feeds

const generateFluctuation = (base, range = 0.05) => {
  return parseFloat((base + (Math.random() - 0.5) * range).toFixed(2));
};

const BASE_MARKET_DATA = {
  cardRates: [
    { name: 'HDFC Bank', base: 3.49 },
    { name: 'ICICI Bank', base: 3.35 },
    { name: 'SBI Cards', base: 3.50 },
    { name: 'Axis Bank', base: 3.40 },
    { name: 'Kotak Mahindra', base: 3.25 },
    { name: 'IDFC First', base: 3.55 },
  ],
  lapRates: [
    { name: 'HDFC', base: 9.50 },
    { name: 'ICICI', base: 9.75 },
    { name: 'SBI', base: 9.25 },
    { name: 'PNB Housing', base: 10.00 },
    { name: 'LIC HFL', base: 9.30 },
    { name: 'Bajaj Finance', base: 9.85 },
  ],
  repoRates: [
    { name: 'RBI (Base)', repo: 6.50, plr: null, domain: 'rbi.org.in' },
    { name: 'HDFC Bank', repo: 6.50, plr: 17.15, domain: 'hdfcbank.com' },
    { name: 'ICICI Bank', repo: 6.50, plr: 17.50, domain: 'icicibank.com' },
    { name: 'SBI', repo: 6.50, plr: 15.00, domain: 'sbi.co.in' },
    { name: 'Axis Bank', repo: 6.50, plr: 18.75, domain: 'axisbank.com' },
    { name: 'Kotak', repo: 6.50, plr: 17.00, domain: 'kotak.com' },
    { name: 'PNB', repo: 6.50, plr: 14.50, domain: 'pnbindia.in' },
  ],
  usdInrBase: 83.42
};

exports.getMarketData = async (req, res) => {
  try {
    const cardRates = BASE_MARKET_DATA.cardRates.map(r => {
      const newRate = generateFluctuation(r.base, 0.15);
      const change = parseFloat((newRate - r.base).toFixed(2));
      return { name: r.name, rate: newRate.toFixed(2), change: (change >= 0 ? '+' : '') + change.toFixed(2), trend: change >= 0 ? 'up' : 'down' };
    });

    const lapRates = BASE_MARKET_DATA.lapRates.map(r => {
      const newRate = generateFluctuation(r.base, 0.20);
      const change = parseFloat((newRate - r.base).toFixed(2));
      return { name: r.name, rate: newRate.toFixed(2), change: (change >= 0 ? '+' : '') + change.toFixed(2), trend: change >= 0 ? 'up' : 'down' };
    });

    const usdInr = generateFluctuation(BASE_MARKET_DATA.usdInrBase, 0.30);
    const usdInrChange = parseFloat((usdInr - BASE_MARKET_DATA.usdInrBase).toFixed(2));

    const repoRates = BASE_MARKET_DATA.repoRates.map(r => ({
      ...r,
      plr: r.plr ? generateFluctuation(r.plr, 0.10).toFixed(2) : null,
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)]
    }));

    // Simulated historical USD/INR for sparkline (last 7 data points)
    const history = Array.from({ length: 7 }, (_, i) =>
      parseFloat((BASE_MARKET_DATA.usdInrBase + (Math.random() - 0.5) * 0.5 + i * 0.02).toFixed(2))
    );
    history[6] = usdInr;

    res.json({
      success: true,
      data: {
        cardRates,
        lapRates,
        repoRates,
        usdInr: { value: usdInr.toFixed(2), change: (usdInrChange >= 0 ? '+' : '') + usdInrChange.toFixed(2), trend: usdInrChange >= 0 ? 'up' : 'down', history },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCreditAnalysis = async (req, res) => {
  try {
    // Simulated competitor credit facility analysis
    const analysis = [
      { company: 'HDFC Bank', marketShare: 28.4, growth: '+12.3%', avgTicket: 485000, npaNpa: 1.2, rating: 'AAA' },
      { company: 'ICICI Bank', marketShare: 22.1, growth: '+9.8%', avgTicket: 420000, npaNpa: 1.5, rating: 'AAA' },
      { company: 'SBI', marketShare: 35.2, growth: '+7.2%', avgTicket: 310000, npaNpa: 2.1, rating: 'AA+' },
      { company: 'Axis Bank', marketShare: 8.9, growth: '+15.1%', avgTicket: 560000, npaNpa: 1.8, rating: 'AA+' },
      { company: 'Bajaj Finance', marketShare: 5.4, growth: '+22.4%', avgTicket: 250000, npaNpa: 1.1, rating: 'AAA' },
    ];
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};