export interface ProvinceInfo {
  code: string;
  name: string;
  alias: string;
  region: 'Kurdistan' | 'Federal';
}

export const OFFICIAL_PROVINCES: ProvinceInfo[] = [
  // Estados / Regiões do Brasil & códigos de referência
  { code: 'SP', name: 'São Paulo', alias: 'São Paulo', region: 'Kurdistan' },
  { code: 'RJ', name: 'Rio de Janeiro', alias: 'Rio de Janeiro', region: 'Kurdistan' },
  { code: 'MG', name: 'Minas Gerais', alias: 'Minas Gerais', region: 'Kurdistan' },
  { code: 'PR', name: 'Paraná', alias: 'Paraná', region: 'Kurdistan' },
  { code: 'RS', name: 'Rio Grande do Sul', alias: 'Rio Grande do Sul', region: 'Kurdistan' },
  { code: 'SC', name: 'Santa Catarina', alias: 'Santa Catarina', region: 'Kurdistan' },
  { code: 'BA', name: 'Bahia', alias: 'Bahia', region: 'Federal' },
  { code: 'PE', name: 'Pernambuco', alias: 'Pernambuco', region: 'Federal' },
  { code: 'CE', name: 'Ceará', alias: 'Ceará', region: 'Federal' },
  { code: 'GO', name: 'Goiás', alias: 'Goiás', region: 'Federal' },
  { code: 'DF', name: 'Distrito Federal', alias: 'Brasília', region: 'Federal' },
  { code: 'ES', name: 'Espírito Santo', alias: 'Espírito Santo', region: 'Federal' },
  { code: 'MT', name: 'Mato Grosso', alias: 'Mato Grosso', region: 'Federal' },
  { code: 'MS', name: 'Mato Grosso do Sul', alias: 'Mato Grosso do Sul', region: 'Federal' },
  { code: 'AM', name: 'Amazonas', alias: 'Amazonas', region: 'Federal' },
  { code: 'PA', name: 'Pará', alias: 'Pará', region: 'Federal' },
  { code: '21', name: 'São Paulo', alias: 'São Paulo', region: 'Kurdistan' },
  { code: '22', name: 'Campinas', alias: 'Campinas', region: 'Kurdistan' },
  { code: '23', name: 'Santos', alias: 'Santos', region: 'Kurdistan' },
  { code: '24', name: 'Ribeirão Preto', alias: 'Ribeirão Preto', region: 'Kurdistan' },
  { code: '25', name: 'Sorocaba', alias: 'Sorocaba', region: 'Kurdistan' },
];

export const OLD_PLATE_CITIES = [
  'São Paulo',
  'Campinas',
  'Santos',
  'Ribeirão Preto',
  'Sorocaba',
  'Rio de Janeiro',
  'Belo Horizonte',
  'Curitiba',
  'Porto Alegre',
  'Brasília',
  'Outras Cidades',
];

export const OLD_PLATE_CATEGORIES = [
  'Particular',
  'Comercial / Aluguel',
  'Carga / Pesado',
  'Agrícola',
  'Construção',
  'Motocicleta',
  'Oficial / Governamental',
];

// Letras oficiais de placas Mercosul e Séries
export const UNIFIED_PLATE_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
  'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'BR', 'OF', 'SP', 'RJ', 'MG', 'PR', 'RS',
];
