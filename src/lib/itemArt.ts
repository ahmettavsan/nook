/** Kinds of items that have their own drawing for cards without a photo. */
export type ArtKind =
  | 'sofa'
  | 'armchair'
  | 'chair'
  | 'table'
  | 'bed'
  | 'wardrobe'
  | 'drawers'
  | 'shelf'
  | 'tv'
  | 'lamp'
  | 'rug'
  | 'curtain'
  | 'mirror'
  | 'fridge'
  | 'washer'
  | 'oven'
  | 'pot'
  | 'dishes'
  | 'cutlery'
  | 'towel'
  | 'bedding'
  | 'plant'
  | 'kettle'
  | 'vacuum'
  | 'box';

/**
 * Words in an item's name and the drawing they pick, checked in order: more specific names come first
 * ("tv ünitesi" before "ünite", "buzdolabı" before "dolap", "masa lambası" before "masa").
 */
const RULES: [ArtKind, RegExp][] = [
  ['tv', /(^|\s)tv(\s|$)|televizyon/],
  ['washer', /çamaşır makine|kurutma makine|bulaşık makine/],
  ['fridge', /buzdolab|dondurucu/],
  ['oven', /fırın|ocak|mikrodalga|davlumbaz|air ?fryer/],
  ['kettle', /kettle|su ısıtıc|kahve makine|çay makine|blender|tost makine|mikser/],
  ['vacuum', /süpürge/],
  ['lamp', /lamba|abajur|aydınlatma|avize|lambader|ampul|aplik/],
  ['bedding', /nevresim|yastık|yorgan|battaniye|çarşaf|pike|örtü/],
  ['sofa', /kanepe|çekyat|sofa|köşe (koltuk|takım)|koltuk takım|üçlü|ikili|[23] ?'?l[iıü]/],
  ['armchair', /koltuk|berjer|puf/],
  ['chair', /sandalye|tabure/],
  ['bed', /yatak|karyola|baza|ranza/],
  ['table', /masa|sehpa/],
  ['wardrobe', /gardırop|dolap|vestiyer|portmanto/],
  ['drawers', /komodin|şifonyer|çekmece|konsol|dresuar|ayakkabılık/],
  ['shelf', /(^|\s)raf|kitaplık|etajer|ünite/],
  ['mirror', /ayna/],
  ['rug', /halı|kilim|paspas/],
  ['curtain', /perde|(^|\s)stor|(^|\s)tül/],
  ['towel', /havlu|bornoz/],
  ['pot', /tencere|tava|düdüklü|cezve|güveç/],
  ['dishes', /tabak|bardak|fincan|kupa|kase|yemek takım|yemek seti/],
  ['cutlery', /çatal|bıçak|kaşık/],
  ['plant', /bitki|saksı|çiçek/],
];

/** The drawing for an item without a photo, picked from its name (a box when nothing matches). */
export function artFor(name: string): ArtKind {
  const n = name.toLocaleLowerCase('tr');
  return RULES.find(([, re]) => re.test(n))?.[0] || 'box';
}
