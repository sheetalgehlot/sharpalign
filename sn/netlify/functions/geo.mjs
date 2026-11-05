import {json,currencyFor} from './_lib.mjs';
// Tells the shop pages which currency to show this visitor (India: rupees, UK: pounds, euro countries: euros, everyone else: dollars).
export default async (req,context)=>{const c=(context&&context.geo&&context.geo.country&&context.geo.country.code)||'';return json({country:c,currency:currencyFor(c,new URL(req.url).searchParams.get('cur')||'')});};
