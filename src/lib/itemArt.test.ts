import { describe, expect, it } from 'vitest';
import { artFor } from './itemArt';

describe('drawings for items without a photo', () => {
  it('picks the drawing from the name, in Turkish', () => {
    expect(artFor("KIVIK 3'lü kanepe")).toBe('sofa');
    expect(artFor('POÄNG sallanan koltuk')).toBe('armchair');
    expect(artFor('TEODORES sandalye')).toBe('chair');
    expect(artFor('LISABO yemek masası')).toBe('table');
    expect(artFor('MALM karyola')).toBe('bed');
    expect(artFor('BRIMNES gardırop')).toBe('wardrobe');
    expect(artFor('HEMNES komodin')).toBe('drawers');
    expect(artFor('HEKTAR yer lambası')).toBe('lamp');
    expect(artFor('STOENSE halı')).toBe('rug');
    expect(artFor('MATILDA tül perde')).toBe('curtain');
    expect(artFor('Ayna')).toBe('mirror');
    expect(artFor('IKEA 365+ tencere')).toBe('pot');
    expect(artFor('FÖRNUFT çatal bıçak')).toBe('cutlery');
    expect(artFor('VÅGSJÖN havlu')).toBe('towel');
    expect(artFor('ÄNGSLILJA nevresim')).toBe('bedding');
    expect(artFor('Saksı çiçeği')).toBe('plant');
  });

  it('prefers the more specific name', () => {
    expect(artFor('HEMNES TV ünitesi')).toBe('tv');
    expect(artFor('Buzdolabı')).toBe('fridge');
    expect(artFor('Masa lambası')).toBe('lamp');
    expect(artFor('Bulaşık makinesi')).toBe('washer');
    expect(artFor('Yatak örtüsü')).toBe('bedding');
    expect(artFor('Köşe koltuk takımı')).toBe('sofa');
    expect(artFor('Ayakkabılık')).toBe('drawers');
  });

  it('copes with capitals in Turkish', () => {
    expect(artFor('ÇAMAŞIR MAKİNESİ')).toBe('washer');
    expect(artFor('IŞIKLI AYNA')).toBe('mirror');
  });

  it('falls back to a box', () => {
    expect(artFor('Yeni eşya')).toBe('box');
    expect(artFor('')).toBe('box');
  });
});
