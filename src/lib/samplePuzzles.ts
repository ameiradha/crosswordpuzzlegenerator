import { CrosswordPuzzle } from '../types/crossword';
import { parseRawInput, generateCrosswordLayout } from './crosswordGenerator';

export interface PresetPuzzleDef {
  id: string;
  title: string;
  description: string;
  rawInput: string;
}

export const PRESET_PUZZLES: PresetPuzzleDef[] = [
  {
    id: 'fruit-market',
    title: 'Fruit Market & Orchards',
    description: 'A sweet introduction puzzle featuring popular orchard and tropical fruits.',
    rawInput: `APPLE, A crisp sweet red or green tree fruit;
BANANA, A long curved yellow fruit;
ORANGE, Citrus fruit known for vitamin C and vibrant color;
CHERRY, Small round stone fruit often atop ice cream;
MANGO, Juicy tropical stone fruit with golden flesh;
LEMON, Tart and sour yellow citrus fruit;
PEACH, Fuzzy skin stone fruit popular in summer;
GRAPE, Small sweet berry grown in clusters on vines`
  },
  {
    id: 'world-capitals',
    title: 'World Capitals',
    description: 'Test your global geography with iconic capital cities across continents.',
    rawInput: `PARIS, Capital of France known as the City of Light;
TOKYO, Bustling capital of Japan with neon skylines;
ROME, The Eternal City and historic capital of Italy;
CAIRO, Ancient Egyptian capital near the Nile pyramids;
MADRID, Royal capital city of Spain;
OTTAWA, Canadian capital located in Ontario;
BERLIN, Historic capital of Germany;
OSLO, Coastal fjord capital of Norway;
DUBLIN, Irish capital celebrated for literature and lively pubs`
  },
  {
    id: 'tech-code',
    title: 'Coding & Computer Science',
    description: 'Geeky crossword for developers, engineers, and tech enthusiasts.',
    rawInput: `PYTHON, Popular programming language named after a comedy troupe;
REACT, Declarative component-based UI library;
BROWSER, Application used to surf the World Wide Web;
SERVER, Dedicated system serving data and APIs to clients;
GITHUB, Cloud platform for Git version control and repositories;
DATABASE, Structured electronic collection of records;
KERNEL, Foundational core of an operating system;
ROUTER, Network hardware directing data packets;
SYNTAX, Grammatical rules governing programming code`
  },
  {
    id: 'cosmic-wonders',
    title: 'Cosmic Wonders',
    description: 'Journey across space, planets, nebulae, and stellar phenomena.',
    rawInput: `JUPITER, Largest gas giant in our solar system with a Great Red Spot;
GALAXY, Massive gravitationally bound system of billions of stars;
ECLIPSE, Celestial phenomenon when one body casts a shadow on another;
COMET, Icy small celestial body leaving a glowing dust tail;
ORBIT, Curved gravitational trajectory of a satellite or planet;
NEBULA, Luminous interstellar cloud of cosmic dust and gas;
METEOR, Shooting star created by debris entering the atmosphere;
SATURN, Ringed jewel planet of our solar system;
AURORA, Polar light display caused by solar winds`
  }
];

export function buildPresetPuzzles(): CrosswordPuzzle[] {
  return PRESET_PUZZLES.map(def => {
    const rawWords = parseRawInput(def.rawInput);
    const layout = generateCrosswordLayout(rawWords, { maxGridSize: 24, trials: 40 });
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      rawInput: def.rawInput,
      layout,
      createdAt: '2026-01-01T00:00:00.000Z',
      isCustom: false
    };
  });
}
