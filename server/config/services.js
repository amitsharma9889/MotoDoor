// Service catalogue (prices in INR). Single source of truth for server + client.
const VISIT_CHARGE = 99;
const URGENT_CHARGE = 149;

const categories = [
  {
    id: 'routine', name: 'Routine care', blurb: 'Planned maintenance at your doorstep.',
    services: [
      { id: 'general-service', name: 'General servicing', price: 499 },
      { id: 'engine-oil', name: 'Engine oil replacement', price: 349 },
    ],
  },
  {
    id: 'core', name: 'Core repairs', blurb: 'Brake, battery, tyre, chain and puncture support.',
    services: [
      { id: 'brake', name: 'Brake repair / pad change', price: 399 },
      { id: 'battery', name: 'Battery check & replacement (labour)', price: 299 },
      { id: 'tyre', name: 'Tyre replacement (labour)', price: 249 },
      { id: 'chain', name: 'Chain cleaning, lube & adjustment', price: 299 },
      { id: 'puncture', name: 'Puncture repair', price: 99 },
    ],
  },
  {
    id: 'electrical', name: 'Electrical help', blurb: 'Minor electrical repairs where you are.',
    services: [
      { id: 'lights', name: 'Headlight / indicator fix', price: 199 },
      { id: 'wiring', name: 'Wiring & fuse repair', price: 299 },
      { id: 'self-start', name: 'Self-start / ignition issue', price: 349 },
    ],
  },
  {
    id: 'urgent', name: 'Urgent response', blurb: 'Roadside help when the ride cannot continue.',
    services: [
      { id: 'roadside', name: 'Roadside breakdown assistance', price: 199 },
      { id: 'jump-start', name: 'Jump start', price: 149 },
    ],
  },
];

const findService = (categoryId, serviceId) => {
  const c = categories.find((x) => x.id === categoryId);
  return c ? c.services.find((s) => s.id === serviceId) : undefined;
};

module.exports = { categories, findService, VISIT_CHARGE, URGENT_CHARGE };
