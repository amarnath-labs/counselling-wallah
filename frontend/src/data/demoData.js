// Non-production prototype/demo data and guidance.

export const CATEGORY_RELAXATION = {'General':1.0,'EWS':1.15,'OBC-NCL':1.3,'SC':2.1,'ST':2.8};

export const BRANCH_ALTERNATIVES = {
  'CSE': [
    {name:'IT', note:'Very similar core CS curriculum; usually the next-closest closing rank to CSE at most institutes.'},
    {name:'AI/ML', note:'Newer, CS-adjacent specialisation — strong overlap with CSE in first two years.'},
    {name:'ECE', note:'Different core (electronics + some CS); still strong software-recruiting outcomes at top institutes.'}
  ],
  'IT': [
    {name:'CSE', note:'Broader core CS curriculum; typically a tighter closing rank than IT.'},
    {name:'AI/ML', note:'Overlapping foundations; more specialised toward ML/data roles.'}
  ]
};

export const BUCKET_META = {
  dream:{label:'Dream', color:'var(--red)', bg:'var(--red-soft)', desc:'High-value, competitive — worth trying.'},
  target:{label:'Target', color:'var(--amber)', bg:'var(--amber-soft)', desc:'Realistic and strong options.'},
  safe:{label:'Safe', color:'var(--green)', bg:'var(--green-soft)', desc:'Higher-probability options.'},
  backup:{label:'Backup', color:'var(--blue)', bg:'var(--blue-soft)', desc:'Extra options to keep in hand.'},
};
