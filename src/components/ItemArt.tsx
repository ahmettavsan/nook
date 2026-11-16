import { artFor, type ArtKind } from '../lib/itemArt';

/** 16×16 pixel drawings: the outline path, then the lighter fill. */
const ART: Record<ArtKind, [string, string]> = {
  sofa: [
    'M3 4h10v1h-10zM2 5h12v1h-12zM2 6h12v1h-12zM1 7h14v1h-14zM0 8h2v1h-2zM14 8h2v1h-2zM0 9h2v1h-2zM14 9h2v1h-2zM0 10h16v1h-16zM0 11h16v1h-16zM1 12h1v1h-1zM14 12h1v1h-1zM1 13h1v1h-1zM14 13h1v1h-1z',
    'M2 8h12v1h-12zM2 9h12v1h-12z',
  ],
  armchair: [
    'M4 3h8v1h-8zM3 4h10v1h-10zM3 5h10v1h-10zM3 6h10v1h-10zM1 7h14v1h-14zM0 8h2v1h-2zM3 8h10v1h-10zM14 8h2v1h-2zM0 9h2v1h-2zM3 9h10v1h-10zM14 9h2v1h-2zM0 10h2v1h-2zM13 10h3v1h-3zM0 11h16v1h-16zM0 12h16v1h-16zM1 13h1v1h-1zM14 13h1v1h-1zM1 14h1v1h-1zM14 14h1v1h-1z',
    'M2 8h1v1h-1zM13 8h1v1h-1zM2 9h1v1h-1zM13 9h1v1h-1zM2 10h11v1h-11z',
  ],
  chair: [
    'M5 1h6v1h-6zM5 2h1v1h-1zM10 2h1v1h-1zM5 3h1v1h-1zM10 3h1v1h-1zM5 4h1v1h-1zM10 4h1v1h-1zM5 5h1v1h-1zM10 5h1v1h-1zM5 6h6v1h-6zM5 7h1v1h-1zM10 7h1v1h-1zM5 8h1v1h-1zM10 8h1v1h-1zM4 9h8v1h-8zM4 10h8v1h-8zM4 11h1v1h-1zM11 11h1v1h-1zM4 12h1v1h-1zM11 12h1v1h-1zM4 13h1v1h-1zM11 13h1v1h-1zM4 14h1v1h-1zM11 14h1v1h-1z',
    'M6 2h4v1h-4zM6 3h4v1h-4zM6 4h4v1h-4zM6 5h4v1h-4z',
  ],
  table: [
    'M0 6h16v1h-16zM0 7h16v1h-16zM1 8h2v1h-2zM13 8h2v1h-2zM1 9h2v1h-2zM13 9h2v1h-2zM1 10h2v1h-2zM13 10h2v1h-2zM1 11h2v1h-2zM13 11h2v1h-2zM1 12h2v1h-2zM13 12h2v1h-2zM1 13h2v1h-2zM13 13h2v1h-2z',
    '',
  ],
  bed: [
    'M0 3h2v1h-2zM0 4h2v1h-2zM0 5h2v1h-2zM0 6h2v1h-2zM0 7h2v1h-2zM6 7h10v1h-10zM0 8h16v1h-16zM0 9h2v1h-2zM14 9h2v1h-2zM0 10h16v1h-16zM0 11h16v1h-16zM0 12h2v1h-2zM14 12h2v1h-2zM0 13h2v1h-2zM14 13h2v1h-2z',
    'M3 6h3v1h-3zM3 7h3v1h-3zM2 9h12v1h-12z',
  ],
  wardrobe: [
    'M2 1h12v1h-12zM2 2h1v1h-1zM8 2h1v1h-1zM14 2h1v1h-1zM2 3h1v1h-1zM8 3h1v1h-1zM14 3h1v1h-1zM2 4h1v1h-1zM8 4h1v1h-1zM14 4h1v1h-1zM2 5h1v1h-1zM8 5h1v1h-1zM14 5h1v1h-1zM2 6h1v1h-1zM7 6h2v1h-2zM13 6h2v1h-2zM2 7h1v1h-1zM7 7h2v1h-2zM13 7h2v1h-2zM2 8h1v1h-1zM8 8h1v1h-1zM14 8h1v1h-1zM2 9h1v1h-1zM8 9h1v1h-1zM14 9h1v1h-1zM2 10h1v1h-1zM8 10h1v1h-1zM14 10h1v1h-1zM2 11h1v1h-1zM8 11h1v1h-1zM14 11h1v1h-1zM2 12h12v1h-12zM2 13h2v1h-2zM12 13h2v1h-2z',
    'M3 2h5v1h-5zM9 2h5v1h-5zM3 3h5v1h-5zM9 3h5v1h-5zM3 4h5v1h-5zM9 4h5v1h-5zM3 5h5v1h-5zM9 5h5v1h-5zM3 6h4v1h-4zM9 6h4v1h-4zM3 7h4v1h-4zM9 7h4v1h-4zM3 8h5v1h-5zM9 8h5v1h-5zM3 9h5v1h-5zM9 9h5v1h-5zM3 10h5v1h-5zM9 10h5v1h-5zM3 11h5v1h-5zM9 11h5v1h-5z',
  ],
  drawers: [
    'M3 3h10v1h-10zM3 4h1v1h-1zM12 4h1v1h-1zM3 5h1v1h-1zM7 5h2v1h-2zM12 5h1v1h-1zM3 6h1v1h-1zM12 6h1v1h-1zM3 7h10v1h-10zM3 8h1v1h-1zM12 8h1v1h-1zM3 9h1v1h-1zM7 9h2v1h-2zM12 9h1v1h-1zM3 10h1v1h-1zM12 10h1v1h-1zM3 11h10v1h-10zM3 12h2v1h-2zM11 12h2v1h-2z',
    'M4 4h8v1h-8zM4 5h3v1h-3zM9 5h3v1h-3zM4 6h8v1h-8zM4 8h8v1h-8zM4 9h3v1h-3zM9 9h3v1h-3zM4 10h8v1h-8z',
  ],
  shelf: [
    'M2 1h12v1h-12zM2 2h1v1h-1zM13 2h1v1h-1zM2 3h1v1h-1zM13 3h1v1h-1zM2 4h1v1h-1zM13 4h1v1h-1zM2 5h12v1h-12zM2 6h1v1h-1zM13 6h1v1h-1zM2 7h1v1h-1zM13 7h1v1h-1zM2 8h1v1h-1zM13 8h1v1h-1zM2 9h12v1h-12zM2 10h1v1h-1zM13 10h1v1h-1zM2 11h1v1h-1zM13 11h1v1h-1zM2 12h1v1h-1zM13 12h1v1h-1zM2 13h12v1h-12z',
    'M4 3h2v1h-2zM7 3h1v1h-1zM9 3h2v1h-2zM4 4h2v1h-2zM7 4h1v1h-1zM9 4h2v1h-2zM4 7h1v1h-1zM6 7h2v1h-2zM9 7h3v1h-3zM4 8h1v1h-1zM6 8h2v1h-2zM9 8h3v1h-3zM4 11h4v1h-4zM9 11h1v1h-1zM11 11h1v1h-1zM4 12h4v1h-4zM9 12h1v1h-1zM11 12h1v1h-1z',
  ],
  tv: [
    'M1 2h14v1h-14zM1 3h1v1h-1zM14 3h1v1h-1zM1 4h1v1h-1zM14 4h1v1h-1zM1 5h1v1h-1zM14 5h1v1h-1zM1 6h1v1h-1zM14 6h1v1h-1zM1 7h1v1h-1zM14 7h1v1h-1zM1 8h14v1h-14zM7 9h2v1h-2zM5 10h6v1h-6zM2 12h12v1h-12zM2 13h1v1h-1zM7 13h2v1h-2zM13 13h1v1h-1zM2 14h12v1h-12z',
    'M2 3h12v1h-12zM2 4h12v1h-12zM2 5h12v1h-12zM2 6h12v1h-12zM2 7h12v1h-12z',
  ],
  lamp: [
    'M5 1h6v1h-6zM4 2h8v1h-8zM3 3h10v1h-10zM2 4h12v1h-12zM7 5h2v1h-2zM7 6h2v1h-2zM7 7h2v1h-2zM7 8h2v1h-2zM7 9h2v1h-2zM7 10h2v1h-2zM7 11h2v1h-2zM7 12h2v1h-2zM5 13h6v1h-6zM4 14h8v1h-8z',
    '',
  ],
  rug: [
    'M1 5h14v1h-14zM1 6h1v1h-1zM14 6h1v1h-1zM1 7h1v1h-1zM3 7h10v1h-10zM14 7h1v1h-1zM1 8h1v1h-1zM3 8h1v1h-1zM12 8h1v1h-1zM14 8h1v1h-1zM1 9h1v1h-1zM3 9h10v1h-10zM14 9h1v1h-1zM1 10h1v1h-1zM14 10h1v1h-1zM1 11h14v1h-14z',
    'M1 4h1v1h-1zM3 4h1v1h-1zM5 4h1v1h-1zM7 4h1v1h-1zM9 4h1v1h-1zM11 4h1v1h-1zM13 4h1v1h-1zM2 6h12v1h-12zM2 7h1v1h-1zM13 7h1v1h-1zM2 8h1v1h-1zM4 8h8v1h-8zM13 8h1v1h-1zM2 9h1v1h-1zM13 9h1v1h-1zM2 10h12v1h-12zM1 12h1v1h-1zM3 12h1v1h-1zM5 12h1v1h-1zM7 12h1v1h-1zM9 12h1v1h-1zM11 12h1v1h-1zM13 12h1v1h-1z',
  ],
  curtain: [
    'M0 1h16v1h-16zM1 3h2v1h-2zM13 3h2v1h-2zM1 4h3v1h-3zM12 4h3v1h-3zM1 5h3v1h-3zM12 5h3v1h-3zM1 6h4v1h-4zM11 6h4v1h-4zM1 7h4v1h-4zM11 7h4v1h-4zM1 8h3v1h-3zM12 8h3v1h-3zM1 9h2v1h-2zM13 9h2v1h-2zM1 10h2v1h-2zM13 10h2v1h-2zM1 11h3v1h-3zM12 11h3v1h-3zM1 12h3v1h-3zM12 12h3v1h-3zM1 13h4v1h-4zM11 13h4v1h-4zM1 14h4v1h-4zM11 14h4v1h-4z',
    'M1 2h1v1h-1zM14 2h1v1h-1zM3 9h1v1h-1zM12 9h1v1h-1z',
  ],
  mirror: [
    'M5 1h6v1h-6zM4 2h2v1h-2zM10 2h2v1h-2zM3 3h2v1h-2zM11 3h2v1h-2zM3 4h1v1h-1zM8 4h2v1h-2zM12 4h1v1h-1zM3 5h1v1h-1zM7 5h2v1h-2zM12 5h1v1h-1zM3 6h1v1h-1zM6 6h2v1h-2zM12 6h1v1h-1zM3 7h1v1h-1zM11 7h2v1h-2zM3 8h1v1h-1zM12 8h1v1h-1zM3 9h2v1h-2zM11 9h2v1h-2zM4 10h2v1h-2zM10 10h2v1h-2zM5 11h6v1h-6zM7 12h2v1h-2zM5 13h6v1h-6z',
    'M6 2h4v1h-4zM5 3h6v1h-6zM4 4h4v1h-4zM10 4h2v1h-2zM4 5h3v1h-3zM9 5h3v1h-3zM4 6h2v1h-2zM8 6h4v1h-4zM4 7h7v1h-7zM4 8h8v1h-8zM5 9h6v1h-6zM6 10h4v1h-4z',
  ],
  fridge: [
    'M4 1h8v1h-8zM4 2h1v1h-1zM11 2h1v1h-1zM4 3h1v1h-1zM6 3h1v1h-1zM11 3h1v1h-1zM4 4h1v1h-1zM6 4h1v1h-1zM11 4h1v1h-1zM4 5h1v1h-1zM11 5h1v1h-1zM4 6h8v1h-8zM4 7h1v1h-1zM11 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM11 8h1v1h-1zM4 9h1v1h-1zM6 9h1v1h-1zM11 9h1v1h-1zM4 10h1v1h-1zM6 10h1v1h-1zM11 10h1v1h-1zM4 11h1v1h-1zM11 11h1v1h-1zM4 12h1v1h-1zM11 12h1v1h-1zM4 13h8v1h-8zM4 14h1v1h-1zM11 14h1v1h-1z',
    'M5 2h6v1h-6zM5 3h1v1h-1zM7 3h4v1h-4zM5 4h1v1h-1zM7 4h4v1h-4zM5 5h6v1h-6zM5 7h6v1h-6zM5 8h1v1h-1zM7 8h4v1h-4zM5 9h1v1h-1zM7 9h4v1h-4zM5 10h1v1h-1zM7 10h4v1h-4zM5 11h6v1h-6zM5 12h6v1h-6z',
  ],
  washer: [
    'M3 1h10v1h-10zM3 2h1v1h-1zM5 2h1v1h-1zM7 2h1v1h-1zM12 2h1v1h-1zM3 3h10v1h-10zM3 4h1v1h-1zM6 4h4v1h-4zM12 4h1v1h-1zM3 5h1v1h-1zM5 5h2v1h-2zM9 5h2v1h-2zM12 5h1v1h-1zM3 6h1v1h-1zM5 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM3 7h1v1h-1zM5 7h1v1h-1zM10 7h1v1h-1zM12 7h1v1h-1zM3 8h1v1h-1zM5 8h2v1h-2zM9 8h2v1h-2zM12 8h1v1h-1zM3 9h1v1h-1zM6 9h4v1h-4zM12 9h1v1h-1zM3 10h1v1h-1zM12 10h1v1h-1zM3 11h10v1h-10z',
    'M4 2h1v1h-1zM6 2h1v1h-1zM8 2h4v1h-4zM4 4h2v1h-2zM10 4h2v1h-2zM4 5h1v1h-1zM7 5h2v1h-2zM11 5h1v1h-1zM4 6h1v1h-1zM6 6h4v1h-4zM11 6h1v1h-1zM4 7h1v1h-1zM6 7h4v1h-4zM11 7h1v1h-1zM4 8h1v1h-1zM7 8h2v1h-2zM11 8h1v1h-1zM4 9h2v1h-2zM10 9h2v1h-2zM4 10h8v1h-8z',
  ],
  oven: [
    'M3 1h10v1h-10zM3 2h1v1h-1zM5 2h1v1h-1zM8 2h1v1h-1zM11 2h1v1h-1zM3 3h10v1h-10zM3 4h1v1h-1zM12 4h1v1h-1zM3 5h1v1h-1zM5 5h6v1h-6zM12 5h1v1h-1zM3 6h1v1h-1zM5 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM3 7h1v1h-1zM5 7h1v1h-1zM10 7h1v1h-1zM12 7h1v1h-1zM3 8h1v1h-1zM5 8h6v1h-6zM12 8h1v1h-1zM3 9h1v1h-1zM12 9h1v1h-1zM3 10h10v1h-10zM3 11h2v1h-2zM11 11h2v1h-2z',
    'M4 2h1v1h-1zM6 2h2v1h-2zM9 2h2v1h-2zM12 2h1v1h-1zM4 4h8v1h-8zM4 5h1v1h-1zM11 5h1v1h-1zM4 6h1v1h-1zM6 6h4v1h-4zM11 6h1v1h-1zM4 7h1v1h-1zM6 7h4v1h-4zM11 7h1v1h-1zM4 8h1v1h-1zM11 8h1v1h-1zM4 9h8v1h-8z',
  ],
  pot: [
    'M7 3h2v1h-2zM4 4h8v1h-8zM1 6h14v1h-14zM2 7h12v1h-12zM2 8h1v1h-1zM13 8h1v1h-1zM2 9h1v1h-1zM13 9h1v1h-1zM2 10h1v1h-1zM13 10h1v1h-1zM2 11h12v1h-12zM3 12h10v1h-10z',
    'M3 8h10v1h-10zM3 9h10v1h-10zM3 10h10v1h-10z',
  ],
  dishes: [
    'M3 4h9v1h-9zM3 5h1v1h-1zM11 5h1v1h-1zM3 6h1v1h-1zM11 6h4v1h-4zM3 7h1v1h-1zM11 7h1v1h-1zM14 7h1v1h-1zM3 8h1v1h-1zM11 8h1v1h-1zM14 8h1v1h-1zM3 9h1v1h-1zM11 9h4v1h-4zM4 10h1v1h-1zM10 10h1v1h-1zM5 11h5v1h-5zM1 12h14v1h-14zM2 13h12v1h-12z',
    'M4 5h7v1h-7zM4 6h7v1h-7zM4 7h7v1h-7zM4 8h7v1h-7zM4 9h7v1h-7zM5 10h5v1h-5z',
  ],
  cutlery: [
    'M3 1h1v1h-1zM5 1h1v1h-1zM7 1h1v1h-1zM12 1h2v1h-2zM3 2h1v1h-1zM5 2h1v1h-1zM7 2h1v1h-1zM11 2h3v1h-3zM3 3h1v1h-1zM5 3h1v1h-1zM7 3h1v1h-1zM11 3h3v1h-3zM3 4h5v1h-5zM11 4h3v1h-3zM4 5h3v1h-3zM11 5h3v1h-3zM5 6h1v1h-1zM11 6h3v1h-3zM5 7h1v1h-1zM11 7h3v1h-3zM5 8h1v1h-1zM12 8h1v1h-1zM5 9h1v1h-1zM12 9h1v1h-1zM5 10h1v1h-1zM12 10h1v1h-1zM5 11h1v1h-1zM12 11h1v1h-1zM5 12h1v1h-1zM12 12h1v1h-1zM5 13h1v1h-1zM12 13h1v1h-1z',
    '',
  ],
  towel: [
    'M1 2h14v1h-14zM1 3h14v1h-14zM2 4h1v1h-1zM13 4h1v1h-1zM2 5h1v1h-1zM13 5h1v1h-1zM2 6h1v1h-1zM13 6h1v1h-1zM2 7h12v1h-12zM2 8h1v1h-1zM13 8h1v1h-1zM2 9h1v1h-1zM13 9h1v1h-1zM2 10h12v1h-12zM2 11h1v1h-1zM13 11h1v1h-1zM2 12h12v1h-12z',
    'M3 4h10v1h-10zM3 5h10v1h-10zM3 6h10v1h-10zM3 8h10v1h-10zM3 9h10v1h-10zM3 11h10v1h-10z',
  ],
  bedding: [
    'M3 4h10v1h-10zM2 5h12v1h-12zM1 6h2v1h-2zM13 6h2v1h-2zM1 7h1v1h-1zM14 7h1v1h-1zM1 8h1v1h-1zM14 8h1v1h-1zM1 9h1v1h-1zM14 9h1v1h-1zM1 10h2v1h-2zM13 10h2v1h-2zM2 11h12v1h-12zM3 12h10v1h-10z',
    'M3 6h10v1h-10zM2 7h12v1h-12zM2 8h12v1h-12zM2 9h12v1h-12zM3 10h10v1h-10z',
  ],
  plant: [
    'M7 1h1v1h-1zM6 2h3v1h-3zM2 3h2v1h-2zM6 3h3v1h-3zM11 3h2v1h-2zM2 4h3v1h-3zM6 4h3v1h-3zM10 4h3v1h-3zM3 5h3v1h-3zM7 5h1v1h-1zM9 5h3v1h-3zM4 6h2v1h-2zM7 6h1v1h-1zM9 6h2v1h-2zM5 7h1v1h-1zM7 7h1v1h-1zM9 7h1v1h-1zM6 8h3v1h-3zM4 9h7v1h-7zM4 10h1v1h-1zM10 10h1v1h-1zM4 11h1v1h-1zM10 11h1v1h-1zM5 12h1v1h-1zM9 12h1v1h-1zM5 13h5v1h-5z',
    'M5 10h5v1h-5zM5 11h5v1h-5zM6 12h3v1h-3z',
  ],
  kettle: [
    'M5 2h6v1h-6zM4 3h2v1h-2zM10 3h2v1h-2zM3 4h2v1h-2zM11 4h2v1h-2zM14 4h2v1h-2zM2 5h2v1h-2zM12 5h4v1h-4zM2 6h1v1h-1zM13 6h1v1h-1zM15 6h1v1h-1zM2 7h1v1h-1zM13 7h1v1h-1zM15 7h1v1h-1zM2 8h1v1h-1zM13 8h3v1h-3zM2 9h1v1h-1zM13 9h2v1h-2zM2 10h12v1h-12zM2 11h12v1h-12z',
    'M6 3h4v1h-4zM5 4h6v1h-6zM4 5h8v1h-8zM3 6h10v1h-10zM3 7h10v1h-10zM3 8h10v1h-10zM3 9h10v1h-10z',
  ],
  vacuum: [
    'M2 1h2v1h-2zM2 2h2v1h-2zM3 3h2v1h-2zM4 4h2v1h-2zM5 5h2v1h-2zM6 6h2v1h-2zM7 7h2v1h-2zM7 8h5v1h-5zM6 9h1v1h-1zM12 9h1v1h-1zM5 10h1v1h-1zM13 10h1v1h-1zM5 11h1v1h-1zM13 11h1v1h-1zM5 12h9v1h-9zM6 13h1v1h-1zM12 13h1v1h-1z',
    'M7 9h5v1h-5zM6 10h7v1h-7zM6 11h7v1h-7z',
  ],
  box: [
    'M3 3h10v1h-10zM2 4h1v1h-1zM7 4h2v1h-2zM13 4h1v1h-1zM1 5h1v1h-1zM7 5h2v1h-2zM14 5h1v1h-1zM0 6h16v1h-16zM0 7h1v1h-1zM7 7h2v1h-2zM15 7h1v1h-1zM0 8h1v1h-1zM7 8h2v1h-2zM15 8h1v1h-1zM0 9h1v1h-1zM15 9h1v1h-1zM0 10h1v1h-1zM15 10h1v1h-1zM0 11h1v1h-1zM15 11h1v1h-1zM0 12h1v1h-1zM15 12h1v1h-1zM0 13h16v1h-16z',
    'M3 4h4v1h-4zM9 4h4v1h-4zM2 5h5v1h-5zM9 5h5v1h-5zM1 7h6v1h-6zM9 7h6v1h-6zM1 8h6v1h-6zM9 8h6v1h-6zM1 9h14v1h-14zM1 10h14v1h-14zM1 11h14v1h-14zM1 12h14v1h-14z',
  ],
};

/** Stands in for the photo of an item that has none: a pixel drawing of what the item is. */
export function ItemArt({ name }: { name: string }) {
  const [body, fill] = ART[artFor(name)];
  return (
    <svg className="item-art" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <path d={fill} />
      <path className="item-art-line" d={body} />
    </svg>
  );
}
