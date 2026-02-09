import axios from 'axios';

let cached: string[] | null = null;
let expiresAt = 0;

export async function getCurrencies() {
  if (cached && Date.now() < expiresAt) {
    return cached;
  }

  const url = `${process.env.CURRENCY_API_URL}/currencies`;

  try {
    const res = await axios.get(url);

    if (!res.data || typeof res.data !== 'object') {
      console.error('Invalid currency API response:', res.data);
      cached = [];
      expiresAt = Date.now() + 5 * 60 * 1000;
      return cached;
    }

    cached = Object.keys(res.data);
    expiresAt = Date.now() + 60 * 60 * 1000;

    return cached;
  } catch (err) {
    console.error('Failed to fetch currencies:', err);
    cached = [];
    expiresAt = Date.now() + 5 * 60 * 1000;
    return cached;
  }
}
